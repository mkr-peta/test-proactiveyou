# 🚀 Quick Start Guide

Get the Step Tracker app running in 15 minutes (excluding background testing).

## Prerequisites Checklist

- [ ] macOS with Xcode 14+ installed
- [ ] Node.js 18+ installed
- [ ] CocoaPods installed (`sudo gem install cocoapods`)
- [ ] Physical iPhone (HealthKit doesn't work in simulator)
- [ ] Apple Developer Account (for TestFlight)

## Step 1: Start Backend (2 minutes)

```bash
cd backend
npm install  # Already done
npm run dev
```

You should see:
```
Step Tracker API Server
Status: Running ✓
Port: 3000
```

Leave this terminal running.

## Step 2: Deploy Backend to Cloud (5 minutes)

**Choose one option:**

### Option A: ngrok (Fastest)
```bash
# In new terminal
ngrok http 3000
# Copy the https URL
```

### Option B: Railway (Free, Persistent)
1. https://railway.app → New Project → Deploy from GitHub
2. Root directory: `backend`
3. Copy deployment URL

### Option C: Render (Free, Persistent)
1. https://render.com → New Web Service
2. Root directory: `backend`
3. Start command: `npm start`
4. Copy deployment URL

## Step 3: Configure iOS App (1 minute)

Edit `src/config.ts`:
```typescript
API_ENDPOINT: 'https://YOUR-URL-HERE/api/steps',
```

Replace `YOUR-URL-HERE` with your ngrok/Railway/Render URL.

## Step 4: Install iOS Dependencies (2 minutes)

```bash
cd ios
pod install
cd ..
```

## Step 5: Open in Xcode (1 minute)

```bash
cd ios
open StepTrackerApp.xcworkspace
```

⚠️ Important: Open `.xcworkspace`, NOT `.xcodeproj`!

## Step 6: Configure Xcode (3 minutes)

1. **Select Target**: "StepTrackerApp" in left sidebar
2. **Signing & Capabilities**:
   - Team: Select your Apple Developer team
   - Check HealthKit capability exists
   - Check Background Delivery is enabled
3. **Connect iPhone**: Plug in physical iPhone via USB
4. **Select Device**: Choose your iPhone from device dropdown

## Step 7: Build & Run (1 minute)

1. Click **Run** (▶️) or press ⌘R
2. Grant HealthKit permissions when prompted
3. Walk around and click "Refresh"
4. Click "Upload Now" to test

## Verify It Works

### Check App
- [ ] App shows step count
- [ ] "Background Sync: ✓ Enabled" displayed
- [ ] "Upload Now" button works
- [ ] "Last Upload" timestamp updates

### Check Backend
```bash
curl https://your-url/api/steps/latest
```

Should return your step data!

## Test Background Delivery

1. Force quit the app (swipe up from app switcher)
2. Walk around for 10 minutes
3. Wait 1-2 hours
4. Check backend:
   ```bash
   curl https://your-url/api/steps/latest
   ```

If you see new data with recent timestamp → **Success!** 🎉

## Next Steps

- **Deploy to TestFlight**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Full Testing**: See [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Customization**: Edit `src/config.ts` for different settings

## Troubleshooting

**App won't build?**
```bash
# Clean and rebuild
cd ios
rm -rf Pods Podfile.lock
pod install
```

**No steps showing?**
- Walk around to generate steps
- Check Health app has step data
- Click Refresh button

**Backend not reachable?**
- Verify URL in `src/config.ts`
- Test URL in browser
- Check backend is running

**Need more help?**
See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed troubleshooting.

---

**That's it! You now have a working iOS app that syncs step data to the cloud, even when closed! 🎉**
