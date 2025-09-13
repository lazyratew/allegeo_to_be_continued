const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');

router.post('/', async (req, res) => {
  const { email, message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const feedback = new Feedback({ email, message });
  await feedback.save();

  res.status(201).json({ message: 'Feedback saved' });
});

module.exports = router;
