const {
    // Android imports
    withAndroidManifest,
    withProjectBuildGradle,
    withAppBuildGradle,
    withMainApplication,
    withDangerousMod,
    // iOS imports
    withAppDelegate,
    withXcodeProject,
    withInfoPlist
} = require('@expo/config-plugins');

const fs = require('fs');
const path = require('path');

/**
 * XtremePush Expo Config Plugin
 * 
 * @param {object} config - Expo config
 * @param {object} pluginConfig - Plugin configuration options
 * @param {string} pluginConfig.applicationKey - XtremePush Application Key (used for both platforms if platform-specific keys not provided)
 * @param {string} pluginConfig.iosAppKey - iOS-specific XtremePush Application Key (overrides applicationKey for iOS)
 * @param {string} pluginConfig.androidAppKey - Android-specific XtremePush Application Key (overrides applicationKey for Android)
 * @param {string} pluginConfig.googleSenderId - Google Cloud Messaging Sender ID
 * @param {boolean} pluginConfig.enableDebugLogs - Enable debug logging (default: true in debug builds)
 * @param {boolean} pluginConfig.enableLocationServices - Enable location permissions (default: true)
 * @param {boolean} pluginConfig.enablePushPermissions - Enable push notification permissions (default: true)
 * @returns {object} Modified Expo config
 */
