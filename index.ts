import express from 'express';

const app = express();
let initiated;

app.use(express.json());
app.get('/healthz', (req, res)=>{
  res.json('ok');
});
app.post('/init', (req, res)=>{
  try
  {
    console.log('req?.body: ', req?.body);
    initiated = eval(req?.body?.params?.code);
    console.log('initiated: ', initiated);
    if (typeof initiated !== 'function')
    {
      throw new Error("Executed handler's code didn't return a function.");
    }
    res.json('ok');
  }
  catch(error)
  {
    console.log('unhandled error: ', JSON.stringify(error, null, 2));
    res.json('error');
  }
});
app.post('/call', async (req, res)=>{
  try 
  {
    if (typeof initiated !== 'function')
    {
      throw new Error('Function was not initiated during init phase.');
    }
    const result = await initiated(req.body); // Supports both sync and async functions the same way
    console.log('call result', result);
    res.json({ resolved: result });
  }
  catch(rejected)
  {
    console.log('rejected: ', JSON.stringify(rejected, null, 2));
    res.json({ rejected });
  }
});
  
app.listen(process.env.PORT, () => {
  console.log(`Listening ${process.env.PORT} port`);
});