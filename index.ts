import express from 'express';

const app = express();
let initiated;

app.use(express.json());
app.get('/healthz', (req, res)=>{
  res.status(200);
});
app.post('/init', (req, res)=>{
  console.log('req?.body', req?.body);
  initiated = eval(req?.body?.code);
  console.log('initiated', initiated);
  res.json('ok');
});
app.post('/eval', (req, res)=>{
  typeof initiated === 'function' ? res.json(initiated(req.body)) : res.json({error: 'init error'});
});
  
app.listen(process.env.PORT, () => {
  console.log(`Hello bugfixers! Listening ${process.env.PORT} port`);
})