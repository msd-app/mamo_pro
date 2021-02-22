const express = require('express');
const mysql = require('mysql');
const app = express();

//css、画像の読み込み用
app.use(express.static('public'));

//POSTで送られたreq.body.[name属性に定義した値]を受け取る
app.use(express.urlencoded({extended: false}));

//mysqlに接続
const connection = mysql.createConnection({
  host: '52.194.222.85',
  user: 'root',
  password: 'root',
  database: 'mamo_db'
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

app.get('/dashboard',(req,res)=>{
res.render('dashboard.ejs');
});

app.get('/clients',(req,res)=>{
res.render('clients.ejs');
});

app.get('/users',(req,res)=>{
res.render('users.ejs');
});



app.listen(4000);