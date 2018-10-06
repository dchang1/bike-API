var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Bike = require('../models/bike');
var Campus = require('../models/campus');
var Ride = require('../models/ride');
var User = require('../models/user');
var Hub = require('../models/hub');
var password = process.env.new_hub;

module.exports = function(passport) {

	//new hub
	router.post('/newHub', function(req, res) {
		if(req.body.password==password) {
			let newHub = new Hub({
				name: req.body.name,
				location: req.body.location.split(','),
				radius: req.body.radius,
				campus: req.body.campus
			})
			newHub.save(function(err, hub) {
				if(err) throw err;
				Campus.findOne({name: req.body.campus}, function(err, campus) {
					campus.hubs = campus.hubs.concat([hub._id])
					campus.save(function(err, savedCampus) {
						res.json({success: true});
					})
				})
			})
		}
	})

	//Delete hub
	router.post('/hub/delete', function(req, res) {
		if(req.body.password==password) {
			Hub.deleteOne({name: req.body.name}, function(err) {
				if(err) throw err;
				res.json({success: true});
			})
		} else {
			res.json({success: false, message: 'You do not have permission.'})
		}
	})

	//Get hub
	router.get('/hub', passport.authenticate('jwt', {session: false}), function(req, res) {
		Hub.findById(req.body.id, function(err, hub) {
			if(err) throw err;
			res.json({"hub": hub});
		})
	})

	//get list of hubs
	router.get('/hubs', passport.authenticate('jwt', {session: false}), function(req, res) {
		Hub.find({campus: req.user.campus}, function(err, hubs) {
			if(err) throw err;
			res.json({"hubs": hubs})
		})
	})

	return router;
}
