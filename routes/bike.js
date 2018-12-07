var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Bike = require('../models/bike');
var Campus = require('../models/campus');
var Ride = require('../models/ride');
var User = require('../models/user');
var Hub = require('../models/hub');
var password = process.env.new_bike;
var webhook = process.env.webhook;

module.exports = function(passport) {

	//Get Bike Information
	router.get('/bike/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		Bike.findOne({number: req.params.id}, function(err, bike) {
			if(bike) {
				Campus.findOne({name: bike.campus}, function(err, campus) {
					if(err) throw err;
					res.json({success: true, "bike": bike, "geofence": campus.geofence});
				})
			} else {
				res.json({success: false, message: "Bike does not exist."})
			}
		})
	})

	//Get all Bikes in Campus
	router.get('/allCampusBikes', passport.authenticate('jwt', {session: false}), function(req, res) {
		Bike.find({campus: req.user.campus, currentRide: null, online: true, batteryLife: {$gt: 5}}, function(err, bikes) {
			if(err) throw err;
			res.json({"bikes": bikes});
		})
	})

	//Get all Bike Information
	router.get('/allBikes', passport.authenticate('jwt', {session: false}), function(req, res) {
		Bike.find({}, function(err, bikes) {
			if(err) throw err;
			res.json({"bikes": bikes});
		})
	})

	//Favorite a Bike
	router.post('/addBike', passport.authenticate('jwt', {session: false}), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
			if(err) throw err;
			Bike.findOne({number: req.body.bike}, function(err, bike) {
				if(err) throw err;
				if(bike) {
					bike.numFavorites++;
					bike.save(function(err, savedBike) {
						if(err) throw err;
						user.favoriteBikes = user.favoriteBikes.concat([req.body.bike]);
						user.save(function(err, savedUser) {
							if(err) throw err;
							res.json({success: true});
						})
					})
				} else {
					res.json({success: false});
				}
			})
		})
	})

	//Unfavorite a Bike
	router.post('/removeBike', passport.authenticate('jwt', {session: false}), function(req, res) {
		User.findOne({email: req.user.email}, function(err, user) {
			if(err) throw err;
			Bike.findOne({number: req.body.bike}, function(err, bike) {
				if(err) throw err;
				if(bike) {
					bike.numFavorites--;
					bike.save(function(err, savedBike) {
						if(err) throw err;
						user.favoriteBikes.splice(user.favoriteBikes.indexOf(req.body.bike), 1);
						user.save(function(err, savedUser) {
							if(err) throw err;
							res.json({success: true});
						})
					})
				} else {
					res.json({success: false});
				}
			})
		})
	})

	//New Bike
	router.post('/bike', function(req, res) {
		if(req.body.password==password) {
				let newBike = new Bike({
					number: req.body.number,
					name: req.body.name,
					ownerName: req.body.ownerName || "",
					ownerEmail: req.body.ownerEmail || "",
					color: req.body.color,
					type: req.body.type,
					lockID: req.body.lockID,
					campus: req.body.campus,
					size: req.body.size
				})
				newBike.save().then(async function(bike) {
					console.log("saved");
					Campus.findOneAndUpdate({name: req.body.campus}, {$push: {bikeList: bike.number}}, function(err, campus) {
						if(err) throw err;
						res.json({success: true});
					})
				})
		} else {
			res.json({success: false, message: 'You do not have permission.'})
		}
	})

	//Delete Bike
	router.post('/bike/delete', function(req, res) {
		if(req.body.password==password) {
			Bike.deleteOne({number: req.body.bikeNumber}, function(err) {
				if(err) throw err;
				Campus.update({}, {$pull: {bikeList: req.body.bikeNumber}}, function(err) {
					if(err) throw err;
					res.json({success: true});
				})
			})
		} else {
			res.json({success: false, message: 'You do not have permission.'})
		}
	})

	//GPS Event Webhook
	router.post('/gpsEvent', function(req, res) {
		if(req.body.password==webhook) {
			Bike.findOne({lockID: req.body.coreid}, function(err, bike) {
				if(err) throw err;
				bike.currentPosition = req.body.data.split(',');
				bike.save().then(async function(savedBike) {
					Ride.findById(bike.currentRide, function(err, ride) {
						if(err) throw err;
						if(ride) {
							ride.route = ride.route.concat([req.body.data.split(',')]);
							ride.save(function(err, savedRide) {
								if(err) throw err;
								res.json({success: true});
							});
						} else {
							res.json({success: true});
						}
					})
				}).catch(function(err) {
					res.json({sucess: false})
				})
			})
		} else {
			res.json({success: false});
		}
	})

	router.post('/batteryEvent', function(req, res) {
		if(req.body.password==webhook) {
			Bike.findOneAndUpdate({lockID: req.body.coreid}, {$set: {batteryLife: req.body.data}}, function(err) {
				if(err) throw err;
				//if below 3, send email
				res.json({success: true});
			})
		}
	})

	router.post('/bleMACEvent', function(req, res) {
		console.log(req.body);
		if(req.body.password==webhook) {
			Bike.findOneAndUpdate({lockID: req.body.coreid}, {$set: {bleMAC: req.body.data}}, function(err) {
				if(err) throw err;
				res.json({success: true});
			})
		}
	})

	router.get('/bleMAC/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		Bike.findOne({number: req.params.id}, function(err, bike) {
			if(err) throw err;
			res.json({success: true, bleMAC: bike.bleMAC});
		})
	})

	return router;
}
