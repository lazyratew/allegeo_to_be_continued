const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Feedback = require('../models/feedback');

//to check if user is logged in
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

//post with session
router.post('/profile', requireLogin, async (req, res) => {
  try {
    const { allergies } = req.body;
    if (!allergies) return res.status(400).json({ message: 'Allergies required' });

    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId,
      { allergies },
      { new: true }
    );

    res.status(200).json({ message: 'User saved', user: updatedUser });
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /profile using session
router.get('/profile', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ 
      allergies: user.allergies || {}, 
      email: user.email, 
      username: user.username 
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

//for user feedback.html file
router.post('/feedback', async (req, res) => {
    try {
        const { email, message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const feedback = new Feedback({ email, message });
        await feedback.save();

        res.status(201).json({ message: 'Feedback received' });
    } catch (err) {
        console.error('Feedback error:', err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// for dashboard allergies
router.post('/allergies', async (req, res) => {
    try {
        const { allergies } = req.body;
        if (!allergies || typeof allergies !== 'object') {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        // TODO: Replace with actual logged-in user info later
        const userEmail = "test@example.com"; // temporary

        const user = await User.findOneAndUpdate(
            { email: userEmail },
            { allergies },
            { new: true, upsert: false }
        );

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ message: 'Allergies updated' });
    } catch (err) {
        console.error('Update allergy error:', err);
        res.status(500).json({ error: 'Failed to save allergy profile' });
    }
});

module.exports = router;
