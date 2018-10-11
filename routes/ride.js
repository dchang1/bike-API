var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var Bike = require('../models/bike');
var Campus = require('../models/campus');
var Ride = require('../models/ride');
var User = require('../models/user');
var Hub = require('../models/hub');
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

function closestHub(currentPosition, hubs) {
  if(hubs) {
    for(var i=0; i<hubs.length; i++) {
      if(distance(currentPosition[0], currentPosition[1], hubs[i].location[0], hubs[i].location[1]) < hubs[i].radius) {
        return Promise.resolve(hubs[i]);
      }
    }
  }
  return "";
}

function inside(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point[0], y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    console.log("INSIDE", inside);
    return inside;
};

module.exports = function(passport) {

	//Get Ride Information
	router.get('/ride/:id', passport.authenticate('jwt', {session: false}), function(req, res) {
		Ride.findById(req.params.id, function(err, ride) {
			if(err) throw err;
			res.json({"ride": ride});
		})
	})

  //BLE new ride
  router.post('/newBLERide', passport.authenticate('jwt', {session: false}), function(req, res) {
    //req.body.bike = req.body.bike.substr(req.body.bike.length - 6);
		Bike.findOne({number: req.body.bike}, function(err, bike) {
			if(err) throw err;
      if(bike) {
        let newRide = new Ride({
          startPosition: bike.currentPosition,
          startTime: Date.now(),
          user: req.user.email,
          bike: req.body.bike,
          campus: bike.campus,
          startHub: bike.hub
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
      } else {
        res.json({success: false, message: 'Bike offline.'});
      }
    })
	})


	//New Ride
	router.post('/newRide', passport.authenticate('jwt', {session: false}), function(req, res) {
    //req.body.bike = req.body.bike.substr(req.body.bike.length - 6);
		Bike.findOne({number: req.body.bike}, function(err, bike) {
			if(err) throw err;
      if(bike) {
        let newRide = new Ride({
          startPosition: bike.currentPosition,
          startTime: Date.now(),
          user: req.user.email,
          bike: req.body.bike,
          campus: bike.campus,
          startHub: bike.hub
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
        /*
        var url = "https://api.particle.io/v1/devices/" + bike.lockID + "/X";
  			request.post({url: url, form: {"access_token": particle}}, function (error, response, body) {
  				if (!error && response.statusCode === 200) {
  					let newRide = new Ride({
  						startPosition: bike.currentPosition,
  						startTime: Date.now(),
  						user: req.user.email,
  						bike: req.body.bike,
  						campus: bike.campus,
              startHub: bike.hub
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
  				} else {
            res.json({success: false, message: 'Bike offline.'});
          }
  			})*/
      } else {
        res.json({success: false, message: 'Bike does not exist.'});
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
			ride.time = (ride.endTime - ride.startTime)/3600000;
			ride.inRide = false;
			ride.route.push(req.body.position.split(','));
      ride.calories = req.body.calories;
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
              user.totalRideTime += savedRide.time;
              user.totalDistance += savedRide.distance;
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
          if(bike.rating) {
            bike.rating = (bike.rating*(bike.rides.length-1) + Number(req.body.rating))/(bike.rides.length);
          } else {
            bike.rating = req.body.rating;
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
        Hub.find({campus: bike.campus}, async function(err, hubs) {
          if(err) throw err;
          let hub = await closestHub(bike.currentPosition, hubs);
          Campus.findOne({name: bike.campus}, function(err, campus) {
            if(err) throw err;
            Ride.findById(bike.currentRide, function(err, ride) {
    					if(err) throw err;
    					if(ride) {
    						ride.endTime = Date.now();
    						ride.endPosition = bike.currentPosition;
    						ride.distance = distance(ride.startPosition[0], ride.startPosition[1], ride.endPosition[0], ride.endPosition[1]);
                ride.time = (ride.endTime - ride.startTime)/3600000;
                ride.calories = 134*Math.exp(0.0725*(ride.distance/ride.time)) * ride.time;
                if(hub!="") {
                  ride.endHub = hub.name;
                } else {
                  ride.endHub = "";
                }
                ride.outsideFence = !inside([bike.currentPosition], campus.geofence);
                ride.inRide = false;
                ride.route = ride.route.concat([bike.currentPosition]);
    						ride.save(function(err, savedRide) {
    							if(err) throw err;
                  bike.currentRide = null;
                  bike.rides = bike.rides.concat([savedRide._id]);
                  bike.totalHours += savedRide.time;
                  bike.totalDistance += savedRide.distance;
                  if(hub!="") {
                    bike.hub = hub.name;
                  } else {
                    bike.hub = "";
                  }
                  bike.outsideFence = savedRide.outsideFence;
                  bike.save(function(err, savedBike) {
                    if(err) throw err;
                    User.findOne({email: savedRide.user}, function(err, user) {
                      user.pastRides = user.pastRides.concat([savedRide._id]);
                      user.totalRideTime += savedRide.time;
                      user.totalDistance += savedRide.distance;
                      user.save(function(err, savedUser) {
                        res.json({success: true});
                        if(hub!="") {
                          hub.rides.concat([savedRide._id]);
                          hub.bikes.concat([bike.number]);
                          hub.save(function(err, savedHub) {
                            res.json({success: true});
                          })
                        }
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
			})
		} else {
			res.json({success: false});
		}
	})

	return router;
}
