const express = require('express');
const router = express.Router();
const axios = require('axios');
const Scan = require('../models/scan');
const User = require('../models/user');
const DetectionResult = require('../models/detectionresult');
require('dotenv').config();

const SYNONYMS = {
  "tomatoes": ["tomato", "tomato paste", "tomato sauce"],
  "peanuts": ["peanut", "groundnut", "arachis"],
  "milk": ["milk", "milk powder", "milk solids", "casein", "lactose"],
  "egg": ["egg", "egg yolk", "egg white", "albumen"],
  "wheat": ["wheat", "gluten", "spelt", "semolina"],
  "soy": ["soy", "soya", "soybean", "soya protein"],
  "fish": ["fish", "salmon", "cod", "tuna"],
  "shellfish": ["shrimp", "prawn", "crab", "lobster", "shellfish"],
  "strawberries": ["strawberry", "strawberries"],
};

const OCR_SPACE_API = "https://api.ocr.space/parse/image";
const apiKey = process.env.OCR_SPACE_API;

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectAllergensInText(text, allergiesObj = {}) {
  const flagged = [];
  if (!text) return flagged;
  const normalized = text.toLowerCase();

  for (const [allergen, severity] of Object.entries(allergiesObj)) {
    const key = String(allergen).toLowerCase();
    // gather terms to test: the allergen name + synonyms if present
    const terms = new Set([key]);
    if (SYNONYMS[key]) {
      SYNONYMS[key].forEach(syn => terms.add(syn.toLowerCase()));
    }

    // test each term; stop on first match for this allergen
    for (const term of terms) {
      const rx = new RegExp('\\b' + escapeRegExp(term) + '\\b', 'i');
      if (rx.test(normalized) || normalized.includes(term)) {
        flagged.push({ allergen, severity, matchedIngredient: term });
        break; // avoid duplicate flags for same allergen
      }
    }
  }

  return flagged;
}


router.post('/analyze-text', async (req, res) => {
  try {
    const { text, email } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'text required' });

    // Save raw scan text if you want (optional)
    await Scan.create({
      email: email || 'anonymous',
      scannedText: text
    });

    // Load user allergies
    let allergiesObj = {};
    if (email) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        if (user.allergies instanceof Map) allergiesObj = Object.fromEntries(user.allergies);
        else if (typeof user.allergies === 'object') allergiesObj = user.allergies;
      }
    }

    // use same detectAllergensInText() function
    const flagged = detectAllergensInText(text, allergiesObj);

    await DetectionResult.create({
      email: email || 'anonymous',
      source: 'scan',
      inputText: text,
      products: [],
      flaggedSummary: flagged
    });

    res.json({ success: true, text, flagged });
  } catch (err) {
    console.error('analyze-text error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.post('/analyze-image', async (req, res) => {
  try {
    const { imageBase64, email } = req.body;
    if (!imageBase64) return res.status(400).json({ success: false, message: 'imageBase64 required' });

    // Call OCR.Space
    const response = await axios.post(
      OCR_SPACE_API,
      new URLSearchParams({
        apikey: process.env.OCR_SPACE_API,
        base64Image: `data:image/png;base64,${imageBase64}`,
        language: "eng"
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const parsedResult = response.data?.ParsedResults?.[0]?.ParsedText || "";

    // Save raw scan (TTL still set on Scan model if you want)
    await Scan.create({
      email: email || "anonymous",
      scannedText: parsedResult,
    });

    // Load user allergies (if email provided)
    let allergiesObj = {};
    if (email) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        // user.allergies might be a Map or plain object
        if (user.allergies instanceof Map) allergiesObj = Object.fromEntries(user.allergies);
        else if (typeof user.allergies === 'object') allergiesObj = user.allergies;
      }
    }

    // Detect allergens in OCR text
    const flagged = detectAllergensInText(parsedResult, allergiesObj);

    // Save detection result (single record for this scan)
    await DetectionResult.create({
      email: email || "anonymous",
      source: 'scan',
      inputText: parsedResult,
      products: [], // none for OCR
      flaggedSummary: flagged
    });

    // Return parsed text + flagged summary to client (so front-end can show popup)
    res.json({ success: true, text: parsedResult, flagged: flagged });
  } catch (err) {
    console.error('OCR.Space error:', err?.message || err);
    res.status(500).json({ success: false, message: 'Failed to process image.' });
  }
});

module.exports = router;