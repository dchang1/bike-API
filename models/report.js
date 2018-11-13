var mongoose = require('mongoose');

var reportSchema = new mongoose.Schema({
  createdAt: {type: Date, default: Date.now},
  bikeNumber: {type: Number},
  userEmail: {type: String},
  lock: {type: Boolean, default: false},
  brakes: {type: Boolean, default: false},
  tires: {type: Boolean, default: false},
  spokes: {type: Boolean, default: false},
  chains: {type: Boolean, default: false},
  handles: {type: Boolean, default: false},
  frame: {type: Boolean, default: false},
  seat: {type: Boolean, default: false},
  pedal: {type: Boolean, default: false},
  lights: {type: Boolean, default: false},
  kickstand: {type: Boolean, default: false},
  other: {type: Boolean, default: false},
  comments: {type: String}
});

// Export schema =====================================================================================================================================================================
module.exports = mongoose.model('Report', reportSchema);
