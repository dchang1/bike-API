var mongoose = require('mongoose');

var hubSchema = new mongoose.Schema({
  name: {type: String},
  location: {type: [Number], required: true},
  radius: {type: Number}, //km
  quota: {type: Number, default: 100},
  campus: {type: String},
  rides: [{type: mongoose.Schema.Types.ObjectId, ref: 'Ride'}],
  bikes: [{type: Number}]
});

// Export schema =====================================================================================================================================================================
module.exports = mongoose.model('Hub', hubSchema);
