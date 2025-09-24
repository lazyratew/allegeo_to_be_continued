const mongoose = require('mongoose');

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

module.exports = mongoose.model('User', UserSchema);