# LinkUup Mobile App

React Native mobile application built with Expo, leveraging the existing React web codebase.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (installed globally or via npx)
- Expo Go app on your mobile device (for development)

### Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

### Running the App

#### Start Development Server

To start the Expo development server with a clean cache:

```bash
npx expo start --clear
```

Or using npm script:

```bash
npm start
```

Then press:
- `i` to open iOS simulator
- `a` to open Android emulator
- Scan QR code with Expo Go app on your device

#### Platform-Specific Commands

```bash
# iOS
npm run ios
# or
npx expo start --ios

# Android
npm run android
# or
npx expo start --android

# Web (for testing)
npm run web
```

### Environment Variables

Create a `.env` file in the `mobile` directory:

```bash
EXPO_PUBLIC_API_BASE_URL=https://linkuup.com/api/v1
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

### Project Structure

```
mobile/
├── src/
│   ├── api/              # API client (shared with web)
│   ├── contexts/         # React contexts (Auth, Place, etc.)
│   ├── screens/          # Screen components
│   │   ├── auth/        # Authentication screens
│   │   ├── customer/    # Customer screens
│   │   ├── owner/       # Business owner screens
│   │   └── admin/       # Admin screens
│   ├── navigation/       # Navigation setup
│   ├── components/       # Reusable components
│   ├── utils/            # Utilities (storage, config)
│   ├── types/            # TypeScript types
│   ├── i18n/             # Translations
│   └── theme/            # Design system
├── App.tsx              # Root component
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Development Notes

- The app uses React Navigation (not Expo Router) for navigation
- API calls go to: `https://linkuup.com/api/v1`
- Storage uses AsyncStorage (React Native) / localStorage (Web)
- OAuth uses `expo-auth-session` for Google/Facebook login

## Troubleshooting

### Clear Cache
```bash
npx expo start --clear
```

### Reset Metro Bundler
```bash
npx expo start --reset-cache
```

### Reinstall Dependencies
```bash
rm -rf node_modules
npm install
```

## Building for Production

See the implementation plan for EAS Build configuration and deployment steps.

