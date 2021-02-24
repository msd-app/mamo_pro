const express = require('express');
const mysql = require('mysql');
const app = express();

const dotenv = require('dotenv');
const result = dotenv.config();

//css、画像の読み込み用
app.use(express.static('public'));

//POSTで送られたreq.body.[name属性に定義した値]を受け取る
app.use(express.urlencoded({extended: false}));

//mysqlに接続
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.DBUSER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});

connection.connect((err) => {
  // エラーが引数に渡されている場合、エラースタックを表示
  if (err) {
    console.log('error connecting: ' + err.stack);
    return;
  }
  console.log('success');
});


app.get('/login',(req,res)=>{
res.render('login.ejs');
});

// ログイン認証機能（DBのusers使用)
app.post('/login',(req,res)=>{
  const email=req.body.email;
  connection.query(
    'select * from users where email=?',
    [email],
    (error,results)=>{
      if(results.length > 0){
        if(req.body.password===results[0].password){
          console.log('認証に成功しました');
          res.redirect('/dashboard');
        }else{
          console.log('認証に失敗しました');
          res.redirect('/login');
        }
      }else{
        res.redirect('/login');
      }
    }
  );
});

app.get('/dashboard',(req,res)=>{
res.render('dashboard.ejs');
});

app.get('/clients',(req,res)=>{
res.render('clients.ejs');
});

app.get('/users',(req,res)=>{
res.render('users.ejs');
});

app.get('/user_new',(req,res)=>{
res.render('user_new.ejs');
});

console.log("host "+process.env.HOST)
console.log("user "+process.env.DBUSER)
console.log("password "+process.env.PASSWORD)
console.log("database "+process.env.DATABASE)

app.listen(4000);