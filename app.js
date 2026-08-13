var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
var logger = require('morgan');

var session = require('express-session')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(  ({ secret: 'CakeZone', cookie: { maxAge: 60000 }}))

app.use(fileUpload());
const oneDay = 1000 * 60 * 60 * 24;
app.use(session({secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",saveUninitialized:true,cookie: { maxAge: oneDay },resave: true }));

app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
