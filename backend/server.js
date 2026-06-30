require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static audio uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: db.getDbType(),
    timestamp: new Date()
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await db.initDB();
    app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(` SafeHer AI Backend running on port ${PORT}`);
      console.log(` Mode: ${app.get('env')}`);
      console.log(` Database: ${db.getDbType().toUpperCase()}`);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(`=========================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
