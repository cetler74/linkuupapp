# Expo Notifications Setup Guide

This document details the complete push notification setup for the LinkUup mobile app using Expo Notifications.

## Overview

The notification system handles:
- **Booking Alerts**: New bookings, cancellations, confirmations, reminders
- **System Notifications**: Updates, announcements, feature notifications
- **Local Reminders**: Scheduled notifications for upcoming bookings

## Architecture

### Components

1. **Notification Service** (`src/services/notifications.ts`)
   - Core notification functionality
   - Permission management
   - Device token registration
   - Local notification scheduling
   - Notification handlers

2. **Notification Context** (`src/contexts/NotificationContext.tsx`)
   - Global notification state
   - Unread count management
   - Permission status
   - Auto-refresh on app state changes

3. **Notifications Screen** (`src/screens/owner/NotificationsScreen.tsx`)
   - Display all notifications
   - Mark as read/unread
   - Filter by type
   - Delete notifications

## Setup Steps

### 1. Install Dependencies

```bash
npm install expo-notifications expo-device
```

Already included in `package.json`.

### 2. Configure app.json

The `expo-notifications` plugin is already configured:

```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/icon.png",
        "color": "#ffffff"
      }
    ]
  ]
}
```

### 3. iOS Configuration

For iOS, you need to:

1. **Configure APNs (Apple Push Notification service)**:
   - Create an Apple Developer account
   - Generate APNs certificates or keys
   - Configure in Expo Dashboard or EAS Build

2. **Add to app.json** (if not already present):
```json
{
  "ios": {
    "infoPlist": {
      "NSUserNotificationsUsageDescription": "LinkUup needs permission to send you booking reminders and updates."
    }
  }
}
```

### 4. Android Configuration

Android notifications are configured via notification channels:

- **booking-reminders**: For booking reminder notifications
- **booking-updates**: For booking status changes
- **new-bookings**: For new booking requests

Channels are automatically created in `notifications.ts`.

### 5. Backend Integration

The backend needs to support:

#### Device Token Registration
```
POST /notifications/register-device
Body: {
  device_token: string,
  platform: 'ios' | 'android',
  device_type: string
}
```

#### Device Token Unregistration
```
POST /notifications/unregister-device
Body: {
  device_token: string
}
```

#### Sending Push Notifications

The backend should use Expo's Push Notification service to send notifications:

```python
# Example Python code
import requests

def send_push_notification(device_token, title, body, data):
    response = requests.post(
        'https://exp.host/--/api/v2/push/send',
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
        },
        json={
            'to': device_token,
            'sound': 'default',
            'title': title,
            'body': body,
            'data': data,
            'priority': 'high',
            'channelId': 'booking-updates'  # Android only
        }
    )
    return response.json()
```

## Notification Types

### 1. New Booking (`new_booking`)
- **Trigger**: When a customer creates a booking
- **Recipient**: Business owner
- **Data**: `{ booking_id, place_id, type: 'new_booking' }`
- **Action**: Navigate to booking details

### 2. Booking Cancelled (`booking_cancelled`)
- **Trigger**: When a booking is cancelled
- **Recipient**: Business owner or customer
- **Data**: `{ booking_id, type: 'booking_cancelled' }`
- **Action**: Navigate to bookings list

### 3. Booking Confirmed (`booking_confirmed`)
- **Trigger**: When owner confirms a booking
- **Recipient**: Customer
- **Data**: `{ booking_id, type: 'booking_confirmed' }`
- **Action**: Navigate to booking details

### 4. Booking Reminder (`booking_reminder`)
- **Trigger**: Scheduled 1 hour before booking time
- **Recipient**: Customer
- **Data**: `{ booking_id, booking_date, booking_time, type: 'booking_reminder' }`
- **Action**: Navigate to booking details

### 5. Booking Updated (`booking_updated`)
- **Trigger**: When booking details change
- **Recipient**: Customer or owner
- **Data**: `{ booking_id, type: 'booking_updated' }`
- **Action**: Navigate to booking details

## Local Notifications

### Booking Reminders

Local notifications are scheduled when a booking is created:

