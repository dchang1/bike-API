var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var User = require('../models/user');
var Bike = require('../models/bike');
var Ride = require('../models/ride');
var Campus = require('../models/campus');
var Report = require('../models/report');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var username = process.env.api_user;
var password = process.env.api_key;

module.exports = function(passport) {

  //Send a report
  router.post('/report', passport.authenticate('jwt', { session: false }), function(req, res) {
    Bike.findOne({number: req.body.bikeNumber}, function(err, bike) {
      if(err) throw err;
      if(bike) {
        let newReport = new Report({
          bikeNumber: req.body.bikeNumber,
          userEmail: req.user.email,
          lock: req.body.lock,
          brakes: req.body.brakes,
          tires: req.body.tires,
          spokes: req.body.spokes,
          chains: req.body.chains,
          handles: req.body.handles,
          frame: req.body.frame,
          seat: req.body.seat,
          pedal: req.body.pedal,
          lights: req.body.lights,
          kickstand: req.body.kickstand,
          other: req.body.other,
          comments: req.body.comments
        });
        newReport.save(function(err, savedReport) {
          if(err) throw err;
          let options = {
            auth: {
              api_user: username,
              api_key: password
            }
          }
          let client = nodemailer.createTransport(sgTransport(options));

          let email = {
            from: req.user.email,
            to: 'support@hive.bike',
            subject: 'New Report',
            text: JSON.stringify(savedReport)
          };
          client.sendMail(email, function(err){
            if(err) throw err;
            res.json({success: true});
          });
        })
      } else {
        res.json({success: false});
      }
    })
  })

	return router;
}
