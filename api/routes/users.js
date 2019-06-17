const express=require('express');
const router=express.Router();
const mongoose=require('mongoose');
const User=require('../models/user.js');
const jwt=require('jsonwebtoken');
var Cryptr=require('cryptr');
var cryptr=new Cryptr('vimala');
var bcrypt=require('bcrypt-nodejs');
var token;
var dbo;
var MongoClient=require('mongodb').MongoClient;
var url='mongodb://localhost:27017/authentication';

MongoClient.connect(url, {useNewUrlParser:true},function(err, db) {
  if(err) throw err;
    console.log("Database created!");
    dbo=db.db("authentication");
  //MongoClient.connect("mongodb://localhost:27017/", {useNewUrlParser:true},function(err,db){
    dbo.createCollection("account");
    dbo.createCollection("token");
    //db.close();
  });


router.get('/',(req,res,next)=>{
  res.sendFile(__dirname +'/ui.html');
});



var check = function (req, res, next)  {
  console.log("in check fun");
  const header = token;
  if(req.session.userId){
  console.log(header);
  if(header) {
     /*const bearer = header.split(' ');
      const token = bearer[1];
      req.token = token;*/
      console.log("in func"+token);
      jwt.verify(token, 'key', (err, authorizedData) =>{
        if(err){
          
         /* res.status(500).json({
            message:"error"
          });*/
          var myquery = { token:req.session.userId };
              var newvalues = { $set: {status:"Inactive" } };
              dbo.collection("token").updateOne(myquery, newvalues, function(err, res) {

              });
              req.session.userId="";
        }
        else{
          
          req.session.userId=token;
        }
      
      });
  } else {
      //If header is undefined return Forbidden (403)
      res.sendStatus(403).json({
        code:403,
        message:"error"
      });
  }
}
else{
  req.token="";

}
next();
}



router.get('/sign_up.html',(req,res,next)=>{
  if(req.session.userId){
      //res.redirect('/profile');
      res.sendFile(__dirname +'/profile1.html');
  }
  else{
    //res.redirect('/sign_up.html');
    res.sendFile(__dirname +'/sign_up.html');
  }
  
});



router.get('/login.html',(req,res,next)=>{
  if(req.session.userId){
    res.sendFile(__dirname +'/profile1.html');
  }
 else{
   //res.redirect('/login.html');
   res.sendFile(__dirname +'/login.html');
 }
});
//create a account in db
router.post('/sign_up',(req,res,next)=>{
    console.log("in post");
console.log(req.body.emailid+" "+req.body.password);


if(req.body.emailid && req.body.password){



  var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if((req.body.emailid).match(mailformat))
  {
    dbo.collection("account").find({emailid:req.body.emailid}).toArray(function(err,db){
      //User.find({emailid:req.body.emailid})
     // .exec()
      //.then(user =>{
          if (db.length>=1) {
          return res.status(409).json({
            code : 409,
            message:"Username already exist"
          });
      } else{
    
          //bcrypt.hash(req.body.password,10, (err,hash) =>{
          
          const user = ({
            emailid: req.body.emailid,
            password: cryptr.encrypt(req.body.password),
            unique_id:Date.now()
          });
  
          dbo.collection("account").insertOne(user,function(err,data){
            if(err){
              res.status(500).json({
                code : 500,
                message: 'Incorrect Email id or Password'
              });   
            
            }
            else{
            console.log('1 document insert');
            res.status(201).json({
              code : 201,
              message: 'Successfully signed in'
            });
            }
          });
  /*
  
          user
          .save()
          .then(result=>{
              console.log(result)
            res.status(201).json({
              code : 201,
              message: 'Successfully signed in'
            });
           
          }).catch(err =>{
            console.log(err);
            res.status(500).json({
              code : 500,
              message: 'Incorrect Email id or Password'
            });
          });
      }
  });*/
  }
  });
  }
  else
  {
  
  return res.status(500).json({
    code:500,
    message:"wrong email format"
  });
  }


  
}
else{
    res.status(404).json({
        code : 404,
        message: 'Enter all the field'
      });
}
    });