const withXPExpoPlugin = (config, pluginConfig) => {
    console.log('🔧 Xtremepush Expo Plugin running for both platforms...');

    // Validate and set default options
    const options = pluginConfig || {};
    const {
        applicationKey = 'DEFAULT_APP_KEY',
        iosAppKey,
        androidAppKey,
        googleSenderId = 'DEFAULT_SENDER_ID',
        enableDebugLogs = true,
        enableLocationServices = true,
        enablePushPermissions = true
    } = options;

    // Determine platform-specific keys
    const iosApplicationKey = iosAppKey || applicationKey;
    const androidApplicationKey = androidAppKey || applicationKey;

    // Validate required parameters
    if (iosApplicationKey === 'DEFAULT_APP_KEY') {
        console.warn('⚠️  WARNING: Using default iOS application key. Please provide your XtremePush iOS application key.');
    }
    if (androidApplicationKey === 'DEFAULT_APP_KEY') {
        console.warn('⚠️  WARNING: Using default Android application key. Please provide your XtremePush Android application key.');
    }
    if (googleSenderId === 'DEFAULT_SENDER_ID') {
        console.warn('⚠️  WARNING: Using default Google Sender ID. Please provide your Google Cloud Messaging Sender ID.');
    }

    console.log(`📱 iOS App Key: ${iosApplicationKey}`);
    console.log(`🤖 Android App Key: ${androidApplicationKey}`);
    console.log(`🔔 Push Permissions: ${enablePushPermissions ? 'enabled' : 'disabled'}`);

    // ========================================
    // COPY SUPPORTING FILES
    // ========================================

    // Copy xtremepush.js to app root
    config = withDangerousMod(config, [
        'root',
        async (config) => {
            console.log('📄 Copying xtremepush.js to app root...');
            await copyXtremepushJS(config.modRequest.projectRoot);
            return config;
        },
    ]);

    // ========================================
    // ANDROID CONFIGURATION
    // ========================================

    // Android Manifest - Permissions and Application Configuration
    config = withAndroidManifest(config, (config) => {
        console.log('📱 Configuring Android Manifest...');

        const permissions = [
            'android.permission.INTERNET',
            'android.permission.ACCESS_NETWORK_STATE',
            'android.permission.WAKE_LOCK',
            'android.permission.VIBRATE',
            'android.permission.RECEIVE_BOOT_COMPLETED'
        ];

        // Add push notification permissions if enabled
        if (enablePushPermissions) {
            permissions.push('android.permission.POST_NOTIFICATIONS');
        }

        // Add location permissions if enabled
        if (enableLocationServices) {
            permissions.push(
                'android.permission.ACCESS_COARSE_LOCATION',
                'android.permission.ACCESS_FINE_LOCATION',
                'android.permission.ACCESS_BACKGROUND_LOCATION'
            );
        }

        // Add permissions
        permissions.forEach(permission => {
            if (!config.modResults.manifest['uses-permission']?.find(p => p.$['android:name'] === permission)) {
                config.modResults.manifest['uses-permission'] = config.modResults.manifest['uses-permission'] || [];
                config.modResults.manifest['uses-permission'].push({
                    $: { 'android:name': permission }
                });
            }
        });

        // Configure application element
        if (config.modResults.manifest.application && config.modResults.manifest.application[0]) {
            const packageName = config.android?.package || 'com.anonymous.testapp';
            config.modResults.manifest.application[0].$['android:name'] = `.MainApplication`;
            console.log('✅ Set android:name to MainApplication');
        }

        return config;
    });

    // Project-level build.gradle
    config = withProjectBuildGradle(config, (config) => {
        console.log('📦 Configuring project-level build.gradle...');
        config.modResults.contents = addMavenRepository(config.modResults.contents);
        config.modResults.contents = addGoogleServicesPluginToProject(config.modResults.contents);
        return config;
    });

    // App-level build.gradle
    config = withAppBuildGradle(config, (config) => {
        console.log('📚 Configuring app-level build.gradle...');
        config.modResults.contents = addDependencies(config.modResults.contents);
        config.modResults.contents = addGoogleServicesPluginToApp(config.modResults.contents);
        return config;
    });

    // MainApplication.java/kt
    config = withMainApplication(config, (config) => {
        console.log('🔨 Configuring MainApplication...');

        if (!config.modResults.contents || config.modResults.contents.trim() === '') {
            console.log('Creating new MainApplication file...');
            config.modResults.contents = createMainApplicationFile(config, androidApplicationKey, googleSenderId, enableDebugLogs, enablePushPermissions);
        } else {
            console.log('Modifying existing MainApplication...');
            config.modResults.contents = addPushConnectorToMainApplication(
                config.modResults.contents,
                androidApplicationKey,
                googleSenderId,
                enableDebugLogs,
                enablePushPermissions
            );
        }

        return config;
    });

    // Add supporting Android files
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            console.log('📁 Adding Android supporting files...');
            await addAndroidSupportingFiles(config.modRequest.projectRoot, config.android?.package);
            return config;
        },
    ]);

    // Add imports to activities
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            console.log('🎯 Adding imports to Android activities...');
            await addImportsToAllActivities(config.modRequest.projectRoot);
            return config;
        },
    ]);

    // ========================================
    // iOS CONFIGURATION
    // ========================================

    // iOS Podfile
    config = withDangerousMod(config, [
        'ios',
        async (config) => {
            console.log('📦 Configuring iOS Podfile...');
            const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
            if (fs.existsSync(podfilePath)) {
                let podfileContents = fs.readFileSync(podfilePath, 'utf8');
                podfileContents = addIOSDependencies(podfileContents);
                fs.writeFileSync(podfilePath, podfileContents, 'utf8');
                console.log('✅ Updated iOS Podfile');
            } else {
                console.warn('⚠️  iOS Podfile not found');
            }
            return config;
        },
    ]);

    // iOS AppDelegate
    config = withAppDelegate(config, (config) => {
        console.log('🔨 Configuring iOS AppDelegate...');
        config.modResults.contents = addIOSInitialization(
            config.modResults.contents,
            iosApplicationKey,
            enableDebugLogs,
            enablePushPermissions
        );
        return config;
    });

    // Add supporting iOS files to Xcode project
    config = withDangerousMod(config, [
        'ios',
        async (config) => {
            console.log('📁 Adding iOS supporting files to Xcode project...');
            await addIOSSupportingFiles(config.modRequest.projectRoot);
            return config;
        },
    ]);

    // Try to add files to Xcode project if possible
    config = withXcodeProject(config, (config) => {
        try {
            console.log('🔗 Attempting to link iOS files to Xcode project...');
            const iosProjectPath = path.join(config.modRequest.projectRoot, 'ios');

            // Add RNXtremepushReact.h if it exists
            const headerPath = path.join(iosProjectPath, 'RNXtremepushReact.h');
            if (fs.existsSync(headerPath)) {
                config.modResults.addSourceFile('RNXtremepushReact.h', {
                    target: config.modResults.getFirstTarget().uuid
                });
                console.log('✅ Linked RNXtremepushReact.h to Xcode project');
            }

            // Add RNXtremepushReact.m if it exists
            const implementationPath = path.join(iosProjectPath, 'RNXtremepushReact.m');
            if (fs.existsSync(implementationPath)) {
                config.modResults.addSourceFile('RNXtremepushReact.m', {
                    target: config.modResults.getFirstTarget().uuid
                });
                console.log('✅ Linked RNXtremepushReact.m to Xcode project');
            }
        } catch (error) {
            console.warn('⚠️  Could not link files to Xcode project (this is normal for managed workflow):', error.message);
        }
        return config;
    });

    // iOS Info.plist - Add required background modes
    config = withInfoPlist(config, (config) => {
        console.log('📝 Configuring iOS Info.plist...');

        // Add background modes
        if (!config.modResults.UIBackgroundModes) {
            config.modResults.UIBackgroundModes = [];
        }

        const requiredModes = ['remote-notification', 'fetch'];
        requiredModes.forEach(mode => {
            if (!config.modResults.UIBackgroundModes.includes(mode)) {
                config.modResults.UIBackgroundModes.push(mode);
            }
        });

        // Add location usage descriptions if enabled
        if (enableLocationServices) {
            config.modResults.NSLocationWhenInUseUsageDescription =
                config.modResults.NSLocationWhenInUseUsageDescription ||
                'This app needs access to location when open to provide location-based notifications.';

            config.modResults.NSLocationAlwaysAndWhenInUseUsageDescription =
                config.modResults.NSLocationAlwaysAndWhenInUseUsageDescription ||
                'This app needs access to location to provide location-based notifications.';
        }

        return config;
    });

    console.log('✅ XtremePush Expo Plugin configuration complete!');
    return config;
};

