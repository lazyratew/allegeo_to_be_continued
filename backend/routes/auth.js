const express = require('express');
const router = express.Router();
const User = require('../models/user'); // your mongoose model

//signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    if (!email || !password || !username || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  // Check for duplicate email
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: 'User already exists' });

  // Check for duplicate username (case-insensitive)
  const usernameExists = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });
  if (usernameExists) return res.status(409).json({ error: 'Username already taken' });

  // Store username in lowercase for consistency
  const user = new User({ username: username.toLowerCase(), email, phone, password });
  await user.save();

    // Set session so user stays logged in after signup
    req.session.userId = user._id;
    req.session.email = user.email;

    req.session.save(err => {
      if (err) {
        console.error("❌ Session save error after signup:", err);
        return res.status(500).json({ error: "Could not save session" });
      }
      console.log('User saved and session set:', user);
      // Always return hasAllergies (true if any allergy value is not empty and not 'Not Allergic')
      let hasAllergies = false;
      let allergiesObj = user.allergies;
      if (allergiesObj && typeof allergiesObj === 'object' && typeof allergiesObj.entries === 'function') {
        allergiesObj = Object.fromEntries(allergiesObj.entries());
      }
      if (allergiesObj && typeof allergiesObj === 'object') {
        for (const val of Object.values(allergiesObj)) {
          if (val && val !== 'Not Allergic') {
            hasAllergies = true;
            break;
          }
        }
      }
      return res.status(201).json({
        message: 'User created',
        email: user.email,
        hasAllergies: hasAllergies
      });
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

 //login
router.post('/login', async (req, res) => {
  //added for console log 
  console.log("Login endpoint hit")
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
    //store session
    req.session.userId = user._id;
    req.session.email = user.email;

    req.session.save(err => {
      if (err) {
        console.error("❌ Session save error:", err);
        return res.status(500).json({ error: "Could not save session" });
      }
      console.log('✅ Login successful:', user.email);
      // Always return hasAllergies (true if any allergy value is not empty and not 'Not Allergic')
      let hasAllergies = false;
      let allergiesObj = user.allergies;
      if (allergiesObj && typeof allergiesObj === 'object' && typeof allergiesObj.entries === 'function') {
        allergiesObj = Object.fromEntries(allergiesObj.entries());
      }
      if (allergiesObj && typeof allergiesObj === 'object') {
        for (const val of Object.values(allergiesObj)) {
          if (val && val !== 'Not Allergic') {
            hasAllergies = true;
            break;
          }
        }
      }
      console.log('User allergies:', allergiesObj, 'Has allergies:', hasAllergies);
      return res.status(200).json({
        message: 'Login successful',
        email: user.email,
        hasAllergies: hasAllergies
      });
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

//Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error during session destruction:",err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('sid'); 
    res.json({ message: 'Logged out' });
  });
});
module.exports = router;
