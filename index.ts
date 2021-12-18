import express from 'express';

const app = express();
let initiated;

const testCode = '(()=>{return console.log})()';

app.use(express.json());
app.get('/', (req, res)=>{
  res.status(200);
});
app.post('/init', (req, res)=>{
  console.log('req?.params', req?.params);
  console.log('req?.body', req?.body);
  initiated = eval(req?.body?.params?.code);
  console.log('initiated', initiated);
  res.json('ok');
});
app.post('/eval', (req, res)=>{
  typeof initiated === 'function' ? res.json(initiated(req.query)) : res.json({error: 'not initiated'});
});
  
app.listen(process.env.PORT, () => {
  console.log(`Hello bugfixers! Listening ${process.env.PORT} port`);
})