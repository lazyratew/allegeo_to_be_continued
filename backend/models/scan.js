const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  email: String,
  scannedText: String,
  createdAt: { type: Date, default: Date.now, expires: '7d' }, // TTL index: delete after 7 days
});

module.exports = mongoose.model('Scan', scanSchema);
