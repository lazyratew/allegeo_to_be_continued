const express = require('express');
const axios = require('axios');
const router = express.Router();
const Scan = require('../models/scan'); // Import scan model


// Load env variables
require('dotenv').config();

// Google Vision API endpoint
const VISION_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`;

// POST route for processing OCR image
router.post('/analyze-image', async (req, res) => {
    try {
        const { imageBase64 } = req.body;

        const response = await axios.post(VISION_ENDPOINT, {
            requests: [
                {
                    image: { content: imageBase64 },
                    features: [{ type: 'TEXT_DETECTION' }],
                },
            ],
        });

        const text = response.data.responses[0]?.fullTextAnnotation?.text || "No text detected.";
        res.json({ success: true, text });
        // to save scan to DB
        await Scan.create({
            email: req.body.email || "anonymous",
            scannedText: text,
        });


    } catch (err) {
        console.error('Vision API error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to process image.' });
    }
});

module.exports = router;
