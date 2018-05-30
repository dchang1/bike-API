var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Bike = require('../models/bike');
var Campus = require('../models/campus');
var Ride = require('../models/ride');
var User = require('../models/user');
var password = process.env.new_bike;

module.exports = function(passport) {

	router.get('/bike/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		Bike.findOne({number: req.params.id}, function(err, bike) {
			if(err) throw err;
			res.json({"bike": bike})
		})
	})

	router.post('/bike', function(req, res) {
		if(req.body.password==password) {
			Bike.find({}, function(err, bikes) {
				let bikeNumbers = bikes.map(function(bike) {
					return bike.number;
				})
				let number = Math.random().toString().slice(2, 8);
				while(bikeNumbers.indexOf(number)!=-1) {
					number = Math.random().toString().slice(2, 8);
				}
				Campus.findOne({name: req.body.campus}, function(err, campus) {
					let newBike = new Bike({
						number: number,
						name: req.body.name,
						owner: req.body.owner,
						color: req.body.color,
						type: req.body.type,
						lockID: req.body.lockID,
						campus: campus._id
					})
					newBike.save().then(async function(bike) {
						campus.bikeList.push(bike._id);
						campus.save(function(err, savedCampus) {
							if(err) throw err;
							res.json({success: true});
						})
					})
				})
			})
		} else {
			res.json({success: false, message: 'You do not have permission.'})
		}
	})

	return router;
}
