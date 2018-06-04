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
  time: {type: Number},
  distance: {type: Number},
  rating: {type: Number},
  inRide: {type: Boolean, default: true}
});

// Export schema =====================================================================================================================================================================
module.exports = mongoose.model('Ride', rideSchema);
