const express = require('express');
const cors = require('cors');
const path = require('path');
const canvasRoutes = require('./routes/canvasRoutes');

const app = express();

// Middleware
const allowedOrigins = [
  'https://sketch2-print.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/canvas', canvasRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sketch2Print API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      canvas: '/api/canvas/*'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Sketch2Print API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;