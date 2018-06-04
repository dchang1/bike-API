var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Bike = require('../models/bike');
var Campus = require('../models/campus');
var Ride = require('../models/ride');
var User = require('../models/user');
var request = require('request');

module.exports = function(passport) {

	router.get('/ride/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		Ride.findById(req.params.id, function(err, ride) {
			if(err) throw err;
			res.json({"ride": ride});
		})
	})

	router.post('/newRide', passport.authenticate('jwt', {session: false}), function(req, res) {
		//unlock bike
		var url =
		request({url: url, json: true}, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				let newRide = new Ride({
					//startPosition
					//route
					user: req.user.email,
					bike: req.body.bike
				})
				newBike.save().then(async function(bike) {
					res.json({success: true})
				}).catch(function(err) {
					res.json({sucess: false, message: 'Bike did not unlock.'});
				})
			}
		})
	})

	router.post('/endRide/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		Ride.findById(req.params.id, function(err, ride) {
			if(err) throw err;
			ride.endTime = Date.now();
			ride.time = ride.endTime - ride.startTime;

		})
	})

	router.get('/rideList', passport.authenticate('jwt', {session: false}), function(req, res) {
		Ride.find({}, function(err, rides) {
			if(err) throw err;
			res.json({"rides": rides});
		})
	})

	return router;
}
