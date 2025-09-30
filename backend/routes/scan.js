const express = require('express');
const router = express.Router();
const axios = require('axios');
const Scan = require('../models/scans');
const DetectionResult = require('../models/detectionresult');
const { detectAllergensInText } = require('../utils/detectionLogic');
const { getUserAllergiesById } = require('../utils/userAllergyHelp');
require('dotenv').config();

const OCR_SPACE_API = "https://api.ocr.space/parse/image";

// A single function to process text, detect allergies, and save to DB
const processAndSaveScan = async (text, req, source) => {
  try {
    const userId = req.session.userId;
    const userEmail = req.session.email || 'anonymous';
    if (!userId) {
      throw new Error("Unauthorized: no user session found");
    }

    // 1. Get user allergies
    const allergiesObj = await getUserAllergiesById(userId);

    // 2. Detect allergens
    const flagged = detectAllergensInText(text, allergiesObj);

    // 3. Save raw scan to `scans` collection
    await Scan.create({
      email: userEmail,
      scannedText: text,
      source: source,
    });


    const mockProductName = source.includes('OCR') ? 'Scanned Text from Image' : 'Manually Entered Text';

    const productForDB = {
      name: mockProductName,
      flaggedAllergens: flagged.map(f => ({
        ...f,
        source: source
      })),
      // other product fields would go here if applicable
    };

    // 4. Save detection result to `DetectionResult`
    await DetectionResult.create({
      email: userEmail,
      source: source,
      inputText: text,
      products: [],
      flaggedSummary: flagged.map(f => ({
        ...f,
        source: source
      })),
    });

    return flagged;
  } catch (err) {
    console.error("❌ Error processing text and detecting allergens:", err);
    throw err;
  }
};

router.post('/analyze-image', async (req, res) => { //this is where the image is sent to ocr.space
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image is required' });
    }

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

    const parsedText = response.data?.ParsedResults?.[0]?.ParsedText || "";
    if (!parsedText) {
      return res.status(400).json({ error: "Failed to read text from image. Please try a clearer image." });
    }

    // Process and save using the common function
    await processAndSaveScan(parsedText, req, 'scanpage: OCR');

    res.json({ success: true, message: "Image analyzed successfully." });
  } catch (err) {
    console.error("❌ Error in /scan/analyze-image:", err?.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/analyze-text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Process and save using the common function
    await processAndSaveScan(text, req, 'scanpage: manual');

    res.json({ success: true, message: "Text analyzed successfully." });
  } catch (err) {
    console.error("❌ Error in /scan/analyze-text:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;