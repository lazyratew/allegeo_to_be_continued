// Load environment variables
require('dotenv').config();
const path = require('path');

// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRouter = require('./routes/auth');  //file created for user credentials
const userinfoRouter = require('./routes/userinfo'); //file created for user information
const scanRouter = require('./routes/scan'); //for the scan_page.html file

// Initialize Express app
const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: 'https://allegeo.netlify.app', //front-end deployed with netlify, through github
  methods: ["GET", "POST", "PUT", "DELETE"], 
  credentials: true
}));
app.use(express.json()); // for parsing application/json
app.use('/api/auth', authRouter);
app.use('/api/user', userinfoRouter);
app.use('/api/scan', scanRouter);

// Debug: verify environment variable is loaded
console.log('MONGO_URI →', process.env.MONGO_URI);

// Connect to MongoDB (no deprecated options)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Yayy Connected to MongoDB Atlas'))
  .catch((err) => console.error(':( MongoDB connection error:', err));

// Monitor connection status
mongoose.connection.on('connected', () => {
  console.log('Mongoose default connection is open');
});
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose default connection is disconnected');
});

// Auth routes
app.use('/api/auth', authRouter);

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
