# LinkUup Mobile App - Deployment Guide

This guide covers testing and deployment procedures for the LinkUup mobile application.

## Testing Checklist

### 1. Device Testing

#### iOS Testing
- [ ] Test on physical iPhone device (iOS 15+)
- [ ] Test on iPad (if supported)
- [ ] Verify app works in both light and dark mode
- [ ] Test on different screen sizes (iPhone SE, iPhone 14 Pro Max)
- [ ] Test push notifications on physical device
- [ ] Test OAuth flows (Google, Facebook)
- [ ] Test location services
- [ ] Test camera/photo picker functionality
- [ ] Test app performance and memory usage

#### Android Testing
- [ ] Test on physical Android device (Android 10+)
- [ ] Test on different screen sizes and densities
- [ ] Verify app works in both light and dark mode
- [ ] Test push notifications on physical device
- [ ] Test OAuth flows (Google, Facebook)
- [ ] Test location services
- [ ] Test camera/photo picker functionality
- [ ] Test app performance and memory usage
- [ ] Test on different Android versions (10, 11, 12, 13, 14)

### 2. Feature Testing

#### Authentication
- [ ] Local login (email/password)
- [ ] Registration flow
- [ ] Password reset flow
- [ ] OAuth login (Google)
- [ ] OAuth login (Facebook)
- [ ] Logout functionality
- [ ] Token refresh on app resume
- [ ] Session persistence

#### Customer Features
- [ ] Home screen - search and featured businesses
- [ ] Search screen - filters and results
- [ ] Place details - view business information
- [ ] Booking flow - service selection
- [ ] Booking flow - employee selection
- [ ] Booking flow - date/time selection
- [ ] Booking confirmation
- [ ] View upcoming bookings
- [ ] View past bookings
- [ ] Cancel booking
- [ ] View rewards points
- [ ] Profile management

#### Owner Features
- [ ] Dashboard - stats and recent bookings
- [ ] Places management - list, add, edit
- [ ] Services management - CRUD operations
- [ ] Employees management - CRUD operations
- [ ] Bookings management - calendar and list views
- [ ] Bookings management - accept/decline bookings
- [ ] Customers management - view and search
- [ ] Campaigns management - create and manage campaigns
- [ ] Rewards management - configure settings
- [ ] Time off management - list and calendar views
- [ ] Time off management - approve requests
- [ ] Messaging - view and reply to messages
- [ ] Notifications - view and manage
- [ ] Settings - feature toggles

#### Notifications
- [ ] Request notification permissions
- [ ] Receive push notifications (foreground)
- [ ] Receive push notifications (background)
- [ ] Receive push notifications (killed state)
- [ ] Tap notification to navigate
- [ ] Booking reminder notifications
- [ ] Notification badge count
- [ ] Mark notifications as read

### 3. Performance Testing

- [ ] App startup time (< 3 seconds)
- [ ] Screen navigation smoothness
- [ ] Image loading performance
- [ ] API response times
- [ ] Memory usage (check for leaks)
- [ ] Battery usage
- [ ] Network request optimization
- [ ] Offline handling

### 4. Error Handling

- [ ] Network errors (no connection)
- [ ] API errors (400, 401, 403, 404, 500)
- [ ] Invalid form inputs
- [ ] Permission denials
- [ ] Token expiration
- [ ] Payment required (402) redirect

## EAS Build Configuration

### Prerequisites

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo account:
```bash
eas login
```

3. Configure project:
```bash
cd mobile
eas build:configure
```

### Build Configuration

Create `eas.json` in the `mobile` directory:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Environment Variables

Set environment variables in EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://linkuup.com/api/v1"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "your_key_here"
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "your_expo_project_id"
```

### Building

#### Development Build
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

#### Preview Build (Internal Testing)
```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

#### Production Build
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

## App Store Listings

### iOS App Store

1. **App Store Connect Setup**:
   - Create app in App Store Connect
   - Set bundle identifier: `com.linkuup.mobile`
   - Configure app information
   - Upload screenshots (required sizes)
   - Write app description
   - Set keywords and categories

2. **Required Assets**:
   - App icon (1024x1024)
   - Screenshots for iPhone (various sizes)
   - Screenshots for iPad (if supported)
   - App preview video (optional)

3. **Submit for Review**:
   ```bash
   eas submit --platform ios
   ```

### Google Play Store

1. **Google Play Console Setup**:
   - Create app in Google Play Console
   - Set package name: `com.linkuup.mobile`
   - Configure app information
   - Upload screenshots (required sizes)
   - Write app description
   - Set content rating

2. **Required Assets**:
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots (phone and tablet)
   - App preview video (optional)

3. **Submit for Review**:
   ```bash
   eas submit --platform android
   ```

## Production Checklist

### Before Release

- [ ] All tests passed
- [ ] All translation keys have fallbacks
- [ ] No console.log statements in production code
- [ ] Error handling implemented
- [ ] API endpoints configured correctly
- [ ] Environment variables set
- [ ] App icons and splash screens added
- [ ] Privacy policy URL configured
- [ ] Terms of service URL configured
- [ ] App version number incremented
- [ ] Build number incremented

### iOS Specific

- [ ] APNs certificates configured
- [ ] App Store Connect metadata complete
- [ ] TestFlight beta testing completed
- [ ] App Store review guidelines compliance
- [ ] Privacy permissions descriptions added

### Android Specific

- [ ] Google Play signing key configured
- [ ] Play Console metadata complete
- [ ] Internal testing completed
- [ ] Google Play review guidelines compliance
- [ ] Privacy permissions descriptions added

## Continuous Integration

### GitHub Actions (Optional)

Create `.github/workflows/mobile-build.yml`:

```yaml
name: Mobile Build

on:
  push:
    branches: [main]
    paths:
      - 'mobile/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: |
          cd mobile
          npm install
      - name: Run tests
        run: |
          cd mobile
          npm test
      - name: Build with EAS
        run: |
          npm install -g eas-cli
          cd mobile
          eas build --platform all --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## Monitoring and Analytics

### Recommended Tools

1. **Sentry** - Error tracking
2. **Firebase Analytics** - User analytics
3. **Expo Updates** - OTA updates
4. **App Store Connect Analytics** - iOS metrics
5. **Google Play Console Analytics** - Android metrics

## OTA Updates

Configure Expo Updates for over-the-air updates:

```bash
eas update:configure
```

Create update:
```bash
eas update --branch production --message "Bug fixes and improvements"
```

## Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check EAS build logs
   - Verify environment variables
   - Check app.json configuration

2. **Notifications Not Working**:
   - Verify APNs certificates (iOS)
   - Check notification permissions
   - Test on physical device

3. **OAuth Not Working**:
   - Verify redirect URIs configured
   - Check deep linking setup
   - Test on physical device

4. **API Errors**:
   - Verify API base URL
   - Check network connectivity
   - Review API logs

## Support

For issues or questions:
- Check Expo documentation: https://docs.expo.dev
- Check EAS documentation: https://docs.expo.dev/build/introduction/
- Review app logs in EAS dashboard

