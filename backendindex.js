const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Data storage
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'steps.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Helper function to read data
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return [];
  }
}

// Helper function to write data
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
}

// Routes

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Step Tracker API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      submitSteps: 'POST /api/steps',
      getAllSteps: 'GET /api/steps',
      getLatest: 'GET /api/steps/latest',
      getTodaySteps: 'GET /api/steps/today',
      getStats: 'GET /api/stats',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Submit step data
app.post('/api/steps', (req, res) => {
  try {
    const { steps, timestamp, deviceType } = req.body;

    // Validation
    if (typeof steps !== 'number' || steps < 0) {
      return res.status(400).json({
        error: 'Invalid steps value',
      });
    }

    // Create record
    const record = {
      id: Date.now().toString(),
      steps,
      timestamp: timestamp || new Date().toISOString(),
      deviceType: deviceType || 'unknown',
      receivedAt: new Date().toISOString(),
    };

    // Save to file
    const data = readData();
    data.push(record);
    
    if (!writeData(data)) {
      return res.status(500).json({
        error: 'Failed to save data',
      });
    }

    console.log('Step data received:', record);

    res.status(201).json({
      success: true,
      record,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Get all step records (with pagination)
app.get('/api/steps', (req, res) => {
  try {
    const data = readData();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const start = (page - 1) * limit;
    const end = start + limit;

    const sortedData = data.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    const paginatedData = sortedData.slice(start, end);

    res.json({
      page,
      limit,
      total: data.length,
      totalPages: Math.ceil(data.length / limit),
      data: paginatedData,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Get latest step record
app.get('/api/steps/latest', (req, res) => {
  try {
    const data = readData();
    
    if (data.length === 0) {
      return res.status(404).json({
        error: 'No data available',
      });
    }

    const latest = data.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0];

    res.json(latest);
  } catch (error) {
    console.error('Error fetching latest data:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Get today's step submissions
app.get('/api/steps/today', (req, res) => {
  try {
    const data = readData();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayData = data.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= today;
    });

    res.json({
      date: today.toISOString().split('T')[0],
      count: todayData.length,
      data: todayData.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ),
    });
  } catch (error) {
    console.error('Error fetching today data:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const data = readData();

    if (data.length === 0) {
      return res.json({
        totalRecords: 0,
        averageSteps: 0,
        maxSteps: 0,
        minSteps: 0,
      });
    }

    const steps = data.map(r => r.steps);
    const sum = steps.reduce((a, b) => a + b, 0);
    const avg = sum / steps.length;
    const max = Math.max(...steps);
    const min = Math.min(...steps);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRecords = data.filter(r => new Date(r.timestamp) >= today);

    res.json({
      totalRecords: data.length,
      averageSteps: Math.round(avg),
      maxSteps: max,
      minSteps: min,
      todayRecords: todayRecords.length,
      latestRecord: data.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )[0],
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Step Tracker API running on http://localhost:${PORT}`);
  console.log(`📊 Data storage: ${DATA_FILE}`);
  console.log(`🔗 Test with: curl http://localhost:${PORT}/health`);
});
