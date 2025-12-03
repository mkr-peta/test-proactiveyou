# Step Tracker App - Complete Setup Guide

This guide will walk you through setting up the iOS Step Tracker app and backend from scratch.

## 📋 Prerequisites

### Required
- **macOS** (for iOS development)
- **Xcode 14+** (from Mac App Store)
- **Apple Developer Account** ($99/year - required for TestFlight)
- **Node.js 18+** and npm
- **CocoaPods** (for iOS dependencies)
- **Physical iPhone** (HealthKit doesn't work in simulator)

### Installation Commands
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods

# Verify Node.js version
node --version  # Should be 18+
```

---

## 🚀 Part 1: Setup Backend API

### Step 1: Navigate to backend directory
```bash
cd backend
```

### Step 2: Install dependencies (already done)
```bash
npm install
```

### Step 3: Start the backend server
```bash
npm run dev
```

You should see:
```
Step Tracker API Server
Status: Running ✓
Port: 3000
```

### Step 4: Test the API
Open a new terminal and test:
```bash
curl http://localhost:3000/health
```

### Step 5: Deploy to cloud (for real device testing)

**Option A: Using ngrok (quick testing)**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
# Copy the https URL (e.g., https://abc123.ngrok.io)
```

**Option B: Deploy to Railway (free tier)**
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set root directory to `backend`
6. Deploy and copy the URL

**Option C: Deploy to Render (free tier)**
1. Go to https://render.com
2. Create new "Web Service"
3. Connect your GitHub repo
4. Root directory: `backend`
5. Build command: `npm install`
6. Start command: `npm start`
7. Copy the deployment URL

Save your backend URL - you'll need it for the iOS app!

---

## 📱 Part 2: Setup iOS App in Xcode

### Step 1: Open Xcode and create iOS project

Since React Native needs the iOS project to be initialized properly, follow these steps:

```bash
# Go back to project root
cd ..

# Initialize iOS project using CocoaPods
cd ios
pod init
```

### Step 2: Create the Xcode project

1. Open **Xcode**
2. Click **File → New → Project**
3. Select **iOS → App**
4. Configure:
   - Product Name: `StepTrackerApp`
   - Team: Select your Apple Developer team
   - Organization Identifier: `com.yourname` (e.g., `com.john`)
   - Bundle Identifier: `com.yourname.StepTrackerApp`
   - Interface: **Storyboard** (we'll replace with React Native)
   - Language: **Objective-C** or **Swift**
5. Save in the `ios` directory (replace if exists)

### Step 3: Configure HealthKit Capability

1. In Xcode, select your project in the left sidebar
2. Select the **StepTrackerApp** target
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability**
5. Add **HealthKit**
6. Check **Background Delivery** under HealthKit

### Step 4: Copy Info.plist configuration

Replace the content of `ios/StepTrackerApp/Info.plist` with the provided file, or manually add:

```xml
<key>NSHealthShareUsageDescription</key>
<string>We need access to your step count to track and upload your daily activity to the cloud.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>We need access to update your health data.</string>
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>processing</string>
</array>
<key>UIRequiredDeviceCapabilities</key>
<array>
    <string>healthkit</string>
</array>
```

### Step 5: Install iOS dependencies

```bash
cd ios
pod install
```

### Step 6: Update API endpoint

Edit `src/config.ts` and update the API endpoint:
```typescript
API_ENDPOINT: 'https://your-backend-url.com/api/steps',
```

Replace with your actual backend URL from Part 1, Step 5.

### Step 7: Open in Xcode and Build

```bash
# Open the workspace (not .xcodeproj!)
open StepTrackerApp.xcworkspace
```

In Xcode:
1. Select your **physical iPhone** as the build target (not simulator)
2. Click **Product → Build** (⌘B)
3. Fix any build errors
4. Click **Product → Run** (⌘R)

---

## 🧪 Part 3: Testing

### Local Testing

1. **Backend running**: Make sure backend is running (`npm run dev`)
2. **Build app**: Build and run on physical iPhone
3. **Grant permissions**: When prompted, allow HealthKit access
4. **Walk around**: Take some steps!
5. **Check app**: Should display your step count
6. **Check backend**: Visit `http://localhost:3000/api/steps/latest`

### Testing Background Delivery

This is tricky! iOS background delivery is finicky:

1. **Force quit the app**: Swipe up from app switcher
2. **Wait**: Background delivery triggers ~hourly
3. **Walk more**: iOS needs new step data to trigger wake-up
4. **Lock phone**: Test if it works when locked
5. **Check logs**: In Xcode → Window → Devices and Simulators → View Device Logs

⚠️ **Important**: Background delivery may take 1-2 hours to trigger first time!

---

## 🚢 Part 4: Deploy to TestFlight

### Step 1: Prepare for Archive

1. In Xcode, select **Any iOS Device (arm64)** as build target
2. Go to **Product → Scheme → Edit Scheme**
3. Set **Build Configuration** to **Release**

### Step 2: Archive the App

1. **Product → Archive**
2. Wait for archive to complete
3. The Organizer window will open

### Step 3: Distribute to TestFlight

1. In Organizer, select your archive
2. Click **Distribute App**
3. Select **App Store Connect**
4. Click **Upload**
5. Select your distribution certificate and provisioning profile
6. Click **Upload**

### Step 4: Process in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Select your app
3. Go to **TestFlight** tab
4. Wait for processing (10-30 minutes)
5. Once processed, add testers:
   - Click **Internal Testing** or **External Testing**
   - Add testers by email
   - They'll receive an invite to install TestFlight app

### Step 5: Testers Install

1. Testers install **TestFlight** app from App Store
2. They open the invite link
3. Install **Step Tracker** app from TestFlight
4. Grant HealthKit permissions when prompted

---

## 🔧 Troubleshooting

### App won't build
- Clean build folder: **Product → Clean Build Folder** (⇧⌘K)
- Delete `node_modules` and `ios/Pods`, reinstall
- Check code signing settings in Xcode

### HealthKit permission denied
- Delete app from iPhone
- Reinstall and grant permissions
- Check Info.plist has usage descriptions

### Background delivery not working
- Ensure HealthKit background capability is enabled
- Check device is not in Low Power Mode
- Background delivery is not instant (~hourly)
- Check Xcode device logs for errors

### Can't reach backend
- Check backend URL in `src/config.ts`
- Ensure backend is deployed and accessible
- Test backend URL in browser/Postman
- Check iOS allows HTTP (if not using HTTPS)

### TestFlight upload fails
- Ensure bundle ID is registered in App Store Connect
- Check provisioning profiles are valid
- Increment build number (CFBundleVersion)

---

## 📊 Monitoring

### Check Backend Data
```bash
# Get latest submission
curl https://your-backend-url.com/api/steps/latest

# Get statistics
curl https://your-backend-url.com/api/stats

# Get all submissions
curl https://your-backend-url.com/api/steps
```

### Check iOS Logs
1. Xcode → Window → Devices and Simulators
2. Select your iPhone
3. Click **Open Console**
4. Filter for "Step" or "HealthKit"

---

## ⚙️ Configuration

### Change Upload Interval

Edit `src/config.ts`:
```typescript
UPLOAD_INTERVAL: 5 * 60 * 1000, // 5 minutes
```

Change to:
- `1 * 60 * 1000` → 1 minute
- `10 * 60 * 1000` → 10 minutes
- `30 * 60 * 1000` → 30 minutes

⚠️ **Note**: iOS enforces minimum ~1 hour for background delivery regardless of this setting!

### Change API Endpoint

Edit `src/config.ts`:
```typescript
API_ENDPOINT: 'https://your-new-backend.com/api/steps'
```

---

## 🎯 What Works & What Doesn't

### ✅ What Works
- Reading step count from HealthKit
- Displaying steps in app
- Uploading to cloud when app is open
- Background delivery when app is closed (~hourly)
- Works even after force quit
- TestFlight distribution

### ❌ Limitations
- Background delivery is ~1 hour minimum (iOS restriction)
- Doesn't work when device is locked with passcode (privacy)
- Doesn't work in iOS Simulator (HealthKit limitation)
- Requires physical iPhone for testing
- Background delivery timing is advisory (iOS decides when)

---

## 🆘 Need Help?

Common issues:
1. **No steps showing**: Walk around, then click Refresh
2. **Permission error**: Delete and reinstall app
3. **Backend unreachable**: Check URL and network
4. **TestFlight not working**: Check Apple Developer account status

---

## 🎉 Success Checklist

- [ ] Backend running and accessible
- [ ] iOS app builds without errors
- [ ] HealthKit permissions granted
- [ ] App displays step count
- [ ] Manual upload works
- [ ] Backend receives data
- [ ] App archived successfully
- [ ] TestFlight upload complete
- [ ] Testers can install and run app

---

**Next Steps**: Once everything works, consider adding:
- User authentication
- Multiple users support
- Data visualization/charts
- Push notifications
- Cloud database (PostgreSQL, MongoDB)
- Production-ready error handling
