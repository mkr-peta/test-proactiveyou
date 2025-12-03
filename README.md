# 📱 Step Tracker iOS App

A proof-of-concept iOS app that tracks daily step count using HealthKit and uploads data to the cloud in real-time, even when the app is completely closed.

## ✨ Features

- ✅ **Real-time step counting** using Apple HealthKit
- ✅ **Background delivery** - works even when app is force-quit
- ✅ **Cloud sync** - uploads data to backend API
- ✅ **Configurable intervals** - adjustable upload frequency (5 min default)
- ✅ **Minimalistic UI** - single screen showing step count
- ✅ **TestFlight ready** - production deployment guide included

## 🎯 Key Achievement

**The app can send data to the cloud even when completely closed (cleared from RAM)!**

This works using iOS HealthKit's background delivery feature, which wakes the app when new step data is available (~hourly).

## 🏗️ Architecture

```
┌─────────────────┐
│   iOS App       │
│  (React Native) │
│                 │
│  - HealthKit    │
│  - Background   │
│    Delivery     │
└────────┬────────┘
         │
         │ HTTPS POST
         │ /api/steps
         │
┌────────▼────────┐
│  Backend API    │
│  (Node.js)      │
│                 │
│  - Express      │
│  - REST API     │
│  - JSON Storage │
└─────────────────┘
```

## 📦 Project Structure

```
StepTrackerApp/
├── src/
│   ├── config.ts              # Configuration (API endpoint, intervals)
│   └── HealthKitService.ts    # HealthKit integration
├── App.tsx                    # Main app component
├── ios/                       # iOS native project
│   ├── StepTrackerApp/
│   │   └── Info.plist        # iOS permissions & config
│   └── StepTrackerApp.entitlements  # HealthKit entitlements
├── backend/                   # Backend API server
│   ├── index.js              # Express server
│   ├── package.json
│   └── README.md
├── package.json
├── SETUP_GUIDE.md            # Detailed setup instructions
└── README.md                 # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install React Native dependencies
npm install

# Install iOS dependencies
cd ios && pod install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3000`

### 3. Configure API Endpoint

Edit `src/config.ts`:
```typescript
API_ENDPOINT: 'https://your-backend-url.com/api/steps'
```

For local testing, deploy backend using ngrok or similar.

### 4. Open in Xcode

```bash
cd ios
open StepTrackerApp.xcworkspace
```

### 5. Build & Run

