var mongoose = require('mongoose');

var rideSchema = new mongoose.Schema({
  startTime: {type: Date, default: Date.now},
  endTime: {type: Date},
  startPosition: [{type: Number}],
  endPosition: [{type: Number}],
  route: [[{type: Number}]],
  user: {type: String}, //email
  bike: {type: Number}, //bike number
  outsideFence: {type: Boolean, default: false},
  time: {type: Number}, //hours
  distance: {type: Number}, //km
  campus: {type: String},
  rating: {type: Number},
  calories: {type: Number},
  inRide: {type: Boolean, default: true},
  startHub: {type: String},
  endHub: {type: String}
});

// Export schema =====================================================================================================================================================================
module.exports = mongoose.model('Ride', rideSchema);
