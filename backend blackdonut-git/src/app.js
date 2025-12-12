// create server 

const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.route');
const foodRoutes = require('./routes/food.routes');
const foodPartnerRoutes = require('./routes/food-partner.routes');
const commentRoutes = require('./routes/comment.routes');

const cors = require('cors');
const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://blackdonut-com.vercel.app'
  ],
  credentials: true,                  // required to allow cookies
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Set-Cookie']     // Expose Set-Cookie header for debugging
}));



app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    res.send(`
        <h2>Welcome to the Black Donut API Server</h2>
        <p>Co-powered by <strong>© Sanjib Kumar Deka</strong></p>
        <p>Current Date & Time: <strong>${now}</strong></p>
    `);
});

// Test endpoint to check if cookies are being sent
app.get('/api/test-cookie', (req, res) => {
    console.log('🔍 /test-cookie called');
    console.log('🍪 Cookies received:', req.cookies);
    
    res.json({
        message: 'Cookie test endpoint',
        cookiesReceived: req.cookies,
        hasCookie: !!req.cookies.token,
    });
});

                     
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/food-partner', foodPartnerRoutes);
app.use('/api/comments', commentRoutes);


module.exports = app;