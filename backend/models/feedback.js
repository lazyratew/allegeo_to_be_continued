const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  email:    { type: String },
  message:  { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '7d' } // Auto-delete after 7 days
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
