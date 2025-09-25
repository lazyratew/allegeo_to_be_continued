const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');
const User = require('../models/user'); 

router.post('/', async (req, res) => {
  try {
    const { message, email } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get the logged-in user from the session
    const userId = req.session.userId; 
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Please log in' });
    }

    const feedback = new Feedback({
      user: userId,   
      email: email || null, 
      message
    });

    await feedback.save();

    res.status(201).json({ message: 'Feedback saved' });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
