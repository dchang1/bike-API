var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
var async = require('async');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var request = require('request');
var secret = process.env.secret;
var username = process.env.api_user;
var password = process.env.api_key;
var briteverify = process.env.briteverify;
var Bike = require('../models/bike');
var Campus = require('../models/campus');
var Ride = require('../models/ride');
var User = require('../models/user');

module.exports = function(passport) {

	//Regular User Signup
	router.post('/signup', function(req, res) {
		var url = 'https://bpi.briteverify.com/emails.json?address=' + req.body.email + '&amp;apikey=' + briteverify;
		request({
			url: url,
			json: true
			}, function (error, response, body) {
				if (!error && response.statusCode === 200) {
					if(body.status=="valid") {
						if(req.body.email.includes("@swarthmore.edu")) {
							let newUser = new User({
								email: req.body.email.toLowerCase(),
								password: req.body.password,
								firstName: req.body.firstName,
								lastName: req.body.lastName,
								campus: req.body.campus
							});
	            newUser.save().then(async function(user) {
								let options = {
				    	    auth: {
				    		    api_user: username,
				            api_key: password
				          }
				        }
				        let client = nodemailer.createTransport(sgTransport(options));
				        let email = {
				          from: 'support@renecycle.com',
				          to: user.email,
				          subject: 'Welcome to Renecycle!',
				          text: 'Welcome!'
				         };
				        client.sendMail(email, function(err){
									if(err) throw err;
									res.json({success: true})
				        });
	            }).catch(function(err) {
	               res.json({success: false, message: 'That email address already exists.'});
	       	    })
						} else {
							res.json({success: false, message: 'You must use a valid Swarthmore email.'});
						}
					} else {
						res.json({success: false, message: 'Please enter a valid email address.'});
					}
				}
		})
	});

	//Login
  router.post('/login', function(req, res) {
    User.findOne({
      email: req.body.email.toLowerCase()
    }, function(err, user) {
      if (err) throw err;
      if (!user) {
        res.send({success: false, message: 'Authentication failed. User not found.'});
      } else {
        user.comparePassword(req.body.password, function(err, isMatch) {
          if (isMatch && !err) {
            let token = jwt.sign({data: user}, secret);
            res.json({success: true, token: 'JWT ' + token, firstName: user.firstName, lastName: user.lastName, email: user.email, campus: user.campus, userType: user.userType});
          } else {
            res.json({success: false, message: 'Authentication failed. Incorrect password.'});
          }
        });
      }
    });
  });

	//Add Payment Information

	//Delete
	router.post('/delete', passport.authenticate('jwt', {session: false}), function(req, res) {
		User.deleteOne({email: req.user.email}, function(err) {
			if(err) throw err;
			res.json({success: true});
		})
	})

	//Forgot Password
  router.post('/forgot', function(req, res) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          let emailToken = buf.toString('hex');
          done(err, emailToken);
        });
      },
      function(emailToken, done) {
        User.findOne({email: req.body.email}, function(err, user) {
          if (!user) {
            res.send(401, {success: false, message: 'No account with that email address exists.'});
           return;
          }
          let jwtoken = jwt.sign({data: user}, secret);
          user.resetPasswordToken = emailToken;
          user.resetPasswordExpires = Date.now() + 36000000; // 1 hour

          user.save(function(err) {
            done(err, jwtoken, emailToken, user);
          });
        });
      },
      function(jwtoken, emailToken, user, done) {
        let options = {
    	    auth: {
    		    api_user: username,
            api_key: password
          }
        }

        let client = nodemailer.createTransport(sgTransport(options));

        let email = {
          from: 'support@renecycle.com',
          to: user.email,
          subject: 'Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Paste the following token ' + emailToken + ' into the token field to set a new password.\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
         };
        client.sendMail(email, function(err){
      	  done(err, jwtoken)
        });
      }
    ], function(err, jwtoken) {
      if (err) throw err;
      res.send({success: true, token: 'JWT ' + jwtoken})
    });
  })

	//Reset Password
  router.post('/reset', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.body.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            res.json(401, {success: false, message: 'Password reset token is invalid or has expired.'});
          } else if (req.body.newPassword !== req.body.confirmNewPassword) {
          	res.json(401, {success: false, message: "Passwords don't match."})
          } else {
            user.password = req.body.newPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.save(function(err) {
              done(err, user);
            });
          }
        });
      },
      function(user, done) {
        let options = {
          auth: {
    		    api_user: username,
            api_key: password
          }
        }

        let client = nodemailer.createTransport(sgTransport(options));

        let email = {
          from: 'support@renecycle.com',
          to: user.email,
          subject: 'Successful Password Reset',
          text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed. Login with your new password\n'
        };
        client.sendMail(email, function(err){
      	  done(err)
        });
      }
    ], function(err) {
      if (err) throw err;
      res.send({success: true});
    });
  });

	/*
	//Change User Information
	router.post('/editInfo', passport.authenticate('jwt', {session: false}), function(req, res) {
	})

	//Change Password
	router.post('/changePassword', passport.authenticate('jwt', {session: false}), function(req, res) {

	})

	//Change Payment Information
	router.post('/changePayment', passport.authenticate('jwt', {session: false}), function(req, res) {

	})
	*/
	return router;
}
