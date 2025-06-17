# XtremePush Expo Plugin

A config plugin for Expo applications that integrates XtremePush functionality into an Expo application. 
Currently Android - iOS is work in progress. 

## Features

- Automatically configures Android permissions for location services
- Integrates XtremePush SDK and required dependencies
- Sets up Google Firebase Messaging
- Configures MainApplication for push notifications
- Adds necessary imports to all Android activities

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
      ["@your-org/expo-plugin", {
        "applicationKey": "YOUR_XTREMEPUSH_APP_KEY",
        "googleSenderId": "YOUR_GOOGLE_SENDER_ID"
      }]
    ]
  }
}
```

### Configuration Options

- `applicationKey` (required): Your XtremePush application key
- `googleSenderId` (required): Your Google Firebase sender ID

## What This Plugin Does

1. **Android Permissions**: Adds necessary location permissions
2. **Build Configuration**: 
   - Adds XtremePush Maven repository
   - Configures Google Services plugin
   - Adds required dependencies
3. **Application Setup**:
   - Creates or modifies MainApplication.java
   - Initializes PushConnector with your credentials
   - Adds necessary imports to all activities

## Dependencies Added

- XtremePush SDK (9.3.11)
- Firebase Messaging (24.0.3)
- OkHttp (4.12.0)
- Otto (1.3.8)
- Gson (2.11.0)
- AndroidX Security Crypto (1.0.0)
- AndroidX Work Runtime (2.9.1)

## Requirements

- Expo SDK 49 or higher
- Android target SDK 33 or higher

## License
Xtremepush Limited 