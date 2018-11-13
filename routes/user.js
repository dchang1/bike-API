var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var User = require('../models/user');
var Bike = require('../models/bike');
var Ride = require('../models/ride');
var Campus = require('../models/campus');

module.exports = function(passport) {

	//Get all user information
	router.get('/user', passport.authenticate('jwt', { session: false }), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
			if(err) throw err;
			res.json({verified: user.verified, firstName: user.firstName, lastName: user.lastName, email: user.email, campus: user.campus, userType: user.userType, verified: user.verified, totalDistance: user.totalDistance, totalRideTime: user.totalRideTime, totalRides: user.pastRides.length});
		})
	})

	//Get all rides
	router.get('/user/rides/:page', passport.authenticate('jwt', { session: false }), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
			if(err) throw err;
			Ride.find({_id: user.pastRides}).limit(5).skip(5*req.params.page).exec(function(err, rides) {
				res.json({"rides": rides});
			})
		})
	})

	//Get favorite bikes
	router.get('/user/favoriteBikes', passport.authenticate('jwt', { session: false }), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
			if(err) throw err;
			Bike.find({number: user.favoriteBikes}, function(err, bikes) {
				res.json({"bikes": bikes});
			})
		})
	})

	//Get campus Information
	router.get('/user/campus', passport.authenticate('jwt', {session: false}), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
			if(err) throw err;
			Campus.find({name: user.campus}, function(err, campus) {
				res.json({"campus": campus});
			})
		})
	})

	return router;
}
