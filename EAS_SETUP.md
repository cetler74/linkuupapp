# EAS (Expo Application Services) Setup Guide

This guide will help you configure EAS for your LinkUup mobile app to enable push notifications and create production builds.

## Prerequisites

1. An Expo account (create one at https://expo.dev/signup if you don't have one)
2. Node.js installed
3. npm or yarn package manager

## Step 1: Install EAS CLI

Install the EAS CLI globally:

```bash
npm install -g eas-cli
```

Or use npx (no installation needed):

```bash
npx eas-cli --version
```

## Step 2: Login to Expo

Login to your Expo account:

```bash
eas login
```

If you don't have an account, you can create one during login or visit https://expo.dev/signup

## Step 3: Initialize EAS in Your Project

Navigate to your mobile directory and initialize EAS:

```bash
cd mobile
eas init
```

This will:
- Create an `eas.json` configuration file (already created for you)
- Link your project to Expo
- Create a project on Expo's servers

## Step 4: Configure Project ID

After running `eas init`, Expo will automatically:
1. Create a project in your Expo account
2. Generate a unique project ID (UUID)
3. Add it to your `app.json` under `extra.eas.projectId`

You can verify this by checking your `app.json` - it should now have:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "...",
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

## Step 5: Alternative - Set Project ID Manually

If you already have a project ID or want to set it manually, you can:

### Option A: Set via Environment Variable

Create a `.env` file in the `mobile` directory:

```bash
EXPO_PUBLIC_PROJECT_ID=your-project-id-here
```

### Option B: Add to app.json

Add it directly to `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "https://linkuup.com/api/v1",
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

## Step 6: Get Your Project ID

If you need to find your project ID:

1. **From Expo Dashboard:**
   - Visit https://expo.dev/accounts/[your-account]/projects/[your-project]
   - The project ID is shown in the project settings

2. **From EAS CLI:**
   ```bash
   eas project:info
   ```

3. **From app.json:**
   - After running `eas init`, check `app.json` for `extra.eas.projectId`

## Step 7: Configure Push Notifications

### For iOS (Apple Push Notification Service)

1. **Create Apple Developer Account** (if you don't have one)
   - Visit https://developer.apple.com
   - Enroll in Apple Developer Program ($99/year)

2. **Configure APNs in EAS:**
   ```bash
   eas credentials
   ```
   - Select your project
   - Choose iOS
   - Follow prompts to configure push notification credentials

3. **Or use Expo's managed credentials:**
   - EAS can automatically manage credentials for you
   - Run `eas build --platform ios` and follow prompts

### For Android

Android push notifications work automatically with Expo. No additional configuration needed for FCM (Firebase Cloud Messaging).

## Step 8: Build Your App

### Development Build (with push notifications support)

```bash
# For Android
eas build --profile development --platform android

# For iOS
eas build --profile development --platform ios
```

### Preview Build (for testing)

```bash
# For Android
eas build --profile preview --platform android

# For iOS
eas build --profile preview --platform ios
```

### Production Build

```bash
# For Android
eas build --profile production --platform android

# For iOS
eas build --profile production --platform ios
```

## Step 9: Install Development Build

After building, install the development build on your device:

1. **Download the build:**
   - EAS will provide a download link after build completes
   - Or find it in Expo Dashboard under your project's builds

2. **Install on device:**
   - **Android:** Download the APK and install directly
   - **iOS:** Install via TestFlight or direct download (requires Apple Developer account)

3. **Run your app:**
   ```bash
   npx expo start --dev-client
   ```

## Step 10: Verify Push Notifications

Once you have a development build installed:

1. The app will automatically get the project ID from `app.json`
2. Push notifications should work without the warning
3. Test by sending a notification from your backend

## Troubleshooting

### "No Expo project ID found" Warning

**Solution:** Make sure you've run `eas init` and the project ID is in `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### Push Notifications Not Working

1. **Check project ID:**
   ```bash
   eas project:info
   ```

2. **Verify in app.json:**
   - Ensure `extra.eas.projectId` exists

3. **Check device:**
   - Must be a physical device (not simulator/emulator)
   - Must have granted notification permissions

4. **Check backend:**
   - Ensure backend is sending notifications to correct Expo push token
   - Verify token is registered with backend

### Build Fails

1. **Check credentials:**
   ```bash
   eas credentials
   ```

2. **Check app.json:**
   - Ensure all required fields are present
   - Verify bundle identifiers match

3. **Check EAS status:**
   ```bash
   eas build:list
   ```

## Quick Start Commands

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Initialize (creates project and gets project ID)
cd mobile
eas init

# 4. Build development version
eas build --profile development --platform android

# 5. Start development server
npx expo start --dev-client
```

## Additional Resources

- [EAS Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/building-on-ci/)
- [Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [Expo Dashboard](https://expo.dev)

## Notes

- **Development builds** are required for push notifications in Expo SDK 53+
- **Expo Go** doesn't support push notifications anymore
- **Project ID** is automatically added to `app.json` after `eas init`
- **Free tier** includes limited builds per month
- **Production builds** require Apple Developer account for iOS ($99/year)

