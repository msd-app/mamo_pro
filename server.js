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
const { select } = require('async');
const { error } = require('console');

//css、画像の読み込み用
app.use(express.static('public'));

//POSTで送られたreq.body.[name属性に定義した値]を受け取る
app.use(express.urlencoded({extended: false}));

//mysqlに接続
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.DBUSER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  multipleStatements: true
});

console.log("host "+process.env.HOST)
console.log("user "+process.env.DBUSER)
console.log("password "+process.env.PASSWORD)
console.log("database "+process.env.DATABASE)

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

// ヘッダー用
app.use((req, res, next) => {
  if (req.session.adminId === undefined) {
    res.locals.isLoggedIn = false;
  } else {
    res.locals.adminName = req.session.adminName;
    res.locals.isLoggedIn = true;
  }
  next();
}); 


// セッションを確認
// app.use((req, res, next)=>{
//   if (req.session.adminId === undefined) {
//     console.log('ログインしていません');
//   } else {
//     console.log('ログインしています');
//   }
//   next();
// });

// ログイン
app.get('/login',(req,res)=>{
res.render('login.ejs',{ errors: [] } );
});

// ログイン認証機能
app.post('/login',(req, res, next) => {
  console.log(req.body)
  const email = req.body.email;
  const password = req.body.password;
  const errors = [];
  if (email === '') {
    errors.push('メールアドレスが空です');
  }
  if (password === '') {
    errors.push('パスワードが空です');
  }
  if (errors.length > 0) {
    res.render('login.ejs', { errors: errors });
  } else {
    next();
  }
},
(req,res)=>{
  const email = req.body.email;
  connection.query(
    'select * from admins where email=?',
    [email],
    (error,results)=>{
      if(results[0].status === 1){
        res.redirect('/login');
      }else{
        if(results.length > 0){
          const plain = req.body.password
          const hash = results[0].password
          bcrypt.compare(plain, hash, (error, isEqual) =>{ 
            if(isEqual){
              req.session.adminId = results[0].id;
              req.session.adminName = results[0].name;
              res.redirect('/dashboard');
            }else{
              res.redirect('/login');
            }
          });
        }else{
          res.redirect('/login');
        }
      }
    }
  )
});

// ログアウト
app.get('/logout', (req, res) => {
  req.session.destroy(error => {
    res.redirect('/login');
  });
});

// 全てのルーティングでセッション確認条件分岐
app.get('*', (req,res, next) => {
  if (req.session.adminId === undefined) {
    res.redirect('/login');
  }
  else{
    next()
  }
})

// postリクエスト制御
app.post('*', (req,res, next) => {
  if (req.session.adminId === undefined) {
    res.redirect('/login');
  }
  else{
    next()
  }
})


app.get('/dashboard',(req,res)=>{
res.render('dashboard.ejs');
});

//オーナー一覧表示
app.get('/clients',(req,res)=>{
  connection.query(
    'select id,name,tel,email from owners where status=1',
    (error,results)=>{
      res.render('clients.ejs',{owners:results});
    } 
  )
});

// オーナー新規追加ページ表示
app.get('/client_new',(req,res)=>{
res.render('client_new.ejs');
});

//オーナー新規追加機能（DB owners使用） 
app.post('/client_new',(req,res)=>{
const name=req.body.owners_name;
const email=req.body.email;
const tel=req.body.tel;
connection.query(
  'insert into owners(name,email,tel,status)values(?,?,?,1)',
  [name,email,tel],
  (errot,results)=>{
    res.redirect('/clients');
  }
)
});

// 各オーナーの情報表示
app.get('/client_page/:id',(req,res)=>{
  connection.query(
    'select * from owners where id=?',
    [req.params.id],
    (error,results)=>{
      res.render('client_page.ejs',{owners:results[0]});
    }
  )
});

