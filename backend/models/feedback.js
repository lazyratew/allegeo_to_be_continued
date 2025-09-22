//to create a collection for feedback
const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: false, //anonymous feedback
      lowercase: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', FeedbackSchema);
