var mongoose = require('mongoose');

var campusSchema = new mongoose.Schema({
  name: {type: String, unique: true},
  geofence: [[{type: Number}]],
  center: [{type: Number}],
  bikeList: [{type: Number}], //bike numbers
  totalHours: {type: Number, default: 0},
  totalDistance: {type: Number, default: 0},
  hubs: [{type: mongoose.Schema.Types.ObjectId, ref: 'Hub'}]
});

// Export schema =====================================================================================================================================================================
module.exports = mongoose.model('Campus', campusSchema);