//login 
router.post('/login',(req,res,next)=>{
  console.log("in login");
  if(req.body.emailid && req.body.password){

    dbo.collection("account").find({emailid:req.body.emailid}).toArray(function(err,db){
      console.log("in"+db.emailid);
    
      if(err){
          res.status(500).json({
            code:500,
            message:err
          });
      }
      else{
        if (db.length>=1) {
           if(cryptr.decrypt(db[0].password)==req.body.password){
                            

                              token=jwt.sign({emailid:req.body.emailid},'key',{ expiresIn: '1m' });
                              req.session.userId=token;
                              
                    
                              console.log(db[0].unique_id);
                              dbo.collection("token").findOne({id:db[0].unique_id},function(err,data){
                            console.log(data);
                              if(data!=null){
                                console.log("update");
                                  var myquery = { id: db[0].unique_id};
                                  var newvalues = { $set: {token:token,status:"active" } };
                                  dbo.collection("token").updateOne(myquery, newvalues, function(err, res) {
                                  });
                              }
                              else{
                                      console.log("insert");              
                                      const token_value=({
                                          token:token,
                                          status:"active",
                                          id:db[0].unique_id
                                      });
                            
                                      dbo.collection("token").insertOne(token_value,function(err,data){
                              
                                      });
                              }
                            
                            });

                res.status(200).json({
                  code : 200,
                  message: 'successfully login'
                });
           }
           else{
                  res.status(500).json({
                    code : 500,
                    message: 'password error' 
                  });
           }
          }
          else{
            res.status(500).json({
              code : 500,
              message: 'user not exist!!'
            });
          }
        }
      });

  }//if end
  else{
  res.status(404).json({
    code : 404,
    message: 'Enter all the field'
  });

  }
});


router.use(check);

//remove
router.post('/remove',(req,res,next)=>{
          console.log("in remove");
          console.log(req.body.emailid);
          dbo.collection("account").findOne({emailid:req.body.emailid},function(err,result){
          
            if(err){
             console.log("err");
            }
            else{
              console.log(result);
            }
              });
        

        
          dbo.collection("account").deleteOne({emailid:req.body.emailid},function(err,result){
        
          if(err){
                res.status(500).json({
                  code : 500,
                  message : 'not such a document'
                });
          }
          else{
            console.log(result);

                res.status(200).json({
                  code : 200,
                  message : 'document removed'
                });
          }
  });


});
/*User.remove({_id:req.body._id})
.exec()
.then(user =>{

  res.status(500).json({
  code : 500,
  message: 'Document removed'
  });
})
.catch(err =>{
  res.status(500).json({
    code : 500,
    message: 'Error'
  });
});*/

//const http = require('http');
//UI profile

/*
router.get('/profile.html',(req,res,next)=>{


  const https = require("https");
  const url = "https://localhost:3000/user/profile";
  https.get(url, res => {
    res.setEncoding("utf8");
    let body = "";
    res.on("data", data => {
      body += data;
    });
    res.on("end", () => {
      body = JSON.parse(body);
      console.log(body);
    });
  });
});
*/
  /*const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/user/profile',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'bearer'+token
    }
  };
  const req1 = http.request(options, (res1) => {
    var data;
    data = "";
    console.log(`statusCode: ${res1.statusCode}`)
    res1.on('data', function(chunk) {
       data += chunk;
  });
  res1.on('end', function() {
    res.send(data);
})
  })
  
  
  
  req1.end();

  
});
*/
router.get('/profile',(req,res,next)=>{
  if(req.session.userId){
  res.sendFile(__dirname+'/profile1.html');
  }
  else{
    res.sendFile(__dirname+'/login.html');
  }
});

router.get('/profileget',(req,res,next)=>{
if(req.session.userId){
  dbo.collection("account").find({}).toArray(function(err,result){
    if(err){
      res.status(500).json({
        code:500,
        message:err
      });
    }
    else{

      console.log("length : "+result.length);
      result.forEach((result,index)=>{
        //data+={"emailid":doc.emailid};
          //data+=',';
        console.log("index : "+ index+"  "+result.emailid);
      });

      res.status(200).json({
        message:result
      });
    }
  });
}
else{
  res.sendFile(__dirname+'/login');
}

});









