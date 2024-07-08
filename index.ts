import express from 'express';
import { generateApolloClient } from "@deep-foundation/hasura/client.js";
import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { DeepClient, parseJwt } from "@deep-foundation/deeplinks/imports/client.js";
import { gql } from '@apollo/client/index.js';
import { serializeError } from 'serialize-error';
import memoize from 'lodash/memoize.js';
import http from 'http';
// import { parseStream, parseFile } from 'music-metadata';
import { createRequire } from 'node:module';
import bodyParser from 'body-parser';
const require = createRequire(import.meta.url);

const memoEval = memoize(eval);

const app = express();

const GQL_URN = process.env.GQL_URN || 'host.docker.internal:3006/gql';
const GQL_SSL = process.env.GQL_SSL || 0;

const DEEPLINKS_HASURA_PATH = process.env.DEEPLINKS_HASURA_PATH || 'host.docker.internal:8080';
const DEEPLINKS_HASURA_SSL = !!(+process.env.DEEPLINKS_HASURA_SSL || 0);

const requireWrapper = (id: string) => {
  // if (id === 'music-metadata') {
  //   return { parseStream, parseFile };
  // }
  return require(id);
}

DeepClient.resolveDependency = requireWrapper;

const makeFunction = (code: string) => {
  const fn = memoEval(code);
  if (typeof fn !== 'function')
  {
    throw new Error("Executed handler's code didn't return a function.");
  }
  return fn;
}

const makeDeepClient = (token: string, path?: string, ssl?: boolean, secret?: string) => {
  if (!token) throw new Error('No token provided');
  const decoded = parseJwt(token);
  const linkId = decoded?.userId;
  const apolloClient = generateApolloClient({
    path: GQL_URN,
    ssl: !!+GQL_SSL,
    token,
  });

  const unsafe: any = {};
  if (secret) {
    unsafe.hasura = new HasuraApi({
      path,
      ssl,
      secret,
    });
  }

  const deepClient = new DeepClient({ apolloClient, linkId, token, unsafe }) as any;
  return deepClient;
}

const execute = async (args, options) => {
  const { jwt, secret, code, data, path, ssl } = options;
  const fn = makeFunction(code);
  const deep = makeDeepClient(jwt, path, ssl, secret);
  // await supports both sync and async functions the same way
  const result = await fn(...args, { data, deep, gql, require: requireWrapper });
  return result;
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
    const options = req?.body?.params || {};
    console.log('call options', options);
    const result = await execute([], options);
    console.log('call result', result);
    res.json({ resolved: result });
  }
  catch(rejected)
  {
    const processedRejection = serializeError(rejected);
    console.log('rejected', processedRejection);
    res.json({ rejected: processedRejection });
  }
});

app.use('/http-call', async (req, res, next) => {
  try {
    const options = JSON.parse(decodeURI(`${req.headers['deep-call-options']}`) || '{}');
    console.log('http call options', options);
    const result = await execute([req, res, next], options);
    console.log('http call result', result);
    return result;
  }
  catch(rejected)
  {
    const processedRejection = serializeError(rejected);
    console.log('rejected', processedRejection);
    res.json({ rejected: processedRejection }); // TODO: Do we need to send json to client? HTTP respone may not expect json output.
  }
});

http.createServer({ maxHeaderSize: 10*1024*1024*1024 }, app).listen(process.env.PORT);
console.log(`Listening ${process.env.PORT} port`);