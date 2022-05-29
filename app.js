//jshint esversion:6
require('dotenv').config();
const express = require ("express");
const bodyParser = require ("body-parser");
const ejs = require ("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require('express-session')
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//Set up the app
const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

//Set up sessions and passport here
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {}
}));
app.use(passport.initialize());
app.use(passport.session());

//connect to MongoDB by specifying port to MongoDB server & the DB name
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://localhost:27017/UserDB');
}

//Create the schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String
});

// Modify the schema to use encryption/hashin strategies
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
userSchema.plugin(passportLocalMongoose);

//Create the Model (collection)
const User = new mongoose.model("User", userSchema);

//PassportLocal config - local strategy for authentication
passport.use(User.createStrategy()); //if missing, isAuthenticated does not work
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// no cache function for the secret pages (no back button after logout)
function nocache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

//Set up GET routes
app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", nocache, function(req, res){
  if (req.isAuthenticated()) {
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
      if (!err) {
        if(foundUsers){
          res.render("secrets", {usersWithSecrets: foundUsers});
        }
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/submit", nocache, function(req, res){
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res){
  req.logout(function(err){
    if (!err) {
      res.redirect("/");
    }
  });
});

//Set up POST routes
app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets")
      })
    }
  })
});
//bcrypt hash alternative to passport
// bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//   // Store hash in your password DB.
//   const user = new User ({
//     email: req.body.username,
//     password: hash
//   });
//   user.save(() => res.render("secrets"));
// });

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
});
//bcrypt hash alternative to passport
//   // User.findOne({email: req.body.username}, function(err, foundUser){
//   //   if (err) {
//   //     console.log(err);
//   //   } else if (foundUser) {
//   //     bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
//   //       if (result) {
//   //         res.render("secrets");
//   //       }
//   //     });
//   //     // if (foundUser.password === md5(req.body.password))
//   //   }
//   // });

app.post("/submit", function(req, res){
  User.findById(req.user.id, function(err, foundUser){
    if (!err) {
      if (foundUser) {
        foundUser.secret = req.body.secret;
        foundUser.save(()=>res.redirect("/secrets"));
      }
    }
  });
});

// Set up the app port
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