//get profile
router.get('/profile...',(req,res,next)=>{
    //console.log("in profile",req.session.userId);
 //jwt.verify(req.token, 'key', (err, authorizedData) => {
   console.log("in profile");
   
   req.session.userId=req.token;
   console.log(req.session.userId);
   if(req.session.userId){
    //jwt.verify(req.token, 'key', (err, authorizedData) => {
    //User.findById(req.session.userId)
    //.exec(function (error, user) res.sendFile(__dirname+'/login.html'); {
      /*if (err) {
        return res.status(500).json({
          code:500,
          message:"error"
        });
       
      } else {
       // if (user===null) {
         // res.sendFile(__dirname+'/login.html');
          //var err = new Error('Not authorized! Go back!');
          //err.status = 400;
          //return next(err);
      //  } else {
          */
        dbo.collection("account").find({}).toArray(function(err,result){
          if(err){
            res.status(500).json({
              code:500,
              message:err
            });
          }
          else{

            console.log("length : "+result.length);
            result.forEach((result,index)=>{
              //data+={"emailid":doc.emailid};
                //data+=',';
              console.log("index : "+ index+"  "+result.emailid);
            });

            res.render(__dirname+'/views/profile.ejs',{error:result});
          }
        });
/*
         User.find((err,doc)=>{
          if(err){
             return next(err);
           }
            var data="";
              console.log("length : "+doc.length);
              doc.forEach((doc,index)=>{
                //data+={"emailid":doc.emailid};
                  //data+=',';
                console.log("index : "+ index+"  "+doc.emailid);
              });
              console.log("redirect to ejs");
              //res.render('profile',{error:doc});*/
  //            console.log();

    //          res.render(__dirname+'/views/profile.ejs',{error:doc});
              /*res.status(200).json({
                message:"success",
                
              });*/
 //           });*/
             // console.log(authorizedData[0].emailid);
            //  res.render(__dirname+'/views/profile.ejs' , {error : doc});
            
          //});
                
/*
            User.find({})
            .exec()
            .then(user=>{
              console.log(user);
              User.count({}, function(err, count){
                console.log( "Number of docs: ", count );
            });
          });
         var i=1;
            var data='<div style="padding-left:1000px;"><a href="logout.html"><button>Logout</button></a></div><br><br><div style="padding-left:500px"><table border="1" ></div>';
            
            data+='<tr><td colspan="2">'+"UserId"+'</td></tr>';
            User.find()
            .then((cities) => {
        
              
                cities.forEach((doc) => {
                  data+= '<tr><td>'+i+'</td><td>'+doc.emailid+'</td><td><button id='+doc._id+'>'+"remove"+'</button></td></tr>';
            //console.log(doc.emailid);
            //data+=doc.emailid;
            i+=1;
          });
          data+='</table>';// <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.0/jquery.min.js"></script><script >$(this).click(function() {var postData = {_id:$(this).attr("id")};var saveData = $.ajax({type: "POST",url: "http://localhost:3000/user/remove",data: postData,dataType: "json",success: function(resultData, textStatus, xhr) { console.log("--->>"+textStatus);var res="http://localhost:3000/user/profile";window.location=res;},error: function(xhr, textStatus,exception) {alert(xhr.responseJSON.message); } } </script>'
          
           
          data+= '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.0/jquery.min.js"><//script>'
          data+='<script>$(document).ready(function(){$("button").submit(function(e){ e.preventDefault();'
                 data+=' var postData = {_id:$(this).attr("id")};';
                 
                 data+= 'var saveData = $.ajax({type: \'POST\',url: "http://localhost:3000/user/remove", data: postData,dataType: "json",';
                      data+='success: function(resultData, textStatus, xhr) { console.log(\'--->>\'+textStatus);var res="http://localhost:3000/user/profile";window.location=res;},';
                      data+='error: function(xhr, textStatus,exception) { alert(xhr.responseJSON.message);}  }); }); });<//script>';
          
          console.log(data);
          //res.render(__dirname+'/views/profile.ejs' , {error : data});
          res.send(data);
  })
        
               
              //res.sendFile(__dirname +'/profile.html');
                      
            .catch(err=>{
              res.status(404).json({
                code:404,
                message:error
              });
            });
          /*
          res.status(200).json({
              code : 200,
              message:'in profile'
          });



        }
      //}
   // });
  //}*/
      }
  else{
    res.status(404).json({
      code:404,
      message:err
    });
  }
});


//logout
router.get('/logout.html',(req,res,next)=>{
    if (req.session.userId) {
      console.log("session "+req.session.userId+"  token  "+token);
        // delete session object
        req.token="";
        dbo.collection("token").findOne({token:req.session.userId},function(err,data){
                       console.log("in logout"+data);
        });     
          
              var myquery = { token:req.session.userId };
              var newvalues = { $set: {status:"Inactive" } };
              dbo.collection("token").updateOne(myquery, newvalues, function(err, res) {

              });
            
        req.session.destroy(function (err) {
          if (err) {
            return next(err);
          } else {
           return res.redirect('./');
           /* res.status(200).json({
                code:200,
                message:'Successfully logout'
            });*/
          }
        });
      }
});


//delete a specific document from the db
router.delete('/:emailId',(req,res,next)=>{
    User.remove({emailid:req.params.emailId}).exec()
    .then(result=>{
        console.log(result)
      res.status(201).json({
        code : 201,
        message: 'Email_id is removed from the db'
      });
    })
    .catch(err =>{
      console.log(err);
      res.status(500).json({
        code : 500,
        error: err
      });
    });
});


module.exports=router;