const express=require('express');
const app=express();
var session = require('express-session');
const bodyParser=require('body-parser');
const mongoose=require('mongoose');
app.set('view engin','ejs');

var MongoClient=require('mongodb').MongoClient;
var url='mongodb://localhost:27017/authentication';

var dbhost='mongodb://localhost:27017/test1';
mongoose.connect(dbhost);
var db = mongoose.connection;

app.use(express.static('node_modules'));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.use(session({
    secret: 'work hard',
    resave: true,
    saveUninitialized: false,
  }));

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
  console.log("Connected to DB");
  //do operations which involve interacting with DB.
});

app.use(bodyParser.urlencoded({extened:true}));
app.use(bodyParser.json());

const signupRoutes=require('./api/routes/users.js');
app.use('/user',signupRoutes);
//const htmlRoutes=require('./api/routes/ui.html');
//app.use('/account',htmlRoutes);

app.use((req,res,next)=>{
    const error=new Error('not found');
    error.status=404;
    next(error);
    });
    app.use((error,req,res,next)=>{
        res.status(error.status ||500);
        res.status(500).json({
            error:{
                message:error.message
            }
        });
        });
    

module.exports=app;