// ========================================
// FILE COPYING FUNCTIONS
// ========================================

async function copyXtremepushJS(projectRoot) {
    const sourcePath = path.join(__dirname, 'xtremepush.js');
    const destPath = path.join(projectRoot, 'xtremepush.js');

    try {
        if (fs.existsSync(destPath)) {
            console.log('✓ xtremepush.js already exists in app root');
            return;
        }

        fs.copyFileSync(sourcePath, destPath);
        console.log('✅ Copied xtremepush.js to app root');
    } catch (error) {
        console.error('❌ Error copying xtremepush.js:', error);
    }
}

async function addAndroidSupportingFiles(projectRoot, packageName) {
    const androidSrcPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java');

    if (!fs.existsSync(androidSrcPath)) {
        console.warn('⚠️  Android source directory not found');
        return;
    }

    // Find the correct package directory
    let packageDir = null;
    if (packageName) {
        const packagePath = path.join(androidSrcPath, ...packageName.split('.'));
        if (fs.existsSync(packagePath)) {
            packageDir = packagePath;
        }
    }

    // If package directory not found, look for existing directories
    if (!packageDir) {
        const files = fs.readdirSync(androidSrcPath);
        for (const file of files) {
            const filePath = path.join(androidSrcPath, file);
            if (fs.statSync(filePath).isDirectory()) {
                packageDir = filePath;
                break;
            }
        }
    }

    if (!packageDir) {
        console.warn('⚠️  Could not find Android package directory');
        return;
    }

    console.log(`📁 Using Android package directory: ${packageDir}`);

    // Copy RNXtremepushReactModule.java
    const moduleSource = path.join(__dirname, 'supporting-files', 'android', 'RNXtremepushReactModule.java');
    const moduleDest = path.join(packageDir, 'RNXtremepushReactModule.java');

    try {
        let moduleContent = fs.readFileSync(moduleSource, 'utf8');

        // Update package name
        const currentPackage = moduleContent.match(/package\s+([^;]+);/)?.[1];
        if (currentPackage && packageName) {
            moduleContent = moduleContent.replace(
                /package\s+[^;]+;/,
                `package ${packageName};`
            );
            console.log(`✅ Updated package name from ${currentPackage} to ${packageName}`);
        }

        fs.writeFileSync(moduleDest, moduleContent, 'utf8');
        console.log('✅ Added RNXtremepushReactModule.java');
    } catch (error) {
        console.error('❌ Error adding RNXtremepushReactModule.java:', error);
    }

    // Copy RNXtremepushReactPackage.java
    const packageSource = path.join(__dirname, 'supporting-files', 'android', 'RNXtremepushReactPackage.java');
    const packageDest = path.join(packageDir, 'RNXtremepushReactPackage.java');

    try {
        let packageContent = fs.readFileSync(packageSource, 'utf8');

        // Update package name
        const currentPackage = packageContent.match(/package\s+([^;]+)/)?.[1];
        if (currentPackage && packageName) {
            packageContent = packageContent.replace(
                /package\s+[^;]+/,
                `package ${packageName}`
            );
            console.log(`✅ Updated package name from ${currentPackage} to ${packageName}`);
        }

        fs.writeFileSync(packageDest, packageContent, 'utf8');
        console.log('✅ Added RNXtremepushReactPackage.java');
    } catch (error) {
        console.error('❌ Error adding RNXtremepushReactPackage.java:', error);
    }
}

