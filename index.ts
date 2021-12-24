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
    console.log('req?.body', req?.body);
    initiated = eval(req?.body?.params?.code);
    console.log('initiated', initiated);
    res.json('ok');
  }
  catch(error)
  {
    console.log('error', JSON.stringify(error, null, 2));
    res.json('error');
  }
});
app.post('/call', (req, res)=>{
  try 
  {
    // typeof initiated === 'function' ? res.json(initiated(req.body)) : res.json({error: 'init error'});
    if (typeof initiated !== 'function') res.json({ rejected: { error: 'init error' }});
    const result = initiated(req.body);
    console.log('call result', result);
    res.json({ resolved: result });
  }
  catch(error)
  {
    console.log('error', JSON.stringify(error, null, 2));
    res.json({ rejected: { error: error?.message ?? error }});
  }
});
  
app.listen(process.env.PORT, () => {
  console.log(`Listening ${process.env.PORT} port`);
})