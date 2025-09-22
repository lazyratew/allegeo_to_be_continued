// collection for OCR scans
const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    scannedText: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '7d' // TTL index → auto-delete after 7 days
    }
  }
);

module.exports = mongoose.model('Scan', ScanSchema);
