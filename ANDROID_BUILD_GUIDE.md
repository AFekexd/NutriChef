# NutriChef Android Build and Deployment Guide

This guide provides instructions for building, testing, and deploying the NutriChef Android application to the Google Play Store.

## Prerequisites

### Required Software
1. **Node.js** (v16 or higher) - for building the web application
2. **Android Studio** - for building and testing the Android app
3. **JDK 11 or higher** - required by Android Studio
4. **Gradle** - included with Android Studio

### Android Studio Setup
1. Download and install [Android Studio](https://developer.android.com/studio)
2. During installation, ensure you install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (for testing)
3. Set up environment variables:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

## Project Structure

```
frontend/
├── android/                 # Native Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/
│   │   │   └── res/        # Android resources (icons, strings, etc.)
│   │   └── build.gradle    # App-level build configuration
│   ├── build.gradle        # Project-level build configuration
│   └── gradle.properties
├── capacitor.config.ts     # Capacitor configuration
├── dist/                   # Built web assets
└── src/                    # React source code
```

## Building the Android App

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Build the Web Application
```bash
npm run build
```
This creates production-ready web assets in the `dist/` directory.

### Step 3: Sync with Capacitor
```bash
npx cap sync android
```
This copies the web assets to the Android project and updates native plugins.

### Step 4: Open in Android Studio
```bash
npx cap open android
```
Or manually open the `frontend/android` directory in Android Studio.

### Step 5: Build in Android Studio
1. Wait for Gradle sync to complete
2. Select **Build > Make Project** (or press Ctrl+F9)
3. For a release build, select **Build > Generate Signed Bundle / APK**

## Testing the Application

### Local Testing with Android Emulator
1. In Android Studio, click **Device Manager**
2. Create a new virtual device or use an existing one
3. Click the **Run** button (green triangle) or press Shift+F10
4. The app will install and launch on the emulator

### Testing on Physical Device
1. Enable Developer Options on your Android device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
2. Enable USB Debugging in Developer Options
3. Connect device via USB
4. Accept the debugging prompt on your device
5. Click **Run** in Android Studio and select your device

### Live Reload for Development
For faster development iteration:
```bash
# Terminal 1: Start the development server
npm run dev

# Terminal 2: Sync and open in Android Studio
npx cap sync android
npx cap open android
```
Then configure the app to point to your development server by updating `capacitor.config.ts`:
```typescript
server: {
  url: 'http://YOUR_IP:5173',
  cleartext: true
}
```

## Preparing for Play Store Release

### 1. Update Version Information
Edit `frontend/android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 1      // Increment for each release
        versionName "1.0"  // User-visible version
    }
}
```

### 2. Configure Signing
Create a keystore for signing your app:
```bash
keytool -genkey -v -keystore nutrichef-release-key.keystore \
  -alias nutrichef -keyalg RSA -keysize 2048 -validity 10000
```

**Important:** Keep your keystore file and passwords secure! You'll need them for all future updates.

Create `frontend/android/app/keystore.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=nutrichef
storeFile=../nutrichef-release-key.keystore
```

**Add to .gitignore:**
```
keystore.properties
*.keystore
*.jks
```

Update `frontend/android/app/build.gradle` to use the keystore:
```gradle
def keystorePropertiesFile = rootProject.file("app/keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...
    
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Optimize for Production
In `capacitor.config.ts`, ensure production settings:
```typescript
server: {
  androidScheme: 'https',
  cleartext: false  // Disable for production
}
```

Update API base URL in your code to use production backend.

### 4. Generate Release Bundle
1. In Android Studio: **Build > Generate Signed Bundle / APK**
2. Select **Android App Bundle** (recommended) or **APK**
3. Choose your keystore and enter passwords
4. Select **release** build variant
5. Click **Finish**

The bundle will be created at:
`frontend/android/app/release/app-release.aab`

## Play Store Submission

### 1. Create a Play Store Account
- Go to [Google Play Console](https://play.google.com/console)
- Pay the one-time $25 registration fee
- Complete account setup

### 2. Create a New Application
1. Click **Create app**
2. Fill in app details:
   - **App name:** NutriChef
   - **Default language:** English (US)
   - **App or game:** App
   - **Free or paid:** Choose based on your monetization strategy

### 3. Prepare Store Listing

#### App Information
- **App name:** NutriChef
- **Short description:** AI-powered meal planning and nutrition management
- **Full description:** (Detailed description of features)
- **App category:** Food & Drink
- **Contact email:** Your support email
- **Privacy policy:** URL to your privacy policy (required)

#### Graphics Assets Required
- **App icon:** 512 x 512 PNG (high-res)
- **Feature graphic:** 1024 x 500 PNG
- **Phone screenshots:** At least 2, up to 8 (min 320px, max 3840px)
- **7-inch tablet screenshots:** At least 2 (optional but recommended)
- **10-inch tablet screenshots:** At least 2 (optional but recommended)

#### Content Rating
Complete the content rating questionnaire to receive a rating.

### 4. Configure App Content
1. **Privacy policy:** Provide URL
2. **Ads:** Declare if your app contains ads
3. **Target audience:** Specify age groups
4. **News app:** Select "No" unless applicable
5. **Data safety:** Complete data safety form (what data you collect)

### 5. Set Up App Access
- If your app requires login, provide test credentials
- Document any special access requirements

### 6. Upload the App Bundle
1. Go to **Production > Create new release**
2. Upload the `.aab` file
3. Add release notes describing what's new
4. Review and roll out

### 7. Complete Pre-Launch Report
Google will automatically test your app on various devices. Review the report and fix any critical issues.

### 8. Submit for Review
1. Complete all required sections in the Play Console
2. Review the "Publishing overview" checklist
3. Click **Send for review**

**Review time:** Typically 1-7 days

## Updating the App

### For New Releases
1. Increment `versionCode` and update `versionName` in `build.gradle`
2. Build the web app: `npm run build`
3. Sync with Android: `npx cap sync android`
4. Generate new signed bundle
5. Upload to Play Console with release notes
6. Roll out the update (staged rollout recommended)

## Troubleshooting

### Common Issues

#### Build Fails with Gradle Errors
```bash
cd frontend/android
./gradlew clean
./gradlew build --refresh-dependencies
```

#### App Crashes on Launch
- Check `logcat` in Android Studio for error messages
- Verify all required permissions are in AndroidManifest.xml
- Ensure API URLs are correct for production

#### Plugins Not Working
```bash
cd frontend
npm install
npx cap sync android
```

#### White Screen on Launch
- Verify the build completed successfully
- Check browser console in Chrome DevTools (chrome://inspect)
- Ensure all assets are bundled correctly

### Useful Commands
```bash
# Clean build
cd frontend/android && ./gradlew clean

# Build APK directly (for testing)
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# View connected devices
adb devices

# Install APK manually
adb install -r app/build/outputs/apk/release/app-release.apk

# View app logs
adb logcat | grep -i "nutrichef"
```

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Bundle Publishing](https://developer.android.com/guide/app-bundle)

## Support

For issues related to:
- **App functionality:** Create an issue in the GitHub repository
- **Play Store policies:** Contact Google Play Support
- **Build issues:** Check Android Studio logs and Capacitor documentation

## Security Checklist

Before releasing:
- [ ] No hardcoded API keys or secrets in the code
- [ ] HTTPS enforced for all API calls
- [ ] Privacy policy URL provided
- [ ] Data safety form completed accurately
- [ ] Test credentials provided (if app requires login)
- [ ] ProGuard/R8 enabled for code obfuscation
- [ ] All required permissions declared and justified
- [ ] SSL certificate pinning implemented (recommended)

## Performance Optimization

- [ ] Enable R8/ProGuard for code shrinking
- [ ] Optimize images and assets
- [ ] Implement code splitting for large apps
- [ ] Use Android App Bundle for dynamic delivery
- [ ] Test on low-end devices (Android Go)
- [ ] Monitor app size (keep under 150MB if possible)

---

**Last Updated:** October 2025  
**Capacitor Version:** 7.x  
**Target Android SDK:** 33+ (Android 13+)  
**Minimum Android SDK:** 22 (Android 5.1+)
