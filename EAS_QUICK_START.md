# EAS Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```
*(Create account at https://expo.dev/signup if needed)*

### 3. Initialize EAS Project
```bash
cd mobile
eas init
```
This will:
- ✅ Create project on Expo servers
- ✅ Generate project ID automatically
- ✅ Add project ID to `app.json`

### 4. Verify Project ID
After `eas init`, check `app.json` - you should see:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    }
  }
}
```

### 5. Build Development Version
```bash
# For Android
eas build --profile development --platform android

# For iOS (requires Apple Developer account)
eas build --profile development --platform ios
```

### 6. Install & Run
1. Download the build from Expo Dashboard
2. Install on your device
3. Run: `npx expo start --dev-client`

## ✅ That's it!

Your push notifications will now work because:
- ✅ Project ID is automatically configured
- ✅ Development build supports push notifications
- ✅ No more "No Expo project ID found" warning

## 📋 Common Commands

```bash
# Check project info
eas project:info

# List builds
eas build:list

# Configure credentials
eas credentials

# Build for production
eas build --profile production --platform android
```

## 🔍 Troubleshooting

**"No project ID found"**
→ Run `eas init` to create project and get ID

**Push notifications not working**
→ Make sure you're using a development build (not Expo Go)

**Build fails**
→ Check credentials: `eas credentials`

## 📚 Full Documentation

See `EAS_SETUP.md` for detailed instructions.

