var express = require('express');
var router = express.Router();
var md5 = require('md5');
const dotenv = require('dotenv');
dotenv.config();

var mysql      = require('mysql');
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

/* GET register page. */
router.get('/register', function(req, res, next) {
  var err = "";
  res.render('register', {error_message : err});
});

/* Post register page. */
router.post('/register-insert', function(req, res, next) {

  connection.query("select * from tbl_users where username = ?", [req.body.username], function(err, rows) {
    console.log(rows);
    if(rows.length > 0) {
      var err = "Username is already exits!";
      res.render('register', {error_message : err});
    } else {
      var hashpassword = md5(req.body.password);

      const mybodydata = {
        user_name : req.body.name,
        user_email : req.body.email,
        username : req.body.username,
        password : hashpassword,
        user_role: 'Editor',
        user_status: '1',
        user_full_name: ''
      }

      connection.query("insert into tbl_users set ?", mybodydata, function(err, result) {
          if(err) {
              console.log(err);
              res.redirect('/register');
          } else {
              console.log(result);
              res.redirect('/login');
          }
      })
    }
  })
});

/* GET login page. */
router.get('/login', function(req, res, next) {
  var err = "";
  res.render('login', {error_message : err});
});

/* Post login page. */
router.post('/login-check', function(req, res, next) {

    var username = req.body.username;
    var password = md5(req.body.password);
    
    connection.query("select * from tbl_users where username = ? && password = ?", [username, password], function(err, result) {
      console.log(result);
      if(result != '') {
        if(result[0].user_status == '0'){
          req.session.user = result[0].user_name;
          req.session.user_id = result[0].user_id;
          req.session.user_role = result[0].user_role;
          if(req.session.user_role == 'Administrator'){
            res.redirect('/admin');
          } else {
            res.redirect('/users');
          }
        } else {
          var err = "Need permission from administrator";
          res.render('login', {error_message : err});
        }
        
      } else {
        var err = "Please enter a valid username or password";
        res.render('login', {error_message : err});
      }
    })
});

router.get('/logout',(req,res) => {
  if(req.session.user_role == 'Administrator'){
    req.session.destroy();
    res.redirect('/admin');
  } else {
    req.session.destroy();
    res.redirect('/users');
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  connection.query("select * from tbl_field_groups where page_name = 'Home'", function(err, field_groups) {
    //console.log(field_groups);
    if(field_groups.length > 0){
      connection.query("select * from `tbl_fields` JOIN `tbl_page_meta` ON `tbl_page_meta`.`fields_id` = `tbl_fields`.`fields_id` where `tbl_page_meta`.`field_groups_id` = ?", field_groups[0].field_groups_id, function(err, page_meta) {
        console.log(page_meta);
        var page_meta_list = [];
        var repeater_field_list = [];

        connection.query("select * from `tbl_fields` JOIN `tbl_repeater_fields` ON `tbl_repeater_fields`.`fields_id` = `tbl_fields`.`fields_id` where `tbl_fields`.`field_type_id` = 8 && `tbl_fields`.`field_groups_id` = ? ", field_groups[0].field_groups_id, function(err, repeater_fields) {
          //console.log(repeater_fields);
          if(page_meta){ 
            page_meta.forEach(entry => {
              if(entry.field_type_id == "8"){
                page_meta_list[entry.page_meta_name] = entry.field_sub_count;
              } else {
                page_meta_list[entry.page_meta_name] = entry.page_meta_value;
              }
              
              if(repeater_fields){ 
                var repeater_field = [];
                repeater_fields.forEach(repeater => {
                  if(entry.page_meta_name === repeater.fields_value ){
                    repeater_field_list[repeater.fields_value] = repeater_field;
                    repeater_field[repeater.repeater_field_name] = repeater.repeater_field_value;
                  }
                })
              }
            })
            console.log(page_meta_list);
            console.log(repeater_field_list);
            if(page_meta.length > 0){
              res.render('home', {pageMetaList : page_meta_list, repeaterFieldList : repeater_field_list});
            } else {
              res.render('home', {pageMetaList : page_meta_list, repeaterFieldList : repeater_field_list});
            }
          }
        })
      })
    } else {
      var field_groups = "";
      var repeater_field_list = "";
      res.render('home', {pageMetaList : field_groups, repeaterFieldList : repeater_field_list});
    }
  })
});

/* GET about page. */
router.get('/about', function(req, res, next) {
  res.render('about');
});

/* GET menu page. */
router.get('/menu', function(req, res, next) {
  res.render('menu');
});

/* GET team page. */
router.get('/team', function(req, res, next) {
  res.render('team');
});

/* GET service page. */
router.get('/service', function(req, res, next) {
  res.render('service');
});

/* GET testimonial page. */
router.get('/testimonial', function(req, res, next) {
  res.render('testimonial');
});

/* GET contact page. */
router.get('/contact', function(req, res, next) {
  res.render('contact');
});

module.exports = router;
