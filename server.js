const express = require('express');
const mysql = require('mysql');
const app = express();
const session = require('express-session');

// 環境変数
const dotenv = require('dotenv');
const result = dotenv.config();

// パスワードハッシュ化
const bcrypt = require('bcrypt');
const { raw } = require('body-parser');

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

// セッション管理
app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);


app.get('/login',(req,res)=>{
res.render('login.ejs');
});

// ログイン認証機能（DBのusers使用)
app.post('/login',(req,res)=>{
  const email = req.body.email;
  connection.query(
    'select * from admins where email=?',
    [email],
    (error,results)=>{
      console.log(results)
      if(results.length > 0){
        const plain = req.body.password
        const hash = results[0].password
        bcrypt.compare(plain, hash, (error, isEqual) =>{
          if(isEqual){
            req.session.adminId = results[0].id;
            res.redirect('/dashboard');
          }else{
            res.redirect('/login');
          }
        });
      }else{
        res.redirect('/login');
      }
    }
  )
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

app.post('/user_new',(req,res)=>{
  const username=req.body.username;
  const email=req.body.email;
  const password=req.body.password;
connection.query(
  'insert into users(name,email,password) values(?,?,?)',
  [username,email,password],
  (error,results)=>{
    res.redirect('/dashboard');
  }
);
});



// 管理者ルーティング

// 管理者一覧
app.get('/admins', (req,res) => {
  connection.query(
    'SELECT * FROM admins',
    (error, results) => {
      res.render('admins.ejs', { admins: results })
    }
  )
});


// 管理者登録ページ
app.get('/admin_new', (req, res) => {
  res.render('admin_new.ejs')
});

// 管理者登録
app.post('/admin_new', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  bcrypt.hash(password, 10, (error, hash) => {
    connection.query(
      'INSERT INTO admins(email, password) VALUES (?, ?)',
      [email, hash],
      (error, results) => {
        res.render('admin_new.ejs')
      }
    )
  }
  )
});

// 管理者詳細ページ
app.get('/admin/:id', (req, res) => {
  const id = req.params.id;
  connection.query(
    'SELECT * FROM admins WHERE id =?',
    [id],
    (error, results) => {
      res.render('admin.ejs', { admin: results[0] });
    }
  )
});

// 管理者更新
app.post('/admin/update/:id', (req, res) => {
  const id = req.params.id;
  const email = req.body.email;
  const password = req.body.password;
  bcrypt.hash(password, 10, (error, hash) => {
    connection.query(
      'UPDATE admins SET email =?, password = ? WHERE id = ?',
      [email, hash, id]
    ),
    connection.query(
      'SELECT * FROM admins WHERE id = ?',
      [id],
      (error, results) => {
        res.render('admin.ejs', { admin: results[0] });
      }
    )
  })
});


app.listen(4000);