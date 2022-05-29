//jshint esversion:6
require('dotenv').config();
const express = require ("express");
const bodyParser = require ("body-parser");
const ejs = require ("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;

//connect to MongoDB by specifying port to MongoDB server & the DB name
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://localhost:27017/UserDB');
}

//Create the schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

//Create the Model (collection)
const User = new mongoose.model("User", userSchema);

//Set up the app
const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

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

//Set up POST routes
app.post("/register", function(req, res){

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    const user = new User ({
      email: req.body.username,
      password: hash
    });
    user.save(() => res.render("secrets"));
  });
});

app.post("/login", function(req, res){
  User.findOne({email: req.body.username}, function(err, foundUser){
    if (err) {
      console.log(err);
    } else if (foundUser) {
      bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
        if (result) {
          res.render("secrets");
        }
      });
      // if (foundUser.password === md5(req.body.password))
    }
  });
});

// Set up the app port
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
