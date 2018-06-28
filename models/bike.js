var mongoose = require('mongoose');

var bikeSchema = new mongoose.Schema({
  createdAt: {type: Date, default: Date.now},
  number: {type: Number},
  owner: {type: String},
  name: {type: String},
  color: {type: String},
  type: {type: String},
  batteryLife: {type: Number},
  rides: [{type: mongoose.Schema.Types.ObjectId, ref: 'Ride'}],
  totalHours: {type: Number, default: 0},
  totalDistance: {type: Number, default: 0},
  rating: [{type: Number}],
  campus: {type: String}, //campus name
  currentPosition: [{type: Number}],
  currentRide: {type: mongoose.Schema.Types.ObjectId, ref: 'Ride'},
  outsideFence: {type: Boolean, default: false},
  lockID: {type: Number},
  online: {type: Boolean, default: false}
});

// Export schema =====================================================================================================================================================================
module.exports = mongoose.model('Bike', bikeSchema);
