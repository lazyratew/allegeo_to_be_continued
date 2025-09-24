require('dotenv').config();
const path = require('path');

// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const authRouter = require('./routes/auth');  //file created for user credentials
const userinfoRouter = require('./routes/userinfo'); //file created for user information
const scanRouter = require('./routes/scan'); //for the scan_page.html file
const productRoutes = require('./routes/products');
const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretstring', // store in .env
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
  }),
  cookie: {
    httpOnly: true,
    secure: true,         // Render uses HTTPS
    sameSite: 'none',     // required for Netlify <-> Render cross-domain
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

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
app.use('/products', productRoutes);

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