async function addIOSSupportingFiles(projectRoot) {
    const iosPath = path.join(__dirname, 'supporting-files', 'ios');
    const iosProjectPath = path.join(projectRoot, 'ios');

    try {
        // Create ios directory if it doesn't exist
        if (!fs.existsSync(iosProjectPath)) {
            fs.mkdirSync(iosProjectPath, { recursive: true });
        }

        // Add RNXtremepushReact.h
        const headerSourcePath = path.join(iosPath, 'RNXtremepushReact.h');
        const headerDestPath = path.join(iosProjectPath, 'RNXtremepushReact.h');

        if (fs.existsSync(headerSourcePath)) {
            // Copy file to iOS project directory
            fs.copyFileSync(headerSourcePath, headerDestPath);
            console.log('✅ Added RNXtremepushReact.h to iOS project');
        } else {
            console.warn('⚠️  RNXtremepushReact.h not found in supporting files');
        }

        // Add RNXtremepushReact.m
        const implementationSourcePath = path.join(iosPath, 'RNXtremepushReact.m');
        const implementationDestPath = path.join(iosProjectPath, 'RNXtremepushReact.m');

        if (fs.existsSync(implementationSourcePath)) {
            // Copy file to iOS project directory
            fs.copyFileSync(implementationSourcePath, implementationDestPath);
            console.log('✅ Added RNXtremepushReact.m to iOS project');
        } else {
            console.warn('⚠️  RNXtremepushReact.m not found in supporting files');
        }
    } catch (error) {
        console.error('❌ Error adding iOS supporting files:', error);
        console.error('Error details:', error.message);
    }
}

// ========================================
// ANDROID HELPER FUNCTIONS
// ========================================

function addMavenRepository(buildGradleContents) {
    const mavenUrl = 'https://maven.xtremepush.com/artifactory/libs-release-local/';
    const mavenRepo = `        maven { url '${mavenUrl}' }`;

    if (buildGradleContents.includes(mavenUrl)) {
        console.log('✅ Maven Repository already exists.');
        return buildGradleContents;
    }

    const allProjectsRegex = /(allprojects\s*{\s*repositories\s*{[^}]*)(})/;

    if (allProjectsRegex.test(buildGradleContents)) {
        console.log('✅ Added XtremePush Maven Repository');
        return buildGradleContents.replace(
            allProjectsRegex,
            `$1${mavenRepo}\n    $2`
        );
    } else {
        console.warn('⚠️  Could not find allprojects repositories block');
        return buildGradleContents;
    }
}

