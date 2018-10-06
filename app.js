var dotenv = require('dotenv').config();
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var morgan = require('morgan');
var passport = require('passport');
var path = require('path')
var cors = require('cors');
var port =  process.env.PORT || 3000;
var routes = require('./routes/routes');
var bike = require('./routes/bike');
var campus = require('./routes/campus');
var ride = require('./routes/ride');
var user = require('./routes/user');
var hub = require('./routes/hub');

//Express configuration ==============================================================================================================================================================
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev'));


//Database configuration =============================================================================================================================================================
var MONGODB_URI = process.env.MONGODB_URI
mongoose.connect(MONGODB_URI)

//Routes =============================================================================================================================================================================
require('./config/passport')(passport);
app.use(routes(passport));
app.use(bike(passport));
app.use(campus(passport));
app.use(ride(passport));
app.use(user(passport));
app.use(hub(passport));

//Error handling =====================================================================================================================================================================
app.use(function(req, res, next) {
  var err = new Error('Not found');
  err.status = 404;
  next(err);
});

app.use(cors({origin: '*'}));

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

//====================================================================================================================================================================================
app.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});

module.exports = app;
