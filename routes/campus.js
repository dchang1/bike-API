var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Bike = require('../models/bike');
var Campus = require('../models/campus');
var Ride = require('../models/ride');
var User = require('../models/user');
var password = process.env.new_campus;

module.exports = function(passport) {
	router.post('/campus', function(req, res) {
		if(req.body.password==password) {
			let newCampus = new Campus({
				name: req.body.name,
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

	router.get('/campus/:name', passport.authenticate('jwt', {session: false}), function(req, res) {
		Campus.findOne({name: req.params.name}, function(err, campus) {
			if(err) throw err;
			res.json({"campus": campus});
		})
	})

	router.get('/campuslist', function(req, res) {
		Campus.find({}, function(err, campuses) {
			if(err) throw err;
			let campusNames = campuses.map(function(campus) {
				return campus.name;
			})
			res.json({"campuses": campusNames})
		})
	})

	router.get('/campuses', passport.authenticate('jwt', {session: false}), function(req, res) {
		Campus.find({}, function(err, campuses) {
			if(err) throw err;
			res.json({"campuses": campuses})
		})
	})

	return router;
}
