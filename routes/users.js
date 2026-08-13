const { json } = require('express');
var express = require('express');
var router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

var mysql      = require('mysql');;
var connection = mysql.createConnection({
  host     : process.env.host,
  user     : process.env.user,
  password : process.env.password,
  database : process.env.database
});

connection.connect(function(err){
  if(!err){
    console.log("database is connected");
  } else {
    console.log("error connecting database");
  }
});

function isAuthenticated (req, res, next) {
  if(req.session.user){
    next();
  } else {
    res.redirect('/login');
  }
}

/* GET dashboard page. */
router.get('/',isAuthenticated, function(req, res, next) {
  res.render('users/dashboard');
});

/* GET users listing. */
router.get('/profile',isAuthenticated, function(req, res, next) {
  res.render('users/user_profile');
});

module.exports = router;
