const mongoose = require('mongoose');

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
      required: true
    },
    
    allergies: {
      type: Map,
      of: String, //like { "Tomatoes": "Mild", "Strawberries": "Moderate" }
      default: {}
    }
  },
  { timestamps: true }
);


// Cascade delete SearchHistory and DetectionResult when a user is removed
UserSchema.pre('remove', async function(next) {
  try {
    await SearchHistory.deleteMany({ email: this.email });
    await DetectionResult.deleteMany({ email: this.email });
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', UserSchema);