//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// Initialize session
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

// Initialize passport; Also use passport for dealing with sessions
app.use(passport.initialize());
app.use(passport.session());

// Connect to mongoDB server
mongoose.set("strictQuery", false);

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}, (err)=> {
  if(err) {
    console.log(err);
  } else {
    console.log("Successfully connected");
  }
});

// Create Schema
const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});
// hash, salt passwords, save users to database
userSchema.plugin(passportLocalMongoose);

// Mongoose model
const User = mongoose.model("User", userSchema);

// Allows passport to access user identification
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res) {
  req.logout(function(err) {
     if (err) { return next(err); }
     res.redirect('/');
});
});

// If the user registers, Secrets page is rendered
app.post("/register", function(req, res) {

  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
    });
    }
  });

});









app.listen(3000, function() {
  console.log("Server started on port 3000");
})
