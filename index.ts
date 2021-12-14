import express from 'express';

const app = express();
let initiated;

const testCode = '(()=>{return console.log})()';

app.use(express.json());
app.use('/init', (req, res, next)=>{
  initiated = eval(testCode);
  res.json('ok');
});
app.use('/eval', (req, res, next)=>{
  initiated ? res.json(initiated(req.query)) : res.json({error: 'not initiated'});
});

app.listen(process.env.PORT, () => {
  console.log(`Hello bugfixers! Listening ${process.env.PORT} port`);
})