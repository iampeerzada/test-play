# Building a Native Android App with Capacitor

This guide will walk you through compiling this web application into a native Android application using Ionic Capacitor. Since you already have Android Studio installed, you are perfectly equipped for this!

## Prerequisites (On Your Computer)

1. **Node.js**: Ensure you have Node.js installed on your computer.
2. **Android Studio**: Installed and configured with the Android SDK.
3. **Export this project**: Download this project from AI Studio (using the settings menu -> Export to ZIP) and extract it to a folder on your computer.

## Step 1: Open the Project Locally

1. Open a terminal (or command prompt) and navigate into the extracted project folder:
   ```bash
   cd path/to/your/extracted/project
   ```
2. Install the project dependencies:
   ```bash
   npm install
   ```

## Step 2: Build the Web App

Before packaging the Android app, you need to build the production version of the frontend web app.

```bash
npm run build
```
This will compile everything into a `dist` folder.

## Step 3: Add Android Platform

Now, create the Android project folder using Capacitor (Capacitor is already set up in `package.json` for you):

```bash
npx cap add android
```
*(If you make changes to your web code later, you run `npm run build` followed by `npx cap sync` to update the Android app).*

## Step 4: Configure Cleartext (HTTP) Traffic for Live TV Streams

Since many IPTV streams use `http://` instead of `https://`, Android will block them by default due to strict security policies. We need to allow "Cleartext Traffic".

1. Open your project in a code editor (like VS Code).
2. Go to `android/app/src/main/AndroidManifest.xml`.
3. Inside the `<application ...>` tag, add `android:usesCleartextTraffic="true"`:

```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="true"> <!-- ADD THIS LINE HERE -->
```

## Step 5: Open in Android Studio

Open the Android project in Android Studio directly from your terminal:

```bash
npx cap open android
```

*(Alternatively: Launch Android Studio, click **"Open"**, and select the `android` folder located inside your project directory).*

## Step 6: Build and Run the APK

1. Wait for Android Studio to finish "Syncing Gradle" (watch the loading bar at the bottom right). This might take a few minutes the first time.
2. Connect your Android phone to your computer via USB (Ensure "Developer Options" and "USB Debugging" are enabled on your phone) or set up a virtual Android Emulator in Android Studio.
3. Select your device from the dropdown menu at the top.
4. Click the **Run** button (the green play triangle) in the top toolbar of Android Studio.

Your app will compile, install, and launch natively on your device!

---

### Note on Native Playback
We have updated the code so that if the app detects it is running as a native Android app, it will **bypass the web proxy** for Live TV and play the `http://...m3u8` links directly, exactly like a native IPTV player. Web browsers block mixed content, but your native Android app will not!
