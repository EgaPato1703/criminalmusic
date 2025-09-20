const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('🔗 Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Criminal Music Server is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = config.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🎵 Criminal Music Server running on port ${PORT}`);
});

module.exports = app;
