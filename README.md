# XtremePush Expo Plugin

A comprehensive config plugin for Expo applications that integrates XtremePush functionality with full React Native module support for both iOS and Android platforms.

## Features

### 🚀 Core Integration
- **Automatic React Native Module Setup**: Creates and configures native modules for seamless JavaScript-to-native communication
- **Smart File Management**: Automatically copies and configures all necessary files to the correct locations
- **Package Name Detection**: Automatically detects and updates package names in Android files to match your Expo project

### 📱 Platform Support
- **Android**: Full integration with automatic permission setup, dependency management, and MainApplication configuration
- **iOS**: Complete Xcode project integration with AppDelegate configuration and background modes setup

### 🔧 Configuration & Customization
- **Flexible Key Management**: Support for platform-specific or unified application keys
- **Configurable Permissions**: Granular control over location services and push notification permissions
- **Debug Support**: Built-in debug logging for development and troubleshooting

### 📦 Automatic File Integration
- **JavaScript Module**: Automatically copies `xtremepush.js` to your app root for easy importing
- **Android Native Files**: Adds `RNXtremepushReactModule.java` and `RNXtremepushReactPackage.java` to your Android package
- **iOS Native Files**: Integrates `RNXtremepushReact.h` and `RNXtremepushReact.m` into your Xcode project
- **ReactPackage Registration**: Automatically adds the ReactPackage to your MainApplication's `getPackages()` method

## Installation

```bash
npm install @xtremepush/expo-plugin
```

*Note: This will be available on NPM once published.*

## Usage

Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      ["./plugins/expo-plugin.js", {
        "applicationKey": "YOUR_APP_KEY",
        "iosAppKey": "YOUR_IOS_APP_KEY",
        "androidAppKey": "YOUR_ANDROID_APP_KEY",
        "googleSenderId": "GOOGLE_SENDER_ID",
        "enableDebugLogs": true,
        "enableLocationServices": true,
        "enablePushPermissions": true
      }]
    ]
  }
}
```

### JavaScript Usage

After running the plugin, you can import and use XtremePush in your React Native code:

```javascript
import Xtremepush, { 
  hitEvent, 
  hitTag, 
  hitTagWithValue, 
  openInbox, 
  setUser, 
  setExternalId, 
  requestNotificationPermissions 
} from './xtremepush';

// Or use the default export
Xtremepush.hitEvent('user_action');
Xtremepush.hitTag('premium_user');

// Or use named exports
hitEvent('user_action');
hitTag('premium_user');
hitTagWithValue('user_level', 'gold');
setUser('user123');
setExternalId('ext123');
openInbox();
requestNotificationPermissions();
```

## Configuration Options

### Required Parameters
- `googleSenderId` (string): Your Google Cloud Messaging Sender ID for Firebase push notifications

### Application Keys (at least one required)
- `applicationKey` (string): XtremePush Application Key (used for both platforms if platform-specific keys not provided)
- `iosAppKey` (string): iOS-specific XtremePush Application Key (overrides applicationKey for iOS)
- `androidAppKey` (string): Android-specific XtremePush Application Key (overrides applicationKey for Android)

### Optional Parameters
- `enableDebugLogs` (boolean): Enable debug logging for development. **Default: `true`**
- `enableLocationServices` (boolean): Enable location services and permissions. **Default: `true`**
- `enablePushPermissions` (boolean): Automatically request push notification permissions. **Default: `true`**

## What This Plugin Does

### 🔄 Automatic File Operations
1. **Copies `xtremepush.js`** to your Expo app root directory
2. **Adds Android native files** to your Android package directory with automatic package name updates
3. **Integrates iOS native files** into your Xcode project
4. **Registers ReactPackage** in your MainApplication's `getPackages()` method

### 🤖 Android Configuration
- **Permissions**: Internet, Network State, Wake Lock, Vibrate, Boot Completed, Post Notifications, Location (if enabled)
- **Dependencies**: XtremePush SDK, Firebase Messaging, OkHttp, Otto, Gson, AndroidX Security, Work Runtime
- **Build Configuration**: Maven repository, Google Services plugin
- **MainApplication**: PushConnector initialization and ReactPackage registration
- **Activity Integration**: Automatic import statements for all activities

### 🍎 iOS Configuration
- **Podfile**: XtremePush iOS SDK integration
- **AppDelegate**: XPush initialization (Swift/Objective-C support)
- **Info.plist**: Background modes (remote-notification, fetch), location usage descriptions
- **Xcode Project**: Native module files integration

### 📱 React Native Module Features
The plugin creates a complete React Native bridge with these methods:
- `hitEvent(event)` - Track custom events
- `hitTag(tag)` - Set user tags
- `hitTagWithValue(tag, value)` - Set user tags with values
- `setUser(user)` - Set user identifier
- `setExternalId(id)` - Set external user ID
- `openInbox()` - Open push notification inbox
- `requestNotificationPermissions()` - Request notification permissions

## Dependencies Added

### Android Dependencies
- `ie.imobile.extremepush:XtremePush_lib:9.3.11` - XtremePush SDK
- `com.google.firebase:firebase-messaging:24.0.3` - Firebase Messaging
- `com.squareup.okhttp3:okhttp:4.12.0` - HTTP client
- `com.squareup:otto:1.3.8` - Event bus
- `com.google.code.gson:gson:2.11.0` - JSON parsing
- `androidx.security:security-crypto:1.0.0` - Security utilities
- `androidx.work:work-runtime:2.9.1` - Background work

### iOS Dependencies
- `XPush` - XtremePush iOS SDK (from GitHub repository)

## File Structure After Plugin Execution

```
your-expo-app/
├── xtremepush.js                    # JavaScript module (auto-copied)
├── android/
│   └── app/
│       └── src/
│           └── main/
│               └── java/
│                   └── com/
│                       └── your/
│                           └── package/
│                               ├── RNXtremepushReactModule.java    # Auto-added
│                               └── RNXtremepushReactPackage.java   # Auto-added
└── ios/
    └── YourApp/
        ├── RNXtremepushReact.h      # Auto-integrated
        └── RNXtremepushReact.m      # Auto-integrated
```

## Requirements

- **Expo SDK**: 49 or higher
- **Android**: Target SDK 33 or higher
- **iOS**: Deployment target 12.0 or higher
- **React Native**: Compatible with latest versions

## Testing

Run the included test script to verify plugin functionality:

```bash
./test-plugin-e2e.sh
```

This will check:
- ✅ All supporting files exist
- ✅ Plugin syntax is valid
- ✅ Plugin exports correctly

## Troubleshooting

### Common Issues

1. **Package name mismatch**: The plugin automatically detects and updates package names in Android files
2. **Missing permissions**: All required permissions are automatically added based on your configuration
3. **Build errors**: Ensure you have the latest Expo SDK and compatible React Native version

### Debug Mode

Enable debug logs to troubleshoot integration issues:

```json
{
  "enableDebugLogs": true
}
```

## License

© Xtremepush Limited. All rights reserved.
