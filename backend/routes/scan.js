const express = require('express');
const router = express.Router();
const Scan = require('../models/scan'); // Import scan model
const vision = require('@google-cloud/vision');

// Load env variables
require('dotenv').config();

// Initialize Vision API client
const client = new vision.ImageAnnotatorClient({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS)
});

router.post('/analyze-image', async (req, res) => {
  try {
    const { imageBase64, email } = req.body;

    const [result] = await client.textDetection({
      image: { content: imageBase64 }
    });

    const text = result.fullTextAnnotation?.text || "No text detected.";

    // Save scan result to DB
    await Scan.create({
      email: email || "anonymous",
      scannedText: text,
    });

    res.json({ success: true, text });

  } catch (err) {
    console.error('Vision API error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to process image.' });
  }
});
module.exports = router;
