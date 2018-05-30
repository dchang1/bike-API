var mongoose = require('mongoose');

var campusSchema = new mongoose.Schema({
  name: {type: String, unique: true},
  geofence: [{type: Number}],
  bikeList: [{type: mongoose.Schema.Types.ObjectId, ref: 'Bike'}],
  totalHours: {type: Number, default: 0},
  totalDistance: {type: Number, default: 0},
});

// Export schema =====================================================================================================================================================================
module.exports = mongoose.model('Campus', campusSchema);
