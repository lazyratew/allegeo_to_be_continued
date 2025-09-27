const express = require('express');
const router = express.Router();
const axios = require('axios');
const Scan = require('../models/scan');
const User = require('../models/user');
const DetectionResult = require('../models/detectionresult');
const { detectAllergensInText } = require('../utils/detectionLogic')
const {getUserAllergiesById} = require('../utils/userAllergyHelp');
require('dotenv').config();

const OCR_SPACE_API = "https://api.ocr.space/parse/image";
const apiKey = process.env.OCR_SPACE_API;

// Middleware to parse text and detect allergens
const processTextAndDetect = async (text, req) => {
  try {
    const userId = req.session.userId;
    let userEmail = req.session.email || 'anonymous';
    const allergiesObj = await getUserAllergiesById(userId); 
    const flagged = detectAllergensInText(text, allergiesObj);

    // Save to DB
    await DetectionResult.create({
      email: userEmail,
      source: 'scan',
      inputText: text,
      products: [],
      flaggedSummary: flagged
    });
    return flagged;
  } catch (err) {
    console.error("❌ Error processing text and detecting allergens:", err);
    return [];
  }
};

router.post('/analyze-image', async (req, res) => {
  try {
    const { imageBase64, email } = req.body;
    if (!imageBase64) return res.status(400).json({ success: false, message: 'Image is required' });

    const userId = req.session.userId;
    let userEmail = 'anonymous';

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

    // Save scan to DB (history)
    await Scan.create({
      email: req.session.email || 'anonymous',
      scannedText: parsedText,});
    const flagged = await processTextAndDetect(parsedText, req);

    res.json({ success: true, text: parsedText, flagged });
  } catch (err) {
    console.error("❌ Error in /scan/analyze-image:", err?.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/analyze-text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const flagged = await processTextAndDetect(text, req);

    // Get logged-in user from session
    const userId = req.session.userId;
    let allergiesObj = {};
    let userEmail = 'anonymous';

     res.json({ success: true, text, flagged });
  } catch (err) {
    console.error("❌ Error in /scan/analyze-text:", err?.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;