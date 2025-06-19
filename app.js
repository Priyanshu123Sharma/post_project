const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const userModel = require('./models/user');
const postModel = require('./models/post');
const jwt = require('jsonwebtoken');


app.set('view engine' , 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(cookieParser());
app.get('/' , function(req,res){
    res.render('index');
})


app.get('/login' , function(req,res){
        res.render('login');
        
})

app.get('/logout' , function(req,res){
      res.cookie("Token" , "");
      res.redirect('/login');

})

app.get('/profile' ,isLoggedIn, async function(req,res){
     let user = await userModel.findOne({email:req.user.email}).populate("posts");
    
     res.render('profile' , {user});
      
})
 

app.get('/like/:id' ,isLoggedIn, async function (req,res){
    let post = await postModel.findOne({_id : req.params.id}).populate("user");

    if(post.Likes.indexOf(req.user.userid)===-1){
        post.Likes.push(req.user.userid);
    }
    else{
        post.Likes.splice(post.Likes.push(req.user.userid) ,1);
    }
   
    await post.save();
    res.redirect("/profile");
    
})

app.post('/post' ,isLoggedIn, async function(req,res){
    let user = await userModel.findOne({email:req.user.email});
    let {content} = req.body;
  let post = await postModel.create({
        user:user._id,
        content
    });
         
     user.posts.push(post._id);
    await user.save();
     res.redirect('/profile');
})

app.post("/login"  ,  async function(req,res){
    
    let { email , password} = req.body;
    let user = await userModel.findOne({email});
    if(!user) res.status(500).redirect('/login');

    bcrypt.compare(password , user.password , function(err,result){
           if(result){
            let token = jwt.sign({email:email , userid:user._id} , "shhh");
               res.cookie('Token' , token);
            res.redirect("/profile");
           }
           
    });
})

app.get("/edit/:id" ,  async function (req,res){
    let post = await postModel.findOne({_id:req.params.id}).populate("user")
    res.render('edit' , {post});
})


app.post("/update/:id" ,  async function (req,res){
    let post = await postModel.findOneAndUpdate({_id:req.params.id} , {content:req.body.content});
    res.redirect("/profile");
})

app.post('/register' , async function(req,res){
    let {username , name , age , email , password } = req.body;

    let user =  await userModel.findOne({email});
     if(user){
        return res.redirect("/login");
     }
    bcrypt.genSalt(10 , function(err,salt){
        bcrypt.hash(password , salt , async function(err,hash){
               let userCreate = await userModel.create({
        username,
        name,
        age,
        email,
        password:hash
    })
       let token = jwt.sign({email:email , userid:userCreate._id} , "shhh");
       res.cookie('Token' , token);
            res.redirect("/login");
        })
    })
    
})



function isLoggedIn(req,res,next){
     if(req.cookies.Token===""){
        res.send("login karo");
     }
     else{
     let data = jwt.verify(req.cookies.Token , "shhh");
     req.user = data;
     next();
     }
}
app.listen(4000,function(){
    console.log("chal gya");
})