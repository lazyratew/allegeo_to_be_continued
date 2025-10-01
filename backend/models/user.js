const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SearchHistory = require('./searchhistory');
const DetectionResult = require('./detectionresult');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },

    allergies: {
      type: Map,
      of: String, //like { "Tomatoes": "Mild", "Strawberries": "Moderate" }
      default: {}
    }
  },
  { timestamps: true }
);


UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

//For checking password during login 
UserSchema.methods.comparePassword = function (candidatePassword) {
  //for retrieving the stored hash
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.pre('remove', async function (next) {
  try {
    await SearchHistory.deleteMany({ email: this.email });
    await DetectionResult.deleteMany({ email: this.email });
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', UserSchema);