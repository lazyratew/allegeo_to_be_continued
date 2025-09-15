//the api being used is OCR.SPACE api, NOT google cloud vision
const express = require('express');
const router = express.Router();
const Scan = require('../models/scan');
const axios = require('axios'); 

require('dotenv').config();

const OCR_SPACE_API = "https://api.ocr.space/parse/image";
const apiKey = process.env.OCR_SPACE_API;

router.post('/analyze-image', async (req, res) => {
  try {
    const { imageBase64, email } = req.body;

    const response = await axios.post(
      OCR_SPACE_API,
      new URLSearchParams({
        apikey: process.env.OCR_SPACE_API_KEY, // stored in Render env
        base64Image: `data:image/png;base64,${imageBase64}`,
        language: "eng"
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const parsedResult = response.data?.ParsedResults?.[0]?.ParsedText || "No text detected.";

    // Save scan result to DB
    await Scan.create({
      email: email || "anonymous",
      scannedText: parsedResult,
    });

    res.json({ success: true, text: parsedResult });

  } catch (err) {
    console.error('OCR.Space error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to process image.' });
  }
});

module.exports = router;