1. Select your **physical iPhone** (not simulator - HealthKit doesn't work in simulator)
2. Click **Run** (⌘R)
3. Grant HealthKit permissions when prompted
4. Walk around and see your steps!

## 📖 Full Setup Guide

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete step-by-step instructions including:
- Prerequisites & installation
- Backend deployment options
- Xcode configuration
- TestFlight distribution
- Troubleshooting

## 🧪 Testing

### Test Local Backend

```bash
# Health check
curl http://localhost:3000/health

# Submit test data
curl -X POST http://localhost:3000/api/steps \
  -H "Content-Type: application/json" \
  -d '{"steps": 5000, "timestamp": "2024-01-01T12:00:00Z", "deviceType": "iOS"}'

# Get latest data
curl http://localhost:3000/api/steps/latest

# Get statistics
curl http://localhost:3000/api/stats
```

### Test iOS App

**Foreground Testing:**
1. Open app on physical iPhone
2. Walk around (or shake phone)
3. Click "Refresh" to see updated steps
4. Click "Upload Now" to manually sync

**Background Testing:**
1. Walk to generate steps
2. Force quit the app (swipe up from app switcher)
3. Wait ~1-2 hours (iOS background delivery timing)
4. Check backend API for new data:
   ```bash
   curl https://your-backend/api/steps/latest
   ```

**Important Notes:**
- Background delivery triggers ~hourly (iOS enforced)
- First trigger may take 1-2 hours after setup
- Doesn't work when device is locked with passcode
- Low Power Mode may delay background delivery

## ⚙️ Configuration

### Upload Interval

Edit `src/config.ts`:
```typescript
UPLOAD_INTERVAL: 5 * 60 * 1000 // milliseconds
```

Options:
- `1 * 60 * 1000` → 1 minute
- `5 * 60 * 1000` → 5 minutes (default)
- `10 * 60 * 1000` → 10 minutes
- `30 * 60 * 1000` → 30 minutes
- `60 * 60 * 1000` → 1 hour

⚠️ **Note**: iOS HealthKit enforces minimum ~1 hour for background delivery regardless of this setting!

### Backend Deployment

Deploy backend to any platform:
- **ngrok** (quick testing): `ngrok http 3000`
- **Railway** (free): https://railway.app
- **Render** (free): https://render.com
- **Heroku** (paid): https://heroku.com
- **AWS Lambda** (serverless): API Gateway + Lambda

Update `src/config.ts` with your deployment URL.

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| POST | `/api/steps` | Submit step data |
| GET | `/api/steps` | Get all records (paginated) |
| GET | `/api/steps/latest` | Get latest record |
| GET | `/api/steps/today` | Get today's submissions |
| GET | `/api/stats` | Get statistics |

## 🔒 Security Notes

⚠️ **This is a proof of concept!**

For production, add:
- ✅ Authentication (API keys, OAuth, JWT)
- ✅ Rate limiting
- ✅ Input validation
- ✅ HTTPS only
- ✅ Database with encryption
- ✅ User management
- ✅ Privacy compliance (HIPAA, GDPR)

## 📱 iOS Requirements

- **iOS 13.0+** (for HealthKit background delivery)
- **Physical iPhone** (HealthKit doesn't work in simulator)
- **HealthKit capability** enabled in Xcode
- **Apple Developer account** (for TestFlight)

## 🎯 What Actually Works

### ✅ Confirmed Working
- Reading step count from HealthKit
- Displaying real-time steps in app
- Uploading to cloud when app is open
- Background delivery when app is closed/force-quit
- Data persistence across app restarts
- TestFlight distribution

### ❌ Known Limitations
- Background delivery is ~1 hour minimum (iOS restriction)
- No real-time updates when device locked with passcode
- Simulator not supported (HealthKit limitation)
- Background timing is advisory (iOS decides)

## 🐛 Troubleshooting

### App won't build
```bash
# Clean and reinstall
rm -rf node_modules ios/Pods
npm install
cd ios && pod install
```

### No steps showing
- Walk around to generate steps
- Click "Refresh" button
- Check HealthKit permissions in iOS Settings

### Backend not receiving data
- Check API endpoint URL in `src/config.ts`
- Verify backend is running and accessible
- Check network connectivity
- Look for errors in Xcode console

### Background delivery not working
- Wait longer (first trigger can take 1-2 hours)
- Ensure HealthKit background capability enabled
- Check device is not in Low Power Mode
- Generate new step data (walk around)
- Check Xcode device console for errors

## 📈 Monitoring

### View Backend Logs
```bash
cd backend
npm run dev  # Watch server logs
```

### View iOS Logs
1. Xcode → Window → Devices and Simulators
2. Select your iPhone
3. Click "Open Console"
4. Filter for "HealthKit" or "Step"

### Check Data Storage
```bash
# Backend stores data in:
backend/data/steps.json
```

## 🚢 Deployment Checklist

- [ ] Backend deployed and accessible via HTTPS
- [ ] API endpoint updated in `src/config.ts`
- [ ] iOS app builds without errors
- [ ] HealthKit permissions configured in Info.plist
- [ ] HealthKit capability enabled in Xcode
- [ ] Code signing configured with Apple Developer account
- [ ] App archived and uploaded to App Store Connect
- [ ] TestFlight build processed and available
- [ ] Testers invited and app installed
- [ ] Background delivery tested (wait 1-2 hours)
- [ ] Data appearing in backend API

## 🎓 Learning Resources

- [HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [React Native HealthKit](https://github.com/kingstinct/react-native-healthkit)
- [Background Execution](https://developer.apple.com/documentation/backgroundtasks)
- [TestFlight Guide](https://developer.apple.com/testflight/)

## 📄 License

MIT

## 🤝 Contributing

This is a proof of concept. Feel free to fork and improve!

Suggestions:
- Add user authentication
- Implement push notifications
- Add data visualization
- Support Android (Google Fit)
- Add unit tests
- Implement proper database

## 📞 Support

Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed troubleshooting.

---

**Built with ❤️ using React Native and HealthKit**

⭐ Star this repo if it helped you!
