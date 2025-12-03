// Configuration for the app
export const CONFIG = {
  // Cloud API endpoint - UPDATE THIS with your backend URL
  API_ENDPOINT: 'https://test-proactiveyou.onrender.com/api/steps',

  // Upload interval in milliseconds (default: 5 minutes)
  // Note: iOS HealthKit background delivery only triggers ~hourly
  UPLOAD_INTERVAL: 5 * 60 * 1000, // 5 minutes

  // Minimum upload interval (1 minute)
  MIN_UPLOAD_INTERVAL: 60 * 1000,

  // Maximum upload interval (1 hour)
  MAX_UPLOAD_INTERVAL: 60 * 60 * 1000,
};

// You can change the upload interval by modifying UPLOAD_INTERVAL above
// Example values:
// - 1 minute: 1 * 60 * 1000
// - 5 minutes: 5 * 60 * 1000
// - 10 minutes: 10 * 60 * 1000
// - 30 minutes: 30 * 60 * 1000
// - 1 hour: 60 * 60 * 1000
