import express from 'express';
import { generateApolloClient } from "@deep-foundation/hasura/client.js";
import { DeepClient, parseJwt } from "@deep-foundation/deeplinks/imports/client.js";
import { gql } from '@apollo/client/index.js';
import memoize from 'lodash/memoize.js';
import http from 'http';
// import { parseStream, parseFile } from 'music-metadata';
import { createRequire } from 'node:module';
import bodyParser from 'body-parser';
const require = createRequire(import.meta.url);

const memoEval = memoize(eval);

const app = express();

const GQL_URN = process.env.GQL_URN || 'localhost:3006/gql';
const GQL_SSL = process.env.GQL_SSL || 0;

const requireWrapper = (id: string) => {
  // if (id === 'music-metadata') {
  //   return { parseStream, parseFile };
  // }
  return require(id);
}

DeepClient.resolveDependency = requireWrapper;

const toJSON = (data) => JSON.stringify(data, Object.getOwnPropertyNames(data), 2);

const makeFunction = (code: string) => {
  const fn = memoEval(code);
  if (typeof fn !== 'function')
  {
    throw new Error("Executed handler's code didn't return a function.");
  }
  return fn;
}

const makeDeepClient = (token: string) => {
  if (!token) throw new Error('No token provided');
  const decoded = parseJwt(token);
  const linkId = decoded?.userId;
  const apolloClient = generateApolloClient({
    path: GQL_URN,
    ssl: !!+GQL_SSL,
    token,
  });
  const deepClient = new DeepClient({ apolloClient, linkId, token }) as any;
  return deepClient;
}

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.get('/healthz', (req, res) => {
  res.json({});
});
app.post('/init', (req, res) => {
  res.json({});
});
app.post('/call', async (req, res) => {
  try {
    console.log('call body params', req?.body?.params);
    const { jwt, code, data } = req?.body?.params || {};
    const fn = makeFunction(code);
    const deep = makeDeepClient(jwt);
    const result = await fn({ data, deep, gql, require: requireWrapper }); // Supports both sync and async functions the same way
    console.log('call result', result);
    res.json({ resolved: result });
  }
  catch(rejected)
  {
    const processedRejection = JSON.parse(toJSON(rejected));
    console.log('rejected', processedRejection);
    res.json({ rejected: processedRejection });
  }
});

app.use('/http-call', async (req, res, next) => {
  try {
    const options = decodeURI(`${req.headers['deep-call-options']}`) || '{}';
    console.log('deep-call-options', options);
    const { jwt, code, data } = JSON.parse(options as string);
    const fn = makeFunction(code);
    const deep = makeDeepClient(jwt);
    await fn(req, res, next, { data, deep, gql, require: requireWrapper }); // Supports both sync and async functions the same way
  }
  catch(rejected)
  {
    const processedRejection = JSON.parse(toJSON(rejected));
    console.log('rejected', processedRejection);
    res.json({ rejected: processedRejection }); // TODO: Do we need to send json to client?
  }
});

http.createServer({ maxHeaderSize: 10*1024*1024*1024 }, app).listen(process.env.PORT);
console.log(`Listening ${process.env.PORT} port`);