function addDependencies(buildGradleContents) {
    const dependencies = [
        'ie.imobile.extremepush:XtremePush_lib:9.3.11',
        'com.google.firebase:firebase-messaging:24.0.3',
        'com.squareup.okhttp3:okhttp:4.12.0',
        'com.squareup:otto:1.3.8',
        'com.google.code.gson:gson:2.11.0',
        'androidx.security:security-crypto:1.0.0',
        'androidx.work:work-runtime:2.9.1'
    ];

    let modifiedContents = buildGradleContents;

    dependencies.forEach(dependency => {
        const implementationLine = `    implementation '${dependency}'`;

        if (modifiedContents.includes(dependency)) {
            console.log(`✓ Dependency ${dependency} already exists`);
            return;
        }

        const dependenciesMatch = modifiedContents.match(/dependencies\s*\{/);

        if (dependenciesMatch) {
            const startIndex = dependenciesMatch.index + dependenciesMatch[0].length;

            let braceCount = 1;
            let endIndex = startIndex;

            while (endIndex < modifiedContents.length && braceCount > 0) {
                if (modifiedContents[endIndex] === '{') braceCount++;
                if (modifiedContents[endIndex] === '}') braceCount--;
                endIndex++;
            }

            const beforeClosing = modifiedContents.substring(0, endIndex - 1);
            const afterClosing = modifiedContents.substring(endIndex - 1);

            modifiedContents = beforeClosing + `\n${implementationLine}` + afterClosing;
            console.log(`✅ Added dependency: ${dependency}`);
        }
    });

    return modifiedContents;
}

function addGoogleServicesPluginToProject(buildGradleContents) {
    const googleServicesPlugin = `        classpath 'com.google.gms:google-services:4.4.2'`;

    if (buildGradleContents.includes('com.google.gms:google-services')) {
        console.log('✓ Google Services plugin already exists in project build.gradle');
        return buildGradleContents;
    }

    const buildscriptDepsMatch = buildGradleContents.match(/buildscript\s*{[\s\S]*?dependencies\s*\{/);

    if (buildscriptDepsMatch) {
        const startIndex = buildscriptDepsMatch.index + buildscriptDepsMatch[0].length;

        let braceCount = 1;
        let endIndex = startIndex;

        while (endIndex < buildGradleContents.length && braceCount > 0) {
            if (buildGradleContents[endIndex] === '{') braceCount++;
            if (buildGradleContents[endIndex] === '}') braceCount--;
            endIndex++;
        }

        const beforeClosing = buildGradleContents.substring(0, endIndex - 1);
        const afterClosing = buildGradleContents.substring(endIndex - 1);

        console.log('✅ Added Google Services plugin to project build.gradle');
        return beforeClosing + `\n${googleServicesPlugin}` + afterClosing;
    } else {
        console.warn('⚠️  Could not find buildscript dependencies block');
        return buildGradleContents;
    }
}

function addGoogleServicesPluginToApp(buildGradleContents) {
    const googleServicesPlugin = `apply plugin: 'com.google.gms.google-services'`;

    if (buildGradleContents.includes('com.google.gms.google-services')) {
        console.log('✓ Google Services plugin already exists in app build.gradle');
        return buildGradleContents;
    }

    const applyPluginRegex = /(apply plugin:.*\n)+/;

    if (applyPluginRegex.test(buildGradleContents)) {
        buildGradleContents = buildGradleContents.replace(
            applyPluginRegex,
            `$&${googleServicesPlugin}\n`
        );
        console.log('✅ Added Google Services plugin to app build.gradle');
        return buildGradleContents;
    } else {
        console.warn('⚠️  Could not find apply plugin section');
        return buildGradleContents;
    }
}

async function addImportsToAllActivities(projectRoot) {
    const androidSrcPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java');

    if (!fs.existsSync(androidSrcPath)) {
        console.warn('⚠️  Android source directory not found');
        return;
    }

    try {
        await findAndModifyActivities(androidSrcPath);
    } catch (error) {
        console.error('❌ Error adding imports to activities:', error);
    }
}

async function findAndModifyActivities(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            await findAndModifyActivities(filePath);
        } else if (file.endsWith('Activity.java')) {
            console.log(`Processing activity: ${file}`);
            addImportToActivity(filePath);
        }
    }
}

function addImportToActivity(activityFilePath) {
    const importStatement = 'import static ie.imobile.extremepush.PushConnector.mPushConnector;';

    try {
        let content = fs.readFileSync(activityFilePath, 'utf8');

        if (content.includes(importStatement)) {
            console.log(`✓ Import already exists in ${path.basename(activityFilePath)}`);
            return;
        }

        const importRegex = /(import\s+[^;]+;\s*)+/;

        if (importRegex.test(content)) {
            content = content.replace(
                importRegex,
                `$&${importStatement}\n`
            );

            fs.writeFileSync(activityFilePath, content, 'utf8');
            console.log(`✅ Added import to ${path.basename(activityFilePath)}`);
        } else {
            console.warn(`⚠️  Could not find import section in ${path.basename(activityFilePath)}`);
        }
    } catch (error) {
        console.error(`❌ Error modifying ${activityFilePath}:`, error);
    }
}

function createMainApplicationFile(config, applicationKey, googleSenderId, enableDebugLogs, enablePushPermissions) {
    const packageName = config.android?.package || 'com.anonymous.testapp';

    return `package ${packageName};

import android.app.Application;
import android.util.Log;
import ie.imobile.extremepush.PushConnector;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          // Add XtremePush ReactPackage
          packages.add(new RNXtremepushReactPackage());
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
          return BuildConfig.IS_HERMES_ENABLED;
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      DefaultNewArchitectureEntryPoint.load();
    }
    ReactNativeFlipper.initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    
    initializeXtremePush();
  }
  
  private void initializeXtremePush() {
    Log.d("MainApplication", "Initializing XtremePush with appKey: ${applicationKey}");
    
    try {
        PushConnector.Builder builder = new PushConnector.Builder("${applicationKey}", "${googleSenderId}")
            .turnOnDebugLogs(${enableDebugLogs});
            
        builder.create(this);
        
        Log.d("MainApplication", "XtremePush initialized successfully!");
    } catch (Exception e) {
        Log.e("MainApplication", "Failed to initialize XtremePush: " + e.getMessage(), e);
    }
  }
}
`;
}

function addPushConnectorToMainApplication(mainApplicationContents, applicationKey, googleSenderId, enableDebugLogs, enablePushPermissions) {
    const importStatement = 'import ie.imobile.extremepush.PushConnector';
    const reactPackageImport = 'import RNXtremepushReactPackage';

    const isKotlin = mainApplicationContents.includes('class MainApplication : Application()') ||
        mainApplicationContents.includes('override fun onCreate()') ||
        !mainApplicationContents.includes('public class');

    let initializationCode;
    if (isKotlin) {
        initializationCode = `        // Initialize XtremePush\n        PushConnector.Builder(\"${applicationKey}\", \"${googleSenderId}\")\n            .turnOnDebugLogs(${enableDebugLogs})\n            .create(this)`;
    } else {
        initializationCode = `        // Initialize XtremePush\n        new PushConnector.Builder(\"${applicationKey}\", \"${googleSenderId}\")\n            .turnOnDebugLogs(${enableDebugLogs})\n            .create(this);`;
    }

    let modifiedContents = mainApplicationContents;

    // Add imports if not present
    if (!modifiedContents.includes(importStatement)) {
        const importRegex = /(import\s+[^;\r\n]+[\r\n]+)+/;
        if (importRegex.test(modifiedContents)) {
            modifiedContents = modifiedContents.replace(
                importRegex,
                `$&${importStatement}\n`
            );
            console.log('✅ Added PushConnector import');
        }
    }

    // Add ReactPackage import if not present
    if (!modifiedContents.includes('RNXtremepushReactPackage')) {
        const importRegex = /(import\s+[^;\r\n]+[\r\n]+)+/;
        if (importRegex.test(modifiedContents)) {
            modifiedContents = modifiedContents.replace(
                importRegex,
                `$&${reactPackageImport}\n`
            );
            console.log('✅ Added RNXtremepushReactPackage import');
        }
    }

    // Robustly add RNXtremepushReactPackage to getPackages()
    if (modifiedContents.includes('getPackages()') && !/packages\.add\(new RNXtremepushReactPackage\(\)\)/.test(modifiedContents)) {
        // Find the getPackages() method
        const getPackagesRegex = /(protected List<ReactPackage> getPackages\(\)\s*\{[\s\S]*?List<ReactPackage> packages = new PackageList\(this\)\.getPackages\(\);[\s\S]*?)(return packages;)/;
        if (getPackagesRegex.test(modifiedContents)) {
            modifiedContents = modifiedContents.replace(
                getPackagesRegex,
                (match, beforeReturn, returnLine) => {
                    // Insert after the packages list is created, before return
                    return (
                        beforeReturn +
                        '      // XtremePush: Add the RNXtremepushReactPackage\n' +
                        '      packages.add(new RNXtremepushReactPackage());\n' +
                        returnLine
                    );
                }
            );
            console.log('✅ Robustly added RNXtremepushReactPackage to getPackages method');
        }
    }

    // Add initialization if not present
    if (!modifiedContents.includes('PushConnector.Builder')) {
        if (isKotlin) {
            const onCreateRegex = /(override fun onCreate\(\)\s*{[^}]*super\.onCreate\(\))/;
            if (onCreateRegex.test(modifiedContents)) {
                modifiedContents = modifiedContents.replace(
                    onCreateRegex,
                    `$1\n\n${initializationCode}`
                );
                console.log('✅ Added PushConnector initialization to Kotlin onCreate');
            }
        } else {
            const onCreateRegex = /(public void onCreate\(\)\s*{[^}]*super\.onCreate\(\);)/;
            const overrideRegex = /(@Override\s*public void onCreate\(\)\s*{[^}]*super\.onCreate\(\);)/;
            if (onCreateRegex.test(modifiedContents)) {
                modifiedContents = modifiedContents.replace(
                    onCreateRegex,
                    `$1\n\n${initializationCode}`
                );
                console.log('✅ Added PushConnector initialization to Java onCreate');
            } else if (overrideRegex.test(modifiedContents)) {
                modifiedContents = modifiedContents.replace(
                    overrideRegex,
                    `$1\n\n${initializationCode}`
                );
                console.log('✅ Added PushConnector initialization to Java onCreate with @Override');
            }
        }
    } else {
        console.log('✓ PushConnector initialization already exists');
    }

    return modifiedContents;
}

// ========================================
// iOS HELPER FUNCTIONS
// ========================================

function addIOSDependencies(podfileContents) {
    console.log('Adding XtremePush iOS SDK to Podfile...');

    const xpushPod = `  pod 'Xtremepush-iOS-SDK', :git => 'https://github.com/xtremepush/Xtremepush-iOS-SDK'`;

    if (podfileContents.includes('XPush')) {
        console.log('✓ XtremePush iOS SDK already exists in Podfile');
        return podfileContents;
    }

    const targetRegex = /(target ['"][^'"]+['"] do)/;
    if (targetRegex.test(podfileContents)) {
        const modifiedContents = podfileContents.replace(
            targetRegex,
            `$1\n${xpushPod}`
        );
        console.log('✅ Added XtremePush iOS SDK dependency to Podfile');
        return modifiedContents;
    } else {
        console.warn('⚠️  Could not find target block in Podfile');
        return podfileContents;
    }
}

function addIOSInitialization(appDelegateContents, applicationKey, enableDebugLogs, enablePushPermissions) {
    console.log('Adding XtremePush initialization to AppDelegate...');

    const isSwift = appDelegateContents.includes('import UIKit') ||
        appDelegateContents.includes('class AppDelegate') ||
        appDelegateContents.includes('func application');

    let modifiedContents = appDelegateContents;

    if (isSwift) {
        console.log('Detected Swift AppDelegate');

        const swiftImport = 'import XPush';
        const swiftInitCode = `        // Initialize XtremePush
        XPush.setAppKey("${applicationKey}")
        ${enableDebugLogs ? `
        #if DEBUG
        XPush.setShouldShowDebugLogs(true)
        #endif` : ''}
        //XPush.setRequestPushPermissions(${enablePushPermissions})
        XPush.applicationDidFinishLaunching(options: launchOptions)`;
        
        // Add import at the very beginning
        if (!modifiedContents.includes(swiftImport)) {
            modifiedContents = `${swiftImport}\n${modifiedContents}`;
        }
        
        // Add initialization
        if (!modifiedContents.includes('XPush.setAppKey')) {
            const didFinishRegex = /(func application\([^)]+didFinishLaunchingWithOptions[^{]*{)/;
            if (didFinishRegex.test(modifiedContents)) {
                modifiedContents = modifiedContents.replace(
                    didFinishRegex,
                    `$1\n${swiftInitCode}\n`
                );
                console.log('✅ Added XPush initialization to Swift AppDelegate');
            }
        }

    } else {
        console.log('Detected Objective-C AppDelegate');

        const objcImport = '#import <XPush/XPush.h>';
        const objcInitCode = `  // Initialize XtremePush
  [XPush setAppKey: @"${applicationKey}"];
  ${enableDebugLogs ? `
  #if DEBUG
  [XPush setShouldShowDebugLogs:YES];
  #endif` : ''}
  [XPush setRequestPushPermissions:${enablePushPermissions ? 'YES' : 'NO'}];
  [XPush applicationDidFinishLaunchingWithOptions:launchOptions];`;

        // Add import
        if (!modifiedContents.includes(objcImport)) {
            const importRegex = /(#import "AppDelegate\.h")/;
            if (importRegex.test(modifiedContents)) {
                modifiedContents = modifiedContents.replace(
                    importRegex,
                    `$1\n${objcImport}`
                );
                console.log('✅ Added XPush import to Objective-C AppDelegate');
            }
        }

        // Add initialization
        if (!modifiedContents.includes('[XPush setAppKey')) {
            const didFinishRegex = /(- \(BOOL\)application:\(UIApplication \*\)application didFinishLaunchingWithOptions:\(NSDictionary \*\)launchOptions\s*{)/;

            if (didFinishRegex.test(modifiedContents)) {
                modifiedContents = modifiedContents.replace(
                    didFinishRegex,
                    `$1\n${objcInitCode}`
                );
                console.log('✅ Added XPush initialization to Objective-C AppDelegate');
            }
        }
    }

    return modifiedContents;
}

module.exports = withXPExpoPlugin;
