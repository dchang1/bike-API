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
  
  router.post('/updateLock', function(req, res) {
    Lock.findOne({lockID: req.body.lock}, function(err, lock) {
      if(err) throw err;
      lock.currentPosition = req.body.data;
      lock.save().then(async function(savedLock) {
        Bike.findOne({number: savedLock.bike}, function(err, bike) {
          if(err) throw err;
          bike.currentPosition = req.body.data;
          //if(bike outside fence)
          Ride.findById(bike.currentRide, function(err, ride) {
            if(err) throw err;
            if(ride) {
              ride.route.push(req.body.data);
              ride.save();
            }
          })
        })
      })
    })
  })
 
	router.post('/lock', function(req, res) {
		if(req.body.password==password) {
			Bike.find({}, function(err, bikes) {
				let bikeNumbers = bikes.map(function(bike) {
					return bike.number;
				})
				let number = Math.random().toString().slice(2, 8);
				while(bikeNumbers.indexOf(number)!=-1) {
					number = Math.random().toString().slice(2, 8);
				}
				let newBike = new Bike({
					number: number,
					name: req.body.name,
					owner: req.body.owner,
					color: req.body.color,
					type: req.body.type,
					lockID: req.body.lockID,
					campus: req.body.campus
				})
				newBike.save().then(async function(bike) {
					campus.bikeList.push(bike._id);
					campus.save(function(err, savedCampus) {
						if(err) throw err;
						res.json({success: true});
					})
				})
			})
		} else {
			res.json({success: false, message: 'You do not have permission.'})
		}
	})

	return router;
}
