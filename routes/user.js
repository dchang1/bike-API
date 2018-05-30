var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var User = require('../models/user');

module.exports = function(passport) {
	router.get('/users/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		User.findById(req.params.id, function(err, user) {
			if (err) {
				throw err;
			} else {
				res.json({
					"user": {
						username: user.username,
						firstName: user.firstName,
						lastName: user.lastName,
					}
				})
			}
		})
	})

	router.put('/users/:id/block', passport.authenticate('jwt', {session: false }), function(req, res) {
		User.findOneAndUpdate({_id: req.params.id}, {$push: {blockers: req.user._id}}, function(err, blockedUser) {
			if (err) {
				throw error;
			} else {
				User.findOneAndUpdate({_id: req.user._id}, {$push: {blocking: req.params.id}}, function(err, blockingUser) {
					if (err) {
						throw error;
					} else {
						res.json({success: true});
					}
				})
			}
		})
	})

	router.put('/users/:id/unblock', passport.authenticate('jwt', { session: false }), function(req, res) {
		User.findOneAndUpdate({_id: req.params.id}, {$pull: {blockers: req.user._id}}, function(err, blockedUser) {
			if (err) {
				throw error;
			} else {
				User.findOneAndUpdate({_id: req.user._id}, {$pull: {blocking: req.params.id}}, function(err, blockingUser) {
					if (err) {
						throw error;
					} else {
						res.json({success: true});
					}
				})
			}
		})
	})




	router.get('/user', passport.authenticate('jwt', { session: false }), function(req, res) {
		User.findById(req.user._id).populate({path: 'notifications', options: {limit:1}}).exec(function(err, user) {
			if (err)  {
				throw err;
			} else {
			  res.json({
				  "user": {
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            major: user.major || "",
            classYear: user.classYear || ""
          }
		    })
			}
		})
	})

	return router;
}
