# Testing Guide - Step Tracker App

Complete testing procedure for the Step Tracker iOS app.

## 🧪 Testing Phases

### Phase 1: Backend Testing (5 minutes)

#### 1.1 Start Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
Step Tracker API Server
Status: Running ✓
Port: 3000
```

#### 1.2 Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 5.123,
  "recordsStored": 0
}
```

#### 1.3 Test POST Endpoint

```bash
curl -X POST http://localhost:3000/api/steps \
  -H "Content-Type: application/json" \
  -d '{
    "steps": 1234,
    "timestamp": "2024-01-01T12:00:00Z",
    "deviceType": "iOS"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Step data recorded successfully",
  "data": {
    "id": "1704110400000",
    "steps": 1234,
    "timestamp": "2024-01-01T12:00:00Z",
    "deviceType": "iOS",
    "receivedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 1.4 Test GET Latest

```bash
curl http://localhost:3000/api/steps/latest
```

Should return the data you just posted.

#### 1.5 Test Statistics

```bash
curl http://localhost:3000/api/stats
```

Expected response with statistics.

✅ **Phase 1 Complete**: Backend is working correctly!

---

### Phase 2: Deploy Backend to Cloud (10 minutes)

You can't test the iOS app with `localhost` on a physical device. Deploy the backend:

#### Option A: Using ngrok (Fastest for Testing)

```bash
# In a new terminal, while backend is running
ngrok http 3000
```

You'll get output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

Copy the `https://abc123.ngrok.io` URL.

#### Option B: Deploy to Railway (Free, Persistent)

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Choose "Deploy from GitHub repo"
5. Select the repository
6. Set root directory: `backend`
7. Deploy
8. Copy the deployment URL (e.g., `https://step-tracker-production.up.railway.app`)

#### Option C: Deploy to Render (Free, Persistent)

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repo
4. Configure:
   - Name: `step-tracker-backend`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Create Web Service
6. Copy the deployment URL

#### Update iOS App Configuration

Edit `src/config.ts`:
```typescript
API_ENDPOINT: 'https://your-deployed-url.com/api/steps',
```

Replace with your actual URL from ngrok/Railway/Render.

✅ **Phase 2 Complete**: Backend is accessible from internet!

---

### Phase 3: iOS App Testing - Foreground (15 minutes)

#### 3.1 Build Prerequisites

```bash
# Install iOS dependencies
cd ios
pod install
cd ..
```

#### 3.2 Open in Xcode

```bash
cd ios
open StepTrackerApp.xcworkspace
```

⚠️ **Important**: Open `.xcworkspace`, NOT `.xcodeproj`!

#### 3.3 Configure Xcode

1. **Select Target**: Click "StepTrackerApp" in left sidebar
2. **Signing & Capabilities**:
   - Select your Team (Apple Developer account)
   - Ensure HealthKit capability is present
   - Ensure Background Delivery is checked
3. **Info.plist**: Verify these keys exist:
   - `NSHealthShareUsageDescription`
   - `UIBackgroundModes` with `fetch` and `processing`
   - `UIRequiredDeviceCapabilities` with `healthkit`

#### 3.4 Connect Physical iPhone

1. Plug in your iPhone via USB
2. Unlock the device
3. Trust the computer if prompted
4. In Xcode, select your iPhone from the device dropdown

⚠️ **Cannot use Simulator**: HealthKit doesn't work in iOS Simulator!

#### 3.5 Build and Run

1. Click **Run** button (▶️) or press ⌘R
2. Wait for build to complete
3. App should launch on your iPhone

#### 3.6 Grant Permissions

When the app launches:
1. It will request HealthKit permissions
2. Tap **Allow**
3. Select which data to share (ensure "Steps" is enabled)

#### 3.7 Test Step Display

1. The app should show "Today's Steps: 0" (or current count)
2. Walk around or shake your phone
3. Open the Health app → Browse → Activity → Steps
4. Verify steps are being recorded
5. Go back to Step Tracker app
6. Click **Refresh** button
7. Steps should update

Expected behavior:
- ✅ Steps display in the app
- ✅ Refresh button updates the count
- ✅ Status shows "Background Sync: ✓ Enabled"

#### 3.8 Test Manual Upload

1. Click **Upload Now (Manual)** button
2. Should see "Success" alert
3. Check "Last Upload" timestamp - should update

Verify in backend:
```bash
curl https://your-deployed-url.com/api/steps/latest
```

Should see your step data!

✅ **Phase 3 Complete**: App works in foreground!

---

### Phase 4: iOS App Testing - Background (2-4 hours)

This is the critical test: does it work when the app is closed?

#### 4.1 Prepare for Background Test

1. Ensure app is running and "Background Sync: ✓ Enabled"
2. Note current step count and last upload time
3. Walk around to add ~100 more steps
4. Verify new steps appear in Health app

#### 4.2 Force Quit the App

1. Double-tap home button (or swipe up on newer iPhones)
2. Find Step Tracker app
3. Swipe up to force quit
4. App should completely close

#### 4.3 Generate More Steps

1. Walk around for 5-10 minutes
2. Add at least 500-1000 more steps
3. Verify in Health app that steps are being recorded

#### 4.4 Wait for Background Delivery

⏰ **This is the hard part!**

iOS Background Delivery timing:
- **Minimum**: ~1 hour between triggers
- **Typical**: 1-2 hours for first trigger after setup
- **Factors**: Device activity, battery, iOS discretion

What to do while waiting:
- Keep phone active (not asleep for long periods)
- Don't enable Low Power Mode
- Keep walking periodically
- Check backend every 30 minutes

