export const CONFIG = {
  // Backend API endpoint
  // For local testing with ngrok: https://your-ngrok-id.ngrok.io/api/steps
  // For production: https://your-backend-url.com/api/steps
  API_ENDPOINT: 'http://localhost:3000/api/steps',
  
  // Upload interval in milliseconds
  // Note: iOS HealthKit enforces ~1 hour minimum for background delivery
  UPLOAD_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Enable debug logging
  DEBUG: true,
};
