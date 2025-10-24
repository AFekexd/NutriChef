# NutriChef Android App

This directory contains the native Android project for NutriChef, built using Capacitor to wrap the React web application.

## Overview

NutriChef for Android is built using:
- **Capacitor 7.x** - Native runtime for web apps
- **React + Vite** - Frontend framework
- **Android SDK 33+** - Target platform
- **Minimum Android 5.1** (API 22) - Backward compatibility

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Android Studio
- JDK 11+

### Build and Run

1. **Install dependencies** (from frontend directory):
   ```bash
   npm install
   ```

2. **Build the web app**:
   ```bash
   npm run build
   ```

3. **Sync with Capacitor**:
   ```bash
   npx cap sync android
   ```

4. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

5. **Run the app** using Android Studio's Run button or:
   ```bash
   cd android
   ./gradlew installDebug
   ```

## Project Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml        # App manifest and permissions
│   │   ├── java/com/nutrichef/app/    # Java/Kotlin source files
│   │   │   └── MainActivity.java      # Main activity
│   │   ├── res/                       # Android resources
│   │   │   ├── drawable/              # Icons and images
│   │   │   ├── layout/                # Layout files
│   │   │   ├── mipmap-*/              # App icons (various densities)
│   │   │   └── values/                # Strings, colors, styles
│   │   └── assets/public/             # Web app assets (auto-synced)
│   ├── build.gradle                   # App-level Gradle config
│   └── proguard-rules.pro            # ProGuard configuration
├── build.gradle                       # Project-level Gradle config
├── gradle.properties                  # Gradle properties
├── gradlew                           # Gradle wrapper (Unix)
├── gradlew.bat                       # Gradle wrapper (Windows)
└── settings.gradle                   # Project settings
```

## Key Files

### AndroidManifest.xml
Defines app permissions and components. Current permissions:
- `INTERNET` - Required for API calls
- `CAMERA` - For photo-based ingredient detection
- `READ_MEDIA_IMAGES` - Access user photos for upload
- `WRITE_EXTERNAL_STORAGE` - Save photos (Android 9 and below)

### MainActivity.java
The main entry point for the Android app. Extends Capacitor's `BridgeActivity`.

### build.gradle
Android build configuration including:
- Application ID: `com.nutrichef.app`
- Minimum SDK: 22 (Android 5.1)
- Target SDK: 33 (Android 13)
- Version code and version name

## Capacitor Configuration

Configuration is defined in `../capacitor.config.ts`:
- App ID: `com.nutrichef.app`
- App name: `NutriChef`
- Web directory: `dist`
- Server settings for API communication
- Plugin configurations (splash screen, camera, etc.)

## Installed Capacitor Plugins

- **@capacitor/core** - Core Capacitor functionality
- **@capacitor/android** - Android platform
- **@capacitor/camera** - Native camera access
- **@capacitor/filesystem** - File system operations
- **@capacitor/splash-screen** - Splash screen control

## Development Workflow

### Making Changes to Web Code

1. Edit React components in `../src/`
2. Build the web app: `npm run build`
3. Sync changes: `npx cap sync android`
4. Refresh the app in Android Studio or on device

### Making Changes to Native Code

1. Open the project in Android Studio
2. Edit Android-specific files in `app/src/main/`
3. Build and run from Android Studio

### Live Reload (Development)

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Update `capacitor.config.ts` with your local IP:
   ```typescript
   server: {
     url: 'http://YOUR_IP:5173',
     cleartext: true
   }
   ```

3. Sync and run:
   ```bash
   npx cap sync android
   npx cap open android
   ```

## Building for Release

### 1. Update Version
Edit `app/build.gradle`:
```gradle
versionCode 1      // Increment for each release
versionName "1.0"  // User-visible version
```

### 2. Configure Signing
See [ANDROID_BUILD_GUIDE.md](../ANDROID_BUILD_GUIDE.md#2-configure-signing) for detailed signing setup.

### 3. Build Release Bundle
In Android Studio:
1. **Build > Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Choose your keystore
4. Select **release** build variant

Or via command line:
```bash
./gradlew bundleRelease
```

Output: `app/release/app-release.aab`

## Testing

### Unit Tests
```bash
./gradlew test
```

### Instrumented Tests
```bash
./gradlew connectedAndroidTest
```

### Manual Testing Checklist
- [ ] App launches successfully
- [ ] Login/Register flows work
- [ ] Photo upload and AI detection functional
- [ ] Recipe recommendations display correctly
- [ ] Meal planning features work
- [ ] Navigation (bottom and top) works smoothly
- [ ] Dark mode switches correctly
- [ ] Language switching works
- [ ] Notifications appear as expected
- [ ] App handles network errors gracefully
- [ ] App works offline (where applicable)

## Troubleshooting

### Sync Issues
```bash
# Clean and rebuild
./gradlew clean
npx cap sync android
```

### Build Errors
```bash
# Refresh dependencies
./gradlew build --refresh-dependencies
```

### App Crashes
1. Check Logcat in Android Studio
2. Filter by "nutrichef" or "Capacitor"
3. Look for error stack traces

### White Screen on Launch
- Ensure `npm run build` completed successfully
- Verify assets are in `app/src/main/assets/public/`
- Check Chrome DevTools: `chrome://inspect`

## Performance Tips

1. **Enable ProGuard/R8** for release builds
2. **Optimize images** before building
3. **Use Android App Bundle** for optimal size
4. **Test on low-end devices** to ensure smooth performance
5. **Monitor memory usage** in Android Profiler

## Common Commands

```bash
# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Install debug APK to device
./gradlew installDebug

# View connected devices
adb devices

# View logs
adb logcat | grep -i capacitor

# Uninstall app
adb uninstall com.nutrichef.app

# Clear app data
adb shell pm clear com.nutrichef.app
```

## Resources

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android Developer Guide](https://developer.android.com/guide)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Android Studio User Guide](https://developer.android.com/studio/intro)

## Support

For issues related to:
- **Capacitor:** [Capacitor GitHub Issues](https://github.com/ionic-team/capacitor/issues)
- **Android Build:** Check Android Studio logs and documentation
- **App Features:** Create an issue in the main repository

## License

[Your License Information]

---

**Last Updated:** October 2025  
**Capacitor Version:** 7.x  
**Android SDK:** 33  
**Minimum Android:** 5.1 (API 22)
