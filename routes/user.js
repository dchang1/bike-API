var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var User = require('../models/user');
var Bike = require('../models/bike');
var Ride = require('../models/ride');
var Campus = require('../models/campus');

module.exports = function(passport) {
	router.get('/user', passport.authenticate('jwt', { session: false }), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
			if(err) throw err;
			res.json({"user": user});
		})
	})
	
	router.get('/rides', passport.authenticate('jwt', { session: false }), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
			if(err) throw err;
			Ride.find({_id: user.pastRides}, function(err, rides) {
				res.json({"rides": rides});
			})
		})
	})

	router.get('/favoriteBikes', passport.authenticate('jwt', { session: false }), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
			if(err) throw err;
			Bike.find({number: user.favoriteBikes}, function(err, bikes) {
				res.json({"bikes": bikes});
			})
		})
	})
	return router;
}
