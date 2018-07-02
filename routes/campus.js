var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Bike = require('../models/bike');
var Campus = require('../models/campus');
var Ride = require('../models/ride');
var User = require('../models/user');
var password = process.env.new_campus;

module.exports = function(passport) {

	//New Campus
	router.post('/campus', function(req, res) {
		if(req.body.password==password) {
			let newCampus = new Campus({
				name: req.body.name
				//geofence
			})
			newCampus.save().then(async function(campus) {
				res.json({success: true})
			}).catch(function(err) {
				res.json({sucess: false, message: 'Campus already exists.'})
			})
		} else {
			res.json({success: false, message: 'You do not have permission.'});
		}
	})

	//Delete Campus
	router.post('/campus/delete', function(req, res) {
		if(req.body.password==password) {
			Campus.deleteOne({name: req.body.campus}, function(err) {
				if(err) throw err;
				res.json({success: true});
			})
		} else {
			res.json({success: false, message: 'You do not have permission.'})
		}
	})

	//Get Campus Information
	router.get('/campus/:name', passport.authenticate('jwt', {session: false}), function(req, res) {
		Campus.findOne({name: req.params.name}, function(err, campus) {
			if(err) throw err;
			res.json({"campus": campus});
		})
	})

	//Get List of Campus names only
	router.get('/campuslist', function(req, res) {
		Campus.find({}, function(err, campuses) {
			if(err) throw err;
			let campusNames = campuses.map(function(campus) {
				return campus.name;
			})
			res.json({"campuses": campusNames})
		})
	})

	//Get all Campus information
	router.get('/campuses', passport.authenticate('jwt', {session: false}), function(req, res) {
		Campus.find({}, function(err, campuses) {
			if(err) throw err;
			res.json({"campuses": campuses})
		})
	})

	//Get all rides for a campus
	router.get('/campus/rides/:name', passport.authenticate('jwt', {session: false}), function(req, res) {
		Ride.find({campus: req.query.name}, function(err, rides) {
			if(err) throw err;
			res.json({"rides": rides});
		})
	})

	//Get all bikes for a campus
	router.get('/campus/bikes/:name', passport.authenticate('jwt', {session: false}), function(req, res) {
		Bike.find({campus: req.query.name}, function(err, bikes) {
			if(err) throw err;
			res.json({"bikes": bikes});
		})
	})
	
	return router;
}
