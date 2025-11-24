# LinkUup Mobile App 📱

<div align="center">

![LinkUup Logo](./assets/favicon.svg)

**Book Smarter. Grow Faster.**

A comprehensive React Native mobile application built with Expo for connecting customers with professional services and helping businesses manage their operations.

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0-000020?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Private-red)]()

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Configuration](#configuration)
- [Building for Production](#building-for-production)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

LinkUup is a mobile marketplace platform that connects customers with professional service providers across multiple industries including beauty, wellness, healthcare, and home services. The app provides:

- **For Customers**: Easy discovery, booking, and management of service appointments
- **For Business Owners**: Comprehensive tools to manage bookings, employees, services, and customer relationships
- **For Administrators**: Platform-wide management and analytics

## ✨ Features

### Customer Features
- 🔍 **Smart Search**: Find services by location, type, and availability
- 📅 **Easy Booking**: Book appointments with real-time availability
- 🎁 **Rewards Program**: Earn and redeem loyalty points
- 📱 **Profile Management**: Manage bookings, preferences, and account settings
- 🔔 **Notifications**: Real-time booking reminders and updates

### Business Owner Features
- 🏢 **Place Management**: Create and manage multiple business locations
- 👥 **Employee Management**: Add employees, assign services, and manage schedules
- 📊 **Dashboard**: Overview of bookings, revenue, and business metrics
- 📅 **Booking Management**: Accept, decline, and manage customer bookings
- 💬 **Messaging**: Communicate with customers directly
- 🎯 **Campaigns**: Create and manage promotional campaigns
- ⏰ **Time Off Management**: Schedule employee time off and holidays

### Platform Features
- 🌍 **Multi-language Support**: Available in English, Portuguese, Spanish, French, German, and Italian
- 🎨 **Modern UI**: Clean, intuitive interface with brand blue theme
- 📱 **Cross-platform**: iOS, Android, and Web support
- 🔐 **Secure Authentication**: Email/password and OAuth (Google, Facebook)
- 📍 **Location Services**: Find nearby businesses and services
- 🖼️ **Image Management**: Upload and manage business images

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** (optional, can use npx)
- **Expo Go** app on your mobile device (for development testing)
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### For iOS Development (macOS only)
- Xcode (latest version)
- CocoaPods
- iOS Simulator

### For Android Development
- Android Studio
- Android SDK
- Android Emulator or physical device

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cetler74/linkuupapp.git
   cd linkuupapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or if you encounter peer dependency issues:
   npm install --legacy-peer-deps
   ```

3. **Configure environment variables** (optional)
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_API_BASE_URL=https://linkuup.com/api/v1
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

## 🏃 Running the App

### Development Mode

Start the Expo development server:

```bash
# Standard development server
npm start

# With dev client (for custom native code)
npm run start

# With Expo Go (simpler, no custom native code)
npm run start:go

# Clear cache and start
npx expo start --clear
```

Then:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your device

### Platform-Specific Commands

```bash
# iOS (with dev client)
npm run ios

# iOS (with Expo Go)
npm run ios:go

# Android (with dev client)
npm run android

# Android (with Expo Go)
npm run android:go

# Web (for testing)
npm run web
```

## 📁 Project Structure

```
mobile/
├── src/
│   ├── api/                    # API client and endpoints
│   │   └── api.ts              # Main API configuration
│   ├── components/             # Reusable UI components
│   │   ├── common/            # Common components (Logo, SearchBar, PlaceCard)
│   │   ├── ui/                # UI primitives (Button, Card, Input, ToggleSwitch)
│   │   ├── ErrorBoundary.tsx  # Error handling component
│   │   └── LoadingScreen.tsx   # Loading state component
│   ├── contexts/              # React Context providers
│   │   ├── AuthContext.tsx    # Authentication state
│   │   ├── PlaceContext.tsx    # Place/business state
│   │   ├── NotificationContext.tsx  # Push notifications
│   │   └── UserPermissionsContext.tsx  # User permissions
│   ├── navigation/            # Navigation configuration
│   │   ├── AppNavigator.tsx   # Main navigation setup
│   │   ├── CustomTabBar.tsx    # Custom tab bar component
│   │   └── navigationService.ts  # Navigation utilities
│   ├── screens/               # Screen components
│   │   ├── auth/             # Authentication screens
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   └── ResetPasswordScreen.tsx
│   │   ├── customer/         # Customer-facing screens
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── SearchScreen.tsx
│   │   │   ├── CustomerDashboardScreen.tsx
│   │   │   ├── CustomerBookingsScreen.tsx
│   │   │   ├── CustomerRewardsScreen.tsx
│   │   │   ├── CustomerProfileScreen.tsx
│   │   │   ├── PlaceDetailsScreen.tsx
│   │   │   ├── ServiceSelectionScreen.tsx
│   │   │   ├── EmployeeSelectionScreen.tsx
│   │   │   └── DateTimeSelectionScreen.tsx
│   │   ├── owner/            # Business owner screens
│   │   │   ├── OwnerDashboardScreen.tsx
│   │   │   ├── PlacesListScreen.tsx
│   │   │   ├── PlaceDetailsScreen.tsx
│   │   │   ├── AddPlaceScreen.tsx
│   │   │   ├── EditPlaceScreen.tsx
│   │   │   ├── BookingsScreen.tsx
│   │   │   ├── CustomersScreen.tsx
│   │   │   ├── EmployeesManagementScreen.tsx
│   │   │   ├── ServicesManagementScreen.tsx
│   │   │   ├── OwnerRewardsScreen.tsx
│   │   │   ├── CampaignsScreen.tsx
│   │   │   ├── TimeOffScreen.tsx
│   │   │   ├── MessagingScreen.tsx
│   │   │   ├── NotificationsScreen.tsx
│   │   │   └── OwnerSettingsScreen.tsx
│   │   └── admin/            # Admin screens
│   │       └── AdminDashboardScreen.tsx
│   ├── services/             # Service modules
│   │   └── notifications.ts  # Push notification service
│   ├── theme/                # Design system
│   │   └── theme.ts          # Colors, typography, spacing
│   ├── utils/                # Utility functions
│   │   ├── apiConfig.ts      # API configuration
│   │   └── storage.ts        # AsyncStorage wrapper
│   └── i18n/                 # Internationalization
│       ├── i18n.ts           # i18n configuration
│       └── locales/          # Translation files
│           ├── en/
│           ├── pt/
│           ├── es/
│           ├── fr/
│           ├── de/
│           └── it/
├── assets/                    # Images, videos, and static assets
│   ├── icon.png              # App icon
│   ├── favicon.svg           # Logo SVG
│   ├── splash-icon.png       # Splash screen image
│   └── *.mp4                 # Video assets
├── App.tsx                   # Root component
├── app.json                  # Expo configuration
├── eas.json                  # EAS Build configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🛠 Technologies

### Core
- **[React Native](https://reactnative.dev/)** (0.81.5) - Mobile framework
- **[Expo](https://expo.dev/)** (~54.0) - Development platform
- **[TypeScript](https://www.typescriptlang.org/)** (5.9) - Type safety
- **[React](https://react.dev/)** (19.1) - UI library

### Navigation & Routing
- **[React Navigation](https://reactnavigation.org/)** - Navigation library
  - `@react-navigation/native` (^7.0)
  - `@react-navigation/native-stack` (^7.0)
  - `@react-navigation/bottom-tabs` (^7.0)

### State Management & Data Fetching
- **[TanStack Query](https://tanstack.com/query)** (^5.90) - Server state management
- **React Context API** - Client state management

### UI & Styling
- **[Expo Vector Icons](https://docs.expo.dev/guides/icons/)** - Icon library
- **[React Native SVG](https://github.com/react-native-svg/react-native-svg)** - SVG support
- **[Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)** - Optimized image component

### Features
- **[Expo Auth Session](https://docs.expo.dev/guides/authentication/)** - OAuth authentication
- **[Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)** - Push notifications
- **[Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)** - Location services
- **[Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)** - Image selection
- **[React Native Maps](https://github.com/react-native-maps/react-native-maps)** - Maps integration
- **[React Native Calendars](https://github.com/wix/react-native-calendars)** - Calendar component

### Internationalization
- **[i18next](https://www.i18next.com/)** (^24.0) - Internationalization framework
- **[react-i18next](https://react.i18next.com/)** (^16.3) - React bindings

### Storage
- **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** - Persistent storage

### HTTP Client
- **[Axios](https://axios-http.com/)** (^1.13) - HTTP client

## ⚙️ Configuration

### API Configuration

The app connects to the LinkUup API. The base URL is configured in:
- `src/utils/apiConfig.ts` - Default: `https://linkuup.com/api/v1`
- Can be overridden via environment variables

### App Configuration

Main app configuration is in `app.json`:
- **App Name**: LinkUup
- **Bundle ID**: `com.linkuup.mobile`
- **Version**: 1.0.0
- **Scheme**: `linkuup`

### Theme Configuration

Theme settings are in `src/theme/theme.ts`:
- **Primary Color**: `#3b82f6` (Brand Blue)
- **Secondary Color**: `#ef4444` (Red)
- Typography, spacing, and other design tokens

## 🏗 Building for Production

### EAS Build

The app uses [Expo Application Services (EAS)](https://docs.expo.dev/build/introduction/) for building production apps.

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure build**
   ```bash
   eas build:configure
   ```

4. **Build for platforms**
   ```bash
   # iOS
   eas build --platform ios

   # Android
   eas build --platform android

   # Both
   eas build --platform all
   ```

See `EAS_SETUP.md`, `EAS_QUICK_START.md`, and `DEPLOYMENT_GUIDE.md` for detailed instructions.

## 🐛 Troubleshooting

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
npm install --legacy-peer-deps
```

### Common Issues

**Issue**: Metro bundler errors
- **Solution**: Clear cache and restart: `npx expo start --clear`

**Issue**: iOS build fails
- **Solution**: Run `cd ios && pod install` (if using bare workflow)

**Issue**: Android build fails
- **Solution**: Ensure Android SDK is properly configured

**Issue**: Module not found errors
- **Solution**: Delete `node_modules` and reinstall dependencies

## 📝 Development Notes

- The app uses **React Navigation** (not Expo Router) for navigation
- API calls are made to: `https://linkuup.com/api/v1`
- Storage uses AsyncStorage for React Native / localStorage for Web
- OAuth uses `expo-auth-session` for Google/Facebook login
- Push notifications require device token registration
- Location services require proper permissions setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Follow the existing code structure and naming conventions
- Add comments for complex logic

## 📄 License

This project is private and proprietary. All rights reserved.

## 🔗 Links

- **Repository**: [https://github.com/cetler74/linkuupapp](https://github.com/cetler74/linkuupapp)
- **API Documentation**: [https://linkuup.com/api/v1/docs](https://linkuup.com/api/v1/docs)
- **Expo Documentation**: [https://docs.expo.dev](https://docs.expo.dev)

## 👥 Authors

- **cetler74** - *Initial work*

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- React Native community for continuous improvements
- All contributors and testers

---

<div align="center">

**Made with ❤️ for LinkUup**

[Report Bug](https://github.com/cetler74/linkuupapp/issues) · [Request Feature](https://github.com/cetler74/linkuupapp/issues)

</div>
