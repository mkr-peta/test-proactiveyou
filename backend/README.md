# Step Tracker Backend API

Simple Express.js backend for receiving step count data from the iOS Step Tracker app.

## Features

- REST API endpoints for receiving and querying step data
- In-memory storage with file persistence (JSON)
- CORS enabled for mobile app access
- Request logging with Morgan
- Security headers with Helmet
- Health check endpoint

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment (optional):
```bash
cp .env.example .env
# Edit .env if needed
```

3. Start the server:
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## API Endpoints

### GET /
API information and available endpoints

### GET /health
Health check endpoint
- Returns server status, uptime, and record count

### POST /api/steps
Submit step data from iOS app
- Body: `{ "steps": 1234, "timestamp": "2024-01-01T12:00:00Z", "deviceType": "iOS" }`
- Returns: Created record with ID

### GET /api/steps
Get all step records
- Query params: `limit` (default: 100), `offset` (default: 0)
- Returns: Paginated array of step records

### GET /api/steps/latest
Get the most recent step submission

### GET /api/steps/today
Get all submissions from today

### GET /api/stats
Get statistics (total, average, min, max steps)

## Data Storage

For this PoC, data is stored:
1. In-memory (fast access)
2. Persisted to `data/steps.json` (survives restarts)

**For production:** Replace with a proper database (PostgreSQL, MongoDB, etc.)

## Testing the API

Test with curl:
```bash
# Health check
curl http://localhost:3000/health

# Submit step data
curl -X POST http://localhost:3000/api/steps \
  -H "Content-Type: application/json" \
  -d '{"steps": 5000, "timestamp": "2024-01-01T12:00:00Z", "deviceType": "iOS"}'

# Get latest data
curl http://localhost:3000/api/steps/latest

# Get statistics
curl http://localhost:3000/api/stats
```

## Deployment

### Option 1: Heroku
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `git push heroku main`
4. Update iOS app config with Heroku URL

### Option 2: AWS Lambda
1. Use AWS Lambda with API Gateway
2. Deploy with Serverless Framework
3. Update iOS app config with API Gateway URL

### Option 3: Railway/Render/Fly.io
1. Connect GitHub repo
2. Deploy automatically
3. Update iOS app config with deployment URL

## Security Notes

⚠️ **This is a PoC - for production you should add:**
- Authentication (API keys, OAuth, JWT)
- Rate limiting
- Input validation/sanitization
- Database with proper indexes
- Monitoring and alerting
- HTTPS only
- Data encryption at rest
