var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var userSchema = new mongoose.Schema({
  createdAt: {type: Date, default: Date.now},
  email: {type: String, lowercase: true, unique: true, required: true},
  password: {type: String, required: true},
  firstName: {type: String},
  lastName: {type: String},
  paymentToken: {type: String},
  campus: {type: String}, //campus name
  pastRides: [{type: mongoose.Schema.Types.ObjectId, ref: 'Ride'}],
  myBikes: [{type: Number}],
  totalRideTime: {type: Number, default: 0},
  totalDistance: {type: Number, default: 0},
  userScore: {type: Number, default: 0},
  favoriteBikes: [{type: Number}], //bike numbers
  userType: {type: String, default: "user"},
  verified: {type: Boolean, default: false},
  birthday: {type: Date},
  resetPasswordToken: {type: String},
  resetPasswordExpires: {type: Date}
});

// Define methods ====================================================================================================================================================================

userSchema.pre('save', function(next) {
  var user = this;
  var SALT_FACTOR = 5;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

// Export schema =====================================================================================================================================================================
module.exports = mongoose.model('User', userSchema);
