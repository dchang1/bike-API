var mongoose = require('mongoose');

var bikeSchema = new mongoose.Schema({
  createdAt: {type: Date, default: Date.now},
  number: {type: Number},
  ownerEmail: {type: String},
  ownerName: {type: String},
  name: {type: String},
  color: {type: String},
  type: {type: String},
  size: {type: String},
  numFavorites: {type: Number, default: 0},
  batteryLife: {type: Number},
  rides: [{type: mongoose.Schema.Types.ObjectId, ref: 'Ride'}],
  totalHours: {type: Number, default: 0},
  totalDistance: {type: Number, default: 0},
  rating: {type: Number},
  campus: {type: String}, //campus name
  currentPosition: {type: [Number], default: [39.905022, -75.354034], required: true},
  currentRide: {type: mongoose.Schema.Types.ObjectId, ref: 'Ride'},
  outsideFence: {type: Boolean, default: false},
  lockID: {type: String},
  online: {type: Boolean, default: false},
  hub: {type: String, default: ""},
  bleMAC: {type: String}
});

// Export schema =====================================================================================================================================================================
module.exports = mongoose.model('Bike', bikeSchema);
