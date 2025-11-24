# EAS Setup - Next Steps

## ✅ EAS CLI Installed Successfully!

You have EAS CLI version **16.26.0** installed.

## Next Steps

### Step 1: Login to Expo

Run this command (you'll be prompted to login or create an account):

```bash
npx eas-cli login
```

Or if you prefer using the global installation (after restarting terminal):

```bash
eas login
```

**Note:** If you don't have an Expo account, you can:
- Create one during login
- Or visit https://expo.dev/signup first

### Step 2: Initialize EAS Project

After logging in, navigate to the mobile directory and initialize:

```bash
cd mobile
npx eas-cli init
```

This will:
- ✅ Create a project on Expo's servers
- ✅ Generate a unique project ID
- ✅ Automatically add the project ID to `app.json`

### Step 3: Verify Project ID

After `eas init`, check that `app.json` now contains:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "...",
      "eas": {
        "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    }
  }
}
```

### Step 4: Build Development Version (Optional)

Once you have the project ID, you can build a development version:

```bash
# For Android
npx eas-cli build --profile development --platform android

# For iOS (requires Apple Developer account)
npx eas-cli build --profile development --platform ios
```

## Using npx vs Global Installation

Since the global `eas` command might not be in your PATH, you can use:

- **`npx eas-cli`** - Works immediately, no PATH configuration needed
- **`eas`** - Requires PATH configuration or terminal restart

Both work the same way!

## Quick Reference

```bash
# Login
npx eas-cli login

# Initialize project
cd mobile
npx eas-cli init

# Check project info
npx eas-cli project:info

# Build
npx eas-cli build --profile development --platform android
```

## Troubleshooting

**Command not found:**
→ Use `npx eas-cli` instead of `eas`

**Login issues:**
→ Make sure you have internet connection
→ Try creating account at https://expo.dev/signup first

**Init fails:**
→ Make sure you're logged in first
→ Check you're in the `mobile` directory

