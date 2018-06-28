var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Bike = require('../models/bike');
var Campus = require('../models/campus');
var Ride = require('../models/ride');
var User = require('../models/user');
var request = require('request');
var particle = process.env.particle;

module.exports = function(passport) {

	router.get('/ride/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		Ride.findById(req.params.id, function(err, ride) {
			if(err) throw err;
			res.json({"ride": ride});
		})
	})

	router.post('/newRide', passport.authenticate('jwt', {session: false}), function(req, res) {
		//unlock bike
		Bike.findOne({number: req.body.bike}, function(err, bike) {
			if(err) throw err;
			var url = "https://api.particle.io/v1/devices/" + bike.lockID + "/X";
			request.post({url: url, form: {"access_token": particle}}, function (error, response, body) {
				if (!error && response.statusCode === 200) {
					let newRide = new Ride({
						startPosition: req.body.position,
						startTime: Date.now(),
						user: req.user.email,
						bike: req.body.bike
					})
					newRide.save().then(async function(ride) {
						Bike.findOne({number: ride.bike}, function(err, bike) {
							bike.currentRide = ride._id;
							bike.rides.push(ride._id);
							bike.save(function(err, bike) {
								if(err) throw err;
								res.json({success: true})
							})
						})
					}).catch(function(err) {
						res.json({sucess: false, message: 'Bike did not unlock.'});
					})
				}
			})
		})
	})

	router.post('/endRide/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		Ride.findById(req.params.id, function(err, ride) {
			if(err) throw err;
			ride.endTime = Date.now();
			ride.endPosition = req.body.position;
			//ride.distance = distance;
			ride.time = ride.endTime - ride.startTime;
			ride.rating = req.body.rating;
			ride.inRide = false;
			ride.route.push(req.body.position);
			ride.save(function(err, savedRide) {
				Bike.findOne({number: savedRide.bike}, function(err, bike) {
					if(err) throw err;
					bike.currentRide = "";
					bike.rating.push(savedRide.rating);
					//bike.totalHours += savedRide.time;
					//bike.totalDistance += savedRide.distance;
					bike.save(function(err, savedBike) {
						if(err) throw err;
						res.json({success: true});
					})
				})
			})
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
