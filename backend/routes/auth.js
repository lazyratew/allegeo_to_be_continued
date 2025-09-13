const express = require('express');
const router = express.Router();
const User = require('../models/user'); // your mongoose model

router.post('/signup', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    if (!email || !password || !username || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'User already exists' });
    const user = new User({ username, email, phone, password });
    await user.save();
    console.log('User saved:', user);
    return res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    console.log('✅ Login successful:', user.email);
    return res.status(200).json({ message: 'Login successful', email: user.email });
  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;
