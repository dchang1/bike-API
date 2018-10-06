var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var crypto = require('crypto'),
    algorithm = 'aes192',
    pass = 'd6F3Efeq';
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

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,pass)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,pass)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

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
							var token = encrypt(req.body.email.toLowerCase());
	            newUser.save().then(async function(user) {
								let options = {
				    	    auth: {
				    		    api_user: username,
				            api_key: password
				          }
				        }
				        let client = nodemailer.createTransport(sgTransport(options));
				        let email = {
				          from: 'support@taiga.bike',
				          to: user.email,
				          subject: 'Welcome to Taiga!',
									text: 'Welcome!'
				          //text: 'Welcome! taiga://verify/' + token
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

	router.get('/resend', passport.authenticate('jwt', {session: false}), function(req, res) {
		if(req.user) {
			let options = {
				auth: {
					api_user: username,
					api_key: password
				}
			}
			let client = nodemailer.createTransport(sgTransport(options));
			let email = {
				from: 'support@taiga.bike',
				to: req.user.email,
				subject: 'Welcome to Taiga!',
				text: 'Welcome! taiga://verify/' + encrypt(req.user.email.toLowerCase())
			 };
			client.sendMail(email, function(err){
				if(err) throw err;
				res.json({success: true})
			});
		} else {
			res.json({success: false})
		}
	})

	router.get('/verify/:token', passport.authenticate('jwt', {session: false}), function(req, res) {
    if(req.user) {
      var token = decrypt(req.params.token);
      if(token == req.user.username) {
        User.findOne({username: req.user.username}, function(err, user) {
          user.verified = true;
          user.save(function(err, savedUser) {
            if(err) throw err;
            res.json({success: true});
          });
        })
      } else {
        res.json({success: false});
      }
    } else {
			res.json({success: false});
    }
  })

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
            res.json({success: true, token: 'JWT ' + token, firstName: user.firstName, lastName: user.lastName, email: user.email, campus: user.campus, userType: user.userType, verified: user.verified, totalDistance: user.totalDistance, totalRideTime: user.totalRideTime, totalRides: user.pastRides.length});
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
            res.json({success: false, message: 'No account with that email address exists.'});
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
          from: 'support@taiga.bike',
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
      res.json({success: true, token: 'JWT ' + jwtoken})
    });
  })

	//Reset Password
  router.post('/reset', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.body.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            res.json({success: false, message: 'Password reset token is invalid or has expired.'});
          } else if (req.body.newPassword !== req.body.confirmNewPassword) {
          	res.json({success: false, message: "Passwords don't match."})
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
          from: 'support@taiga.bike',
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
      res.json({success: true});
    });
  });


	//Change User Information
	router.post('/updateFirstName', passport.authenticate('jwt', {session: false}), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
			user.firstName = req.body.firstName;
			user.save(function(err, savedUser) {
				if(err) throw err;
				res.json({success: true});
			})
		})
	})

	router.post('/updateLastName', passport.authenticate('jwt', {session: false}), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
			user.lastName = req.body.lastName;
			user.save(function(err, savedUser) {
				if(err) throw err;
				res.json({success: true});
			})
		})
	})

	router.post('/updateEmail', passport.authenticate('jwt', {session: false}), function(req, res) {
		User.findOne({email: req.body.email}, function(err, foundUser) {
			if(foundUser) {
				res.json({success: false, message: "User already exists with that email."});
			} else {
				User.findOne({email: req.user.email}, function(err, user) {
					user.email = req.body.email;
					user.save(function(err, savedUser) {
						if(err) throw err;
						res.json({success: true});
					})
				})
			}
		})
	})

	router.post('/verify', passport.authenticate('jwt', {session: false}), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (isMatch && !err) {
          res.json({success: true});
        } else {
          res.json({success: false, message: 'Authentication failed. Incorrect password.'});
        }
      });
    });
	})

	router.post('/updatePassword', passport.authenticate('jwt', {session: false}), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
      if (err) throw err;
			if(req.body.newPassword !== req.body.confirmNewPassword) {
				res.json({success: false, message: "Passwords do not match."})
			} else {
				user.password = req.body.newPassword;
				user.save(function(err, savedUser) {
					if(err) throw err;
					res.json({success: true});
				})
			}
    });
	})

	return router;
}