```typescript
await scheduleBookingReminder(
  bookingId,
  bookingDate,
  bookingTime,
  customerName,
  serviceName,
  60 // minutes before
);
```

### Cancelling Reminders

When a booking is cancelled, the reminder is automatically cancelled:

```typescript
await cancelBookingReminder(bookingId);
```

## Notification Flow

### 1. App Launch
- Request notification permissions
- Get Expo Push Token
- Register token with backend
- Setup notification listeners

### 2. Foreground Notifications
- Notifications are shown automatically
- User can tap to navigate
- Badge count is updated

### 3. Background Notifications
- Handled by OS
- User taps notification → app opens → navigates to relevant screen

### 4. Killed State Notifications
- Handled by OS
- User taps notification → app launches → navigates to relevant screen

## Important: Development Builds Required

### ⚠️ Expo Go Limitation (SDK 53+)

**Android push notifications (remote notifications) are NOT supported in Expo Go starting with SDK 53.**

You must use a **development build** instead:

1. **Build a development client:**
   ```bash
   npx eas-cli build --profile development --platform android
   ```

2. **Install the development build** on your device

3. **Run with dev client:**
   ```bash
   npm run start
   # or
   npx expo start --dev-client
   ```

4. **Alternative scripts:**
   - `npm run start` - Uses development client (recommended)
   - `npm run start:go` - Uses Expo Go (push notifications won't work on Android)

See `EAS_QUICK_START.md` for detailed setup instructions.

### Local Notifications Still Work

Local notifications (scheduled reminders) will still work in Expo Go, but remote push notifications require a development build.

## Testing

### Development Testing

1. **Physical Device Required**: Push notifications don't work in simulators/emulators
2. **Development Build Required**: Use `npm run start` (not Expo Go) for Android push notifications
3. **Test Permission Flow**: 
   ```typescript
   const hasPermission = await requestNotificationPermissions();
   ```
4. **Test Local Notifications**:
   ```typescript
   await scheduleBookingReminder(...);
   ```
5. **Test Token Registration**:
   ```typescript
   const token = await getExpoPushToken();
   await registerDeviceToken(token);
   ```

### Production Testing

1. Build with EAS Build
2. Install on physical device
3. Test end-to-end notification flow
4. Verify backend integration

## Troubleshooting

### Notifications Not Appearing

1. **Check Permissions**: Ensure user granted notification permissions
2. **Check Device Token**: Verify token is registered with backend
3. **Check Backend**: Verify backend is sending notifications correctly
4. **Check Expo Project ID**: Ensure correct project ID in `getExpoPushTokenAsync`

### iOS Specific Issues

1. **APNs Configuration**: Ensure APNs certificates/keys are configured
2. **Provisioning Profile**: Must include push notification capability
3. **Entitlements**: Check app entitlements include push notifications

### Android Specific Issues

1. **Expo Go Limitation**: Android push notifications require a development build (not Expo Go) in SDK 53+
   - **Solution**: Build and use a development client with `eas build --profile development --platform android`
   - **Error Message**: "Android Push notifications functionality provided by expo-notifications was removed from Expo Go"
   - **Fix**: Use `npm run start` instead of `npm run start:go`

2. **Notification Channels**: Ensure channels are created
3. **Battery Optimization**: Some devices may restrict background notifications
4. **Do Not Disturb**: Check device notification settings

## Best Practices

1. **Request Permissions Early**: Request on first app launch
2. **Handle Denials Gracefully**: Don't block app functionality if permissions denied
3. **Clear Badge Count**: Reset badge when user views notifications
4. **Cancel Old Reminders**: Clean up reminders for past bookings
5. **Test on Both Platforms**: iOS and Android handle notifications differently

## Security Considerations

1. **Token Storage**: Device tokens are stored securely in AsyncStorage
2. **Token Validation**: Backend should validate tokens before sending
3. **User Privacy**: Only send notifications user has opted into
4. **Rate Limiting**: Backend should implement rate limiting for notifications

## Future Enhancements

- [ ] Rich notifications with images
- [ ] Action buttons in notifications
- [ ] Notification grouping
- [ ] Custom notification sounds
- [ ] Notification preferences screen
- [ ] Quiet hours configuration

