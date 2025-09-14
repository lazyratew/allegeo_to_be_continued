const express = require('express');
const router = express.Router();
const Scan = require('../models/scan'); // Import scan model
const vision = require('@google-cloud/vision');

// Load env variables
require('dotenv').config();

const client = new vision.ImageAnnotatorClient({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS)
});
// POST route for processing OCR image
router.post('/analyze-image', async (req, res) => {
    try {
        const { imageBase64, email } = req.body;

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
