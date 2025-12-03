require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Data storage (in-memory for PoC - replace with database for production)
const stepData = [];

// Ensure data directory exists for file-based storage
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// File-based persistence (simple JSON file)
const dataFile = path.join(dataDir, 'steps.json');

// Load existing data from file
function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      const loaded = JSON.parse(data);
      stepData.push(...loaded);
      console.log(`Loaded ${stepData.length} records from disk`);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(stepData, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS === '*' || !process.env.ALLOWED_ORIGINS ? '*' : process.env.ALLOWED_ORIGINS.split(',')
}));
app.use(express.json()); // Parse JSON bodies
app.use(morgan('combined')); // Logging

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Step Tracker API',
    version: '1.0.0',
    endpoints: {
      'GET /': 'API info',
      'GET /health': 'Health check',
      'POST /api/steps': 'Submit step data',
      'GET /api/steps': 'Get all step data',
      'GET /api/steps/latest': 'Get latest step data',
      'GET /api/steps/today': 'Get today\'s step submissions',
      'GET /api/stats': 'Get statistics'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    recordsStored: stepData.length
  });
});

// POST endpoint to receive step data from iOS app
app.post('/api/steps', (req, res) => {
  try {
    const { steps, timestamp, deviceType } = req.body;

    // Validation
    if (steps === undefined || steps === null) {
      return res.status(400).json({
        error: 'Missing required field: steps'
      });
    }

    if (!timestamp) {
      return res.status(400).json({
        error: 'Missing required field: timestamp'
      });
    }

    // Create record
    const record = {
      id: Date.now().toString(),
      steps: parseInt(steps, 10),
      timestamp: timestamp,
      deviceType: deviceType || 'unknown',
      receivedAt: new Date().toISOString(),
      clientIP: req.ip
    };

    // Store in memory
    stepData.push(record);

    // Persist to file
    saveData();

    console.log('Step data received:', record);

    res.status(201).json({
      success: true,
      message: 'Step data recorded successfully',
      data: record
    });

  } catch (error) {
    console.error('Error processing step data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET all step data
app.get('/api/steps', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const paginatedData = stepData
      .slice()
      .reverse() // Most recent first
      .slice(offset, offset + limit);

    res.json({
      success: true,
      count: paginatedData.length,
      total: stepData.length,
      data: paginatedData
    });
  } catch (error) {
    console.error('Error fetching step data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET latest step data
app.get('/api/steps/latest', (req, res) => {
  try {
    if (stepData.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No data available'
      });
    }

    const latest = stepData[stepData.length - 1];

    res.json({
      success: true,
      data: latest
    });
  } catch (error) {
    console.error('Error fetching latest step data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET today's submissions
app.get('/api/steps/today', (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayData = stepData.filter(record => {
      const recordDate = new Date(record.receivedAt);
      return recordDate >= startOfDay;
    });

    res.json({
      success: true,
      count: todayData.length,
      data: todayData
    });
  } catch (error) {
    console.error('Error fetching today\'s data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET statistics
app.get('/api/stats', (req, res) => {
  try {
    if (stepData.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalRecords: 0,
          message: 'No data available'
        }
      });
    }

    const steps = stepData.map(r => r.steps);
    const totalSteps = steps.reduce((sum, s) => sum + s, 0);
    const avgSteps = totalSteps / steps.length;
    const maxSteps = Math.max(...steps);
    const minSteps = Math.min(...steps);

    const latest = stepData[stepData.length - 1];
    const oldest = stepData[0];

    res.json({
      success: true,
      stats: {
        totalRecords: stepData.length,
        totalSteps,
        averageSteps: Math.round(avgSteps),
        maxSteps,
        minSteps,
        latestSubmission: latest,
        oldestSubmission: oldest
      }
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Load existing data on startup
loadData();

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        Step Tracker API Server                            ║
║                                                           ║
║        Status: Running ✓                                  ║
║        Port: ${PORT}                                         ║
║        Environment: ${process.env.NODE_ENV}                          ║
║        Records loaded: ${stepData.length}                               ║
║                                                           ║
║        Endpoints:                                         ║
║        • http://localhost:${PORT}/                          ║
║        • http://localhost:${PORT}/api/steps                 ║
║        • http://localhost:${PORT}/api/steps/latest          ║
║        • http://localhost:${PORT}/api/stats                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, saving data and shutting down...');
  saveData();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, saving data and shutting down...');
  saveData();
  process.exit(0);
});
