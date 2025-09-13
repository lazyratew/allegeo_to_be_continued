const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Feedback = require('../models/Feedback');

    
//to save allergy data apparently
router.post('/profile', async (req, res) => {
    try {
        const { email, allergies } = req.body;

        if (!email || !allergies) {
            return res.status(400).json({ message: 'Email and allergies required' });
        }

        const updatedUser = await User.findOneAndUpdate(
            { email },
            { allergies },
            { new: true, upsert: true }
        );

        console.log('User saved:', updatedUser);
        res.status(200).json({ message: 'User saved', user: updatedUser });
    } catch (err) {
        console.error('Error saving user:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// using GET to get user allergy profile
router.get('/profile', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ allergies: user.allergies || {} });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

//use PUT to update allergy profile
router.put('/profile', async (req, res) => {
    const { email, allergies } = req.body;
    if (!email || !allergies) return res.status(400).json({ error: 'Email and allergies required' });

    try {
        const user = await User.findOneAndUpdate(
            { email },
            { allergies },
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ message: 'Allergy profile updated' });
    } catch (err) {
        console.error('Error updating profile:', err);
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


// GET allergy profile for a user
router.get('/profile', async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ allergies: user.allergies || {} });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: 'Internal server error' });
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
