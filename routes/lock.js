var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Bike = require('../models/bike');
var Campus = require('../models/campus');
var Ride = require('../models/ride');
var User = require('../models/user');
var Lock = require('../models/lock');
var password = process.env.new_bike;

module.exports = function(passport) {

	router.get('/lock/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		Lock.findOne({number: req.params.id}, function(err, lock) {
			if(err) throw err;
			res.json({"lock": lock})
		})
	})

  router.post('/gpsEvent', function(req, res) {
	  if(req.body.password==password) {
	  	Lock.findOne({lockID: req.body.coreid}, function(err, lock) {
      if(err) throw err;
      lock.currentPosition = req.body.data.split(',');
      lock.save().then(async function(savedLock) {
        Bike.findOne({number: savedLock.bike}, function(err, bike) {
          if(err) throw err;
          bike.currentPosition = req.body.data.split(',');
          //if(bike outside fence)
          Ride.findById(bike.currentRide, function(err, ride) {
            if(err) throw err;
            if(ride) {
              ride.route.push(req.body.data.split(','));
              ride.save(function(err, savedRide) {
								if(err) throw err;
								res.json({success: true});
							});
            }
          })
        })
      })
    })
	  }
  })

	router.post('/lock', function(req, res) {
		Bike.findOne({bikeID: req.body.lock}, function(err, bike) {
			if(err) throw err;
			Ride.findById(bike.currentRide, function(err, ride) {
				if(err) throw err;
				if(ride) {
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
						User.findOne({email: savedRide.user}, function(err, user) {
							user.pastRides.push(savedRide._id);
							user.save(function(err, savedUser) {
								res.json({success: true});
							})
						})
					})
				})
			})
				} else {
					res.json({success: false});
				}
			})
		})
	})


	router.post('/newLock', function(req, res) {
		if(req.body.password==password) {
			let newLock = new Lock({
				lockID: req.body.id,
				bike: req.body.bike
			})
			newLock.save(function(err, savedLock) {
				if(err) throw err;
				res.json({success: true});
			})
		} else {
			res.json({success: false, message: 'You do not have permission.'})
		}
	})

	return router;
}