#### 4.5 Monitor Backend

Check periodically:
```bash
# Every 30 minutes, check for new uploads
curl https://your-deployed-url.com/api/steps

# Check latest
curl https://your-deployed-url.com/api/steps/latest

# Check count
curl https://your-deployed-url.com/api/stats
```

Look for:
- New records appearing
- Timestamps showing uploads after force quit
- Increasing step counts

#### 4.6 Check iOS Logs (Optional)

If you want to see what's happening:

1. Xcode → Window → Devices and Simulators
2. Select your iPhone
3. Click "Open Console"
4. Filter for "HealthKit" or "Step"

Look for messages like:
- "Step count changed - Background delivery triggered"
- "Handling background update..."
- "Step data uploaded successfully"

#### 4.7 Verify Background Upload

After 1-2 hours:

1. Check backend API for new data
2. Open Step Tracker app
3. Check "Last Upload" time
4. Should show a recent timestamp (even though app was closed)

Expected results:
- ✅ New data appeared in backend while app was closed
- ✅ Last upload timestamp is after you force-quit the app
- ✅ Step count matches what's in Health app

✅ **Phase 4 Complete**: Background delivery works!

---

### Phase 5: Edge Case Testing (30 minutes)

#### 5.1 Test Device Lock

1. Lock your iPhone with passcode
2. Wait 5 minutes
3. Unlock and check if background delivery triggered

⚠️ Expected: May NOT work when locked (iOS privacy feature)

#### 5.2 Test Low Power Mode

1. Enable Low Power Mode
2. Generate steps
3. Wait 1 hour

⚠️ Expected: Background delivery may be delayed

#### 5.3 Test No Internet

1. Enable Airplane Mode
2. Force quit app
3. Walk around
4. Re-enable internet after 10 minutes

Expected: App should queue uploads and sync when reconnected

#### 5.4 Test Rapid Steps

1. Rapidly shake phone (simulates running)
2. Check if step count updates
3. Try manual upload

Expected: Should handle large step counts

#### 5.5 Test Fresh Install

1. Delete app from iPhone
2. Reinstall from Xcode
3. Grant permissions again
4. Test full flow

Expected: Should work like first time

---

## 📊 Test Results Checklist

### Backend Tests
- [ ] Health endpoint responds
- [ ] Can POST step data
- [ ] Can GET step data
- [ ] Statistics endpoint works
- [ ] Data persists after server restart

### Frontend Tests (Foreground)
- [ ] App builds without errors
- [ ] App launches on physical iPhone
- [ ] HealthKit permissions granted
- [ ] Step count displays correctly
- [ ] Refresh button works
- [ ] Manual upload succeeds
- [ ] Backend receives data
- [ ] UI updates after upload

### Background Tests
- [ ] Background sync enabled
- [ ] App force-quit successfully
- [ ] New steps generated after force-quit
- [ ] Backend received data while app closed
- [ ] Upload timestamp after force-quit time
- [ ] Multiple background uploads occurred

### Edge Cases
- [ ] Works after device lock/unlock
- [ ] Handles no internet gracefully
- [ ] Works after app reinstall
- [ ] Handles large step counts

---

## 🐛 Common Issues & Solutions

### "Background Sync: ✗ Disabled"
- Check HealthKit capability in Xcode
- Verify `UIBackgroundModes` in Info.plist
- Check entitlements file

### No data in backend
- Verify API endpoint URL in `src/config.ts`
- Check backend is running and accessible
- Test backend URL in browser
- Check Xcode console for errors

### Background delivery not triggering
- Wait longer (minimum 1 hour)
- Generate more step data
- Disable Low Power Mode
- Keep device active
- Check it's not locked with passcode

### Steps not updating
- Walk around more
- Check Health app shows new steps
- Click Refresh button
- Check HealthKit permissions

### Build errors in Xcode
- Clean build: Product → Clean Build Folder
- Delete derived data
- Re-run `pod install`
- Check code signing

---

## 📈 Expected Timeline

| Phase | Duration | Outcome |
|-------|----------|---------|
| Backend Testing | 5 min | Backend working locally |
| Deploy Backend | 10 min | Backend accessible from internet |
| iOS Foreground | 15 min | App working, manual upload successful |
| iOS Background | 2-4 hours | Background delivery confirmed |
| Edge Cases | 30 min | All scenarios tested |
| **Total** | **3-5 hours** | **Fully tested app** |

---

## ✅ Definition of "Done"

The app is considered fully tested when:

1. ✅ Backend API responds to all endpoints
2. ✅ iOS app displays step count from HealthKit
3. ✅ Manual upload sends data to backend
4. ✅ App is force-quit
5. ✅ New steps are generated
6. ✅ Backend receives data while app is closed
7. ✅ Upload timestamp proves background delivery worked

---

## 🎯 Success Criteria

**The main goal**: Prove that the app can upload step data to the cloud even when completely closed (cleared from RAM).

**Evidence of success**:
1. Backend logs showing POST requests with timestamps
2. Step data records with `receivedAt` times after app force-quit
3. iOS console logs showing "Background delivery triggered"
4. Multiple uploads occurring ~hourly without user interaction

---

## 📞 Need Help?

If tests are failing:

1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) troubleshooting section
2. Review Xcode console for errors
3. Verify all prerequisites are met
4. Ensure using physical iPhone (not simulator)
5. Check backend logs for incoming requests

**Most common issue**: Background delivery takes longer than expected. Be patient and wait at least 2 hours for first trigger!

---

**Good luck with testing! 🚀**
