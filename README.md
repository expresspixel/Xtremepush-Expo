# XtremePush Expo Plugin

A config plugin for Expo applications that integrates XtremePush functionality into an Expo application. 
iOS and Android now available.

## Features

- Automatically configures Android permissions for location services
- Integrates XtremePush SDK and required dependencies
- Sets up Google Firebase Messaging
- Configures MainApplication for push notifications
- Adds necessary imports to all Android activities
- Supports both iOS and Android platforms
- Configurable debug logging and permissions

## Installation

```bash
npm install @xtremepush/expo-plugin
```

This will be ultimately completed as part of publishing to NPM. 

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
        "enableDebugLogs": true, // default true
        "enableLocationServices": true, // default true
        "enablePushPermissions": true // default true
      }]
    ]
  }
}
```

### Configuration Options

#### Required Parameters
- `googleSenderId` (string): Your Google Cloud Messaging Sender ID

#### Application Keys (at least one required)
- `applicationKey` (string): XtremePush Application Key (used for both platforms if platform-specific keys not provided)
- `iosAppKey` (string): iOS-specific XtremePush Application Key (overrides applicationKey for iOS)
- `androidAppKey` (string): Android-specific XtremePush Application Key (overrides applicationKey for Android)

#### Optional Parameters
- `enableDebugLogs` (boolean): Enable debug logging for development. **Default: `true`**
- `enableLocationServices` (boolean): Enable location services and permissions. **Default: `true`**
- `enablePushPermissions` (boolean): Automatically request push notification permissions. **Default: `true`**

### Configuration Flags Explained

The following configuration flags are now available and can be added to your `app.json` file:

- **`applicationKey`**: A general application key that will be used for both iOS and Android platforms. If you provide platform-specific keys (`iosAppKey` or `androidAppKey`), they will override this general key for their respective platforms.

- **`iosAppKey`**: iOS-specific XtremePush application key. If provided, this will override the `applicationKey` for iOS platform.

- **`androidAppKey`**: Android-specific XtremePush application key. If provided, this will override the `applicationKey` for Android platform.

- **`googleSenderId`**: Your Google Cloud Messaging Sender ID required for Firebase push notifications.

- **`enableDebugLogs`**: When set to `true`, enables detailed logging for debugging purposes. This is useful during development to track XtremePush SDK behavior and troubleshoot issues. Debug logs are automatically enabled in debug builds.

- **`enableLocationServices`**: When set to `true`, enables location services and adds necessary location permissions including `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, and `ACCESS_BACKGROUND_LOCATION`.

- **`enablePushPermissions`**: When set to `true`, the plugin will automatically request push notification permissions from users and add the `POST_NOTIFICATIONS` permission for Android.

## What This Plugin Does

1. **Android Configuration**:
   - Adds necessary permissions (Internet, Network State, Wake Lock, Vibrate, Boot Completed)
   - Configures XtremePush Maven repository
   - Adds Google Services plugin
   - Integrates required dependencies (XtremePush SDK, Firebase Messaging, OkHttp, etc.)
   - Creates or modifies MainApplication.java/kt with PushConnector initialization
   - Adds imports to all Android activities

2. **iOS Configuration**:
   - Adds XtremePush iOS SDK to Podfile
   - Configures AppDelegate (Swift/Objective-C) with XPush initialization
   - Adds required background modes (remote-notification, fetch) to Info.plist

## Dependencies Added

### Android Dependencies
- XtremePush SDK (9.3.11)
- Firebase Messaging (24.0.3)
- OkHttp (4.12.0)
- Otto (1.3.8)
- Gson (2.11.0)
- AndroidX Security Crypto (1.0.0)
- AndroidX Work Runtime (2.9.1)

### iOS Dependencies
- XPush SDK (from GitHub repository)

## Requirements

- Expo SDK 49 or higher
- Android target SDK 33 or higher
- iOS deployment target 12.0 or higher

## License
Xtremepush Limited 