// オーナーの情報削除
app.post('/client_delete/:id',(req,res)=>{
  connection.query(
    'update owners set status=0 where id=?',
    [req.params.id],
    (error,results)=>{
      res.redirect('/clients');
    }
  )
});

// オーナーの情報編集画面表示
app.get('/client_edit/:id',(req,res)=>{
connection.query(
  'select * from owners where id=?',
  [req.params.id],
  (error,results)=>{
    res.render('client_edit.ejs',{owners:results[0]});
  }
)
});

// オーナーの情報更新
app.post('/client_edit/:id',(req,res)=>{
  const name=req.body.oname;
  const tel=req.body.otel;
  const email=req.body.oemail;
connection.query(
  'update owners set name=?,tel=?,email=? where id=?',
  [name,tel,email,req.params.id],
  (error,results)=>{
    res.redirect('/clients');
  }
)
});

app.get('/users',(req,res)=>{
res.render('users.ejs');
});

app.get('/user_new',(req,res)=>{
res.render('user_new.ejs');
});

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
  res.render('admin_new.ejs', { errors: [] })
});

// 管理者登録
app.post('/admin_new',(req, res, next) => {
  console.log(req.body)
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const errors = [];
  if (name === '') {
    errors.push('管理者名が空です');
  }
  if (email === '') {
    errors.push('メールアドレスが空です');
  }
  if (password === '') {
    errors.push('パスワードが空です');
  }
  if (errors.length > 0) {
    res.render('admin_new.ejs', { errors: errors });
  } else {
    next();
  }
},
(req, res, next) => {
  console.log('メールアドレスの重複チェック');
  const email = req.body.email;
  const errors = [];
  connection.query(
    'SELECT * FROM admins WHERE email = ?',
    [email],
    (error, results) =>{
      if(results.length > 0){
        errors.push('管理者登録に失敗しました')
        res.render('admin_new.ejs', { errors: errors });
      }else{
        next();
      }
    }
    )
},
// 登録実行
(req, res) => {
  console.log(req.body)
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  bcrypt.hash(password, 10, (error, hash) => {
    connection.query(
      'INSERT INTO admins(name, email, password) VALUES (?, ?, ?)',
      [name, email, hash],
      (error, results) => {
        res.redirect(`/admin/${results.insertId}`)
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
      console.log(results)
      res.render('admin.ejs', { admin: results[0] });
    }
  )
});

// 管理者編集
app.get('/admin_edit/:id', (req, res) => {
  const id = req.params.id;
  connection.query(
    'SELECT * FROM admins WHERE id =?',
    [id],
    (error, results) => {
      console.log(results)
      res.render('admin_edit.ejs', { admin: results[0], errors:[] });
    }
  )
});

// 管理者更新
app.post('/admin/update/:id',(req, res, next) => {
  const id = req.params.id;
  const name = req.body.name;
  const email = req.body.email;
  const errors = [];
  if (name === '') {
    errors.push('管理者名が空です');
  }
  if (email === '') {
    errors.push('メールアドレスが空です');
  }
  if (errors.length > 0) {
    connection.query(
      'SELECT * FROM admins WHERE id =?',
      [id],
      (error, results) => {
      res.render('admin_edit.ejs', { admin: results[0], errors: errors });
      }
    )
  } else {
    next();
  }
},
(req, res) => {
  const id = req.params.id;
  const name = req.body.name;
  const email = req.body.email;
  const status = req.body.status;
  const password = req.body.password;
  console.log(bcrypt.hashSync(password, 10))
  console.log("----------------------")
  if(!password){
    console.log("aaghargh")
    console.log(bcrypt.hashSync(password, 10))
    console.log("----------------------")
    connection.query(
      'UPDATE admins SET name = ?, email = ?, status = ? WHERE id = ?',
      [name, email, status, id]
    )
  }else{
    bcrypt.hash(password, 10, (error, hash) => {
      console.log(bcrypt.hashSync(password, 10))
      console.log("----------------------")
      connection.query(
        'UPDATE admins SET name = ?, email = ?, password = ?, status = ? WHERE id = ?',
        [name, email, hash, status, id]
      )
    })
  }
  res.redirect(`/admin/${id}`)
});

// クリニックルーティング

// クリニック一覧
app.get('/clinics', (req, res)=>{
  connection.query(
    // 'SELECT shops.id, shops.name, shops.tel, shops.owner_id, owners.name FROM owners LEFT JOIN shops ON owners.id = shops.owner_id',
    `SELECT * FROM shops`,
    (error, results) => {
      console.log(results)
      res.render('clinics.ejs', { shops: results })
    }
  )
});

// クリニック詳細
app.get('/clinic/:id', (req, res)=>{
  const id = req.params.id;
  connection.query(
    'SELECT owners.name FROM owners JOIN shops ON owners.id = shops.owner_id WHERE shops.id = ? ; SELECT * FROM shops WHERE id = ? ',
    [id, id],
    (error, results) =>{
      console.log(results[0])
      res.render('clinic.ejs', {owner: results[0][0], shop: results[1][0]})
    }
  )
});

// クリニック編集
app.get('/clinic_edit/:id', (req, res)=>{
  const id = req.params.id;
  console.log("表示したいid " + id)
  connection.query(
    'SELECT * FROM owners; SELECT * FROM shops WHERE id = ?',
    [id],
    (error, results) => {
      if(error){
        console.log(error)
      }else{
      console.log(results[0])
      console.log("-----------------ここから店")
      console.log(results[1][0])
      res.render('clinic_edit.ejs',  {shop: results[1][0], owners: results[0], errors: [] } )
    }
    }
  )
});

//  クリニック更新
app.post('/clinic_update/:id',(req, res, next) => {
  const id = req.params.id;
  const name = req.body.name;
  const tel = req.body.tel;
  const errors = [];
  if (name === '') {
    errors.push('クリニック名が空です');
  }
  if (tel === '') {
    errors.push('電話番号が空です');
  }
  if (errors.length > 0) {
    connection.query(
      'SELECT * FROM owners; SELECT * FROM shops WHERE id = ?',
      [id],
      (error, results) => {
      res.render('clinic_edit.ejs', { shop: results[1][0], owners: results[0], errors: errors });
      }
    )
  } else {
    next();
  }
},
(req, res)=>{
  const id = req.params.id;
  const name = req.body.name;
  const tel = req.body.tel;
  const owner_id = req.body.owner_id;
  const status = req.body.status;
  connection.query(
    'UPDATE shops SET name = ?, tel = ?, owner_id =? , status = ? WHERE id = ?',
    [name, tel, owner_id, status, id],
  )
    res.redirect(`/clinic/${id}`)
});

// クリニック新規登録ページ
app.get('/clinic_new', (req, res)=>{
  connection.query(
    'SELECT * FROM owners',
    (error, results) => {
      res.render('clinic_new.ejs', { owners: results, errors: [] })
    }
  )
});

//  クリニック新規登録
app.post('/clinic_new', (req, res, next) => {
  const id = req.params.id;
  const name = req.body.name;
  const tel = req.body.tel;
  const errors = [];
  if (name === '') {
    errors.push('クリニック名が空です');
  }
  if (tel === '') {
    errors.push('電話番号が空です');
  }
  if (errors.length > 0) {
    connection.query(
      'SELECT * FROM owners',
      [id],
      (error, results) => {
      res.render('clinic_new.ejs', { owners: results, errors: errors });
      }
    )
  } else {
    next();
  }
},
(req, res)=>{
  const name = req.body.name;
  const tel = req.body.tel;
  const owner_id = req.body.owner_id;
  connection.query(
    'INSERT INTO shops(name, tel, owner_id) VALUES(?, ? ,?)',
    [name, tel, owner_id],
    (error, results) => {
      res.redirect(`/clinic/${results.insertId}`)
    }
  )
});

app.listen(4000);