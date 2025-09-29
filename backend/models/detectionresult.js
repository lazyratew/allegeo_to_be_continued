// models/detectionresult.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FlagSchema = new Schema({
  allergen: String,
  severity: String,
  matchedIngredient: String,
  productId: String // optional, for compare results
}, { _id: false });

const ProductMatchSchema = new Schema({
  productId: String,
  name: String,
  brand: String,
  ingredients: [String],
  flaggedAllergens: [FlagSchema]
}, { _id: false });

const DetectionResultSchema = new Schema({
  email: { type: String, required: true, index: true },
   source: { type: String, enum: ['compare', 'scanpage:manual', 'scanpage:OCR'], required: true }, //shows source of where the result came from
  query: String,       // only for compare searches
  inputText: String,   // OCR text for scans
  products: [ProductMatchSchema], // for compare results (can be empty for scan)
  flaggedSummary: [FlagSchema],   // flattened list summary
  createdAt: { type: Date, default: Date.now, expires: '7d' } // auto-delete after 7 days
});

module.exports = mongoose.model('DetectionResult', DetectionResultSchema);
