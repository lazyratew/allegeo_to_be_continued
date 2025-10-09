const path = require('path');
require('dotenv').config();

console.log("MONGO_URI:", process.env.MONGO_URI);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo'); //looks weird
const authRouter = require('./routes/auth');  //file created for user credentials
const userinfoRouter = require('./routes/userinfo'); //file created for user information
const scanRouter = require('./routes/scan'); //for the scan_page.html file
const productRoutes = require('./routes/products');
const app = express();
app.use(express.json({ limit: '1mb' })); //for large JSON payloads
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

//for testing purposes delete later
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(cors({
  origin: ['https://allegeo.netlify.app', 'http://localhost:3000', 'https://allegeo-to-be-continued.onrender.com'],
  credentials: true
}));

app.set('trust proxy', 1);  //added afer cookie sessions err 
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,  
    collectionName: 'sessions',       
    ttl: 10 * 24 * 60 * 60  //10 days           
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',   
    sameSite: 'none',     // required for Netlify <-> Render cross-domain
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  },
}));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); 
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

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on`);
});

//this is for testing on localhost
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});