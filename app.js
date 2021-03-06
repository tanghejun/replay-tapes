var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var db = require('./db')

var metas = require('./routes/metas');
var events = require('./routes/events');
var sessions = require('./routes/sessions');
var feedback = require('./routes/feedback');

var app = express();

// Connect to Mongo on start
db.get((err, conn) => {
  if(err) {
    console.log(err);
  } else {
    console.log('connected to mongodb');
  }
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// host replay chrome extension
app.get('/replay.crx', (req, res) => {
  res.set({
    'Content-Type': 'application/x-chrome-extension',
  })
  let options = {
    root: __dirname + '/public'
  }
  res.sendFile('replay.crx', options, function(err) {
    if(err) {
      res.status(err.status).end()
    } else {
      console.log('file sent');
    }
  })
})

app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

app.use('/metas', metas);
app.use('/events', events);
app.use('/sessions', sessions);
app.use('/feedback', feedback);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
