import express from 'express';

const app = express();
app.use(express.json());
app.use('/init', (req, res, next)=>{
  console.log(req);
});
app.use('/eval', (req, res, next)=>{
  console.log(req);
});

app.listen(process.env.PORT, () => {
  console.log(`Hello bugfixers! Listening ${process.env.PORT} port`);
})