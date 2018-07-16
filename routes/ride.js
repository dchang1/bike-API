var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Bike = require('../models/bike');
var Campus = require('../models/campus');
var Ride = require('../models/ride');
var User = require('../models/user');
var request = require('request');
var particle = process.env.particle;
var webhook = process.env.webhook;

function distance(lat1, lon1, lat2, lon2) {
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p)/2 +
          c(lat1 * p) * c(lat2 * p) *
          (1 - c((lon2 - lon1) * p))/2;

  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

module.exports = function(passport) {

	//Get Ride Information
	router.get('/ride/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		Ride.findById(req.params.id, function(err, ride) {
			if(err) throw err;
			res.json({"ride": ride});
		})
	})

	//New Ride
	router.post('/newRide', passport.authenticate('jwt', {session: false}), function(req, res) {
		Bike.findOne({number: req.body.bike}, function(err, bike) {
			if(err) throw err;
      if(bike) {
        var url = "https://api.particle.io/v1/devices/" + bike.lockID + "/X";
  			request.post({url: url, form: {"access_token": particle}}, function (error, response, body) {
  				if (!error && response.statusCode === 200) {
  					let newRide = new Ride({
  						startPosition: bike.currentPosition,
  						startTime: Date.now(),
  						user: req.user.email,
  						bike: req.body.bike,
  						campus: bike.campus
  					})
  					newRide.save().then(async function(ride) {
  						bike.currentRide = ride._id;
  						bike.save(function(err, bike) {
  							if(err) throw err;
  							res.json({success: true, "rideID": ride._id, "bike": bike.number})
  						})
  					}).catch(function(err) {
  						res.json({sucess: false, message: 'Bike did not unlock.'});
  					})
  				}
  			})
      } else {
        res.json({success: false, message: 'Bike does not exist'});
      }
		})
	})

	//End Ride
	router.post('/endRide', passport.authenticate('jwt', {session: false}), function(req, res) {
		Ride.findById(req.body.ride, function(err, ride) {
			if(err) throw err;
			ride.endTime = Date.now();
			ride.endPosition = req.body.position.split(',');
			ride.distance = distance(ride.startPosition[0], ride.startPosition[1], ride.endPosition[0], ride.endPosition[1]);
			ride.time = (ride.endTime - ride.startTime)/1000;
			ride.inRide = false;
			ride.route.push(req.body.position.split(','));
			ride.save(function(err, savedRide) {
				Bike.findOne({number: savedRide.bike}, function(err, bike) {
					if(err) throw err;
					bike.currentRide = null;
					bike.rides.push(savedRide._id);
					bike.totalHours += savedRide.time;
					bike.totalDistance += savedRide.distance;
					bike.save(function(err, savedBike) {
						if(err) throw err;
						User.findOne({email: savedRide.user}, function(err, user) {
							user.pastRides.push(savedRide._id);
							user.save(function(err, savedUser) {
								res.json({success: true});
							})
						})
					})
				})
			})
		})
	})

	//Add Rating
	router.post('/rating', passport.authenticate('jwt', {session: false}), function(req, res) {
		Ride.findOne({_id: req.body.ride}, function(err, ride) {
			if(err) throw err;
			ride.rating = req.body.rating;
			ride.save(function(err, savedRide) {
				if(err) throw err;
				Bike.findOne({number: savedRide.bike}, function(err, bike) {
					if(err) throw err;
					if(bike.rides.length==1) {
						bike.rating = req.body.rating;
					} else {
						bike.rating = (bike.rating*(bike.rides.length-1) + Number(req.body.rating))/(bike.rides.length);
					}
					bike.save(function(err, savedBike) {
						if(err) throw err;
						res.json({success: true});
					})
				})
			})
		})
	})

	//List of all rides
	router.get('/rideList', passport.authenticate('jwt', {session: false}), function(req, res) {
		Ride.find({}, function(err, rides) {
			if(err) throw err;
			res.json({"rides": rides});
		})
	})

	//Lock Event webhook
	router.post('/lock', function(req, res) {
		if(req.body.password==webhook) {
			Bike.findOne({lockID: req.body.coreid}, function(err, bike) {
				if(err) throw err;
				Ride.findById(bike.currentRide, function(err, ride) {
					if(err) throw err;
					if(ride) {
						ride.endTime = Date.now();
						ride.endPosition = bike.currentPosition;
						ride.distance = distance(ride.startPosition[0], ride.startPosition[1], ride.endPosition[0], ride.endPosition[1]);
						ride.time = (ride.endTime - ride.startTime)/1000;
						ride.inRide = false;
						ride.route.push(bike.currentPosition);
						ride.save(function(err, savedRide) {
							if(err) throw err;
							bike.currentRide = null;
							bike.rides.push(savedRide._id);
							bike.totalHours += savedRide.time;
							bike.totalDistance += savedRide.distance;
							bike.save(function(err, savedBike) {
								if(err) throw err;
								User.findOne({email: savedRide.user}, function(err, user) {
									user.pastRides.push(savedRide._id);
									user.save(function(err, savedUser) {
										res.json({success: true});
									})
								})
							})
						})
					} else {
						res.json({success: false});
					}
				})
			})
		} else {
			res.json({success: false});
		}
	})

	return router;
}
