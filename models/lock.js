var mongoose = require('mongoose');

var lockSchema = new mongoose.Schema({
  lockID: {type: Number},
  batteryLife: {type: Number},
  currentPosition: [{type: Number}],
  bike: {type: Number}, //bike number
  online: {type: Boolean, default: false}
});

// Export schema =====================================================================================================================================================================
module.exports = mongoose.model('Lock', lockSchema);
