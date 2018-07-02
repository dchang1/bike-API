var mongoose = require('mongoose');

var campusSchema = new mongoose.Schema({
  name: {type: String, unique: true},
  geofence: [[{type: Number}]],
  bikeList: [{type: Number}], //bike numbers
  totalHours: {type: Number, default: 0},
  totalDistance: {type: Number, default: 0},
});

// Export schema =====================================================================================================================================================================
module.exports = mongoose.model('Campus', campusSchema);
