import express from 'express';

const app = express();
let initiated;

const testCode = '(()=>{return console.log})()';

app.use(express.json());
app.get('/', (req, res)=>{
  res.status(200);
});
app.post('/init', (req, res)=>{
  console.log('code', req?.params?.code);
  initiated = eval(req?.params?.code);
  console.log('initiated', initiated);
  res.json('ok');
});
app.post('/eval', (req, res)=>{
  typeof initiated === 'function' ? res.json(initiated(req.query)) : res.json({error: 'not initiated'});
});
  
app.listen(process.env.PORT, () => {
  console.log(`Hello bugfixers! Listening ${process.env.PORT} port`);
})