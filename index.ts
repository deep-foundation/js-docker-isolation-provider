import express from 'express';
import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "@deep-foundation/deeplinks/imports/client";
import memoize from 'lodash/memoize'

const memoEval = memoize(eval);

const app = express();
let initiated;

const HASURA_PATH = process.env.HASURA_PATH || 'localhost:8080';
const HASURA_SSL = process.env.HASURA_SSL || 0;

const toJSON = (data) => JSON.stringify(data, Object.getOwnPropertyNames(data), 2);

app.use(express.json());
app.get('/healthz', (req, res) => {
  res.json('ok');
});
app.post('/init', (req, res) => {
  res.json('ok');
});
app.post('/call', async (req, res) => {
  try 
  {
    console.log({ body: req?.body });
    const token = req?.body?.params?.jwt;
    if (!token) throw new Error('No token provided');
    initiated = memoEval(req?.body?.params?.code);
    if (typeof initiated !== 'function')
    {
      throw new Error("Executed handler's code didn't return a function.");
    }

    const apolloClient = generateApolloClient({
      path: `${HASURA_PATH}/v1/graphql`,
      ssl: !!+HASURA_SSL,
      token,
    });

    const deepClient = new DeepClient({ apolloClient });
    const result = await initiated({ deep: deepClient }); // Supports both sync and async functions the same way
    console.log('call result', result);
    res.json({ resolved: result });
  }
  catch(rejected)
  {
    const processedRejection = JSON.parse(toJSON(rejected));
    console.log('rejected: ', processedRejection);
    res.json({ rejected: processedRejection });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Listening ${process.env.PORT} port`);
});