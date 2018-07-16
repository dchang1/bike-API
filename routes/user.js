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
			res.json({"user": user});
		})
	})

	//Get all rides
	router.get('/user/rides', passport.authenticate('jwt', { session: false }), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
			if(err) throw err;
			Ride.find({_id: user.pastRides}, function(err, rides) {
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
