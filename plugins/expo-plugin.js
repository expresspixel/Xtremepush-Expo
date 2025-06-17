const { withAndroidManifest, withProjectBuildGradle, withAppBuildGradle, withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withXPExpoPlugin = (config, pluginConfig) => {
    console.log('🔧 Xtremepush Expo Plugin running...');

    const options = pluginConfig || {};
    const { applicationKey = 'DEFAULT_APP_KEY', googleSenderId = 'DEFAULT_SENDER_ID' } = options;

    config = withAndroidManifest(config, (config) => {
        console.log('Adding Android Permissions...');

        const permissions = [
            'android.permission.ACCESS_COARSE_LOCATION',
            'android.permission.ACCESS_FINE_LOCATION',
            'android.permission.ACCESS_BACKGROUND_LOCATION'
        ];

        permissions.forEach(permission => {
            if (!config.modResults.manifest['uses-permission']?.find(p => p.$['android:name'] === permission)) {
                config.modResults.manifest['uses-permission'] = config.modResults.manifest['uses-permission'] || [];
                config.modResults.manifest['uses-permission'].push({
                    $: { 'android:name': permission }
                });
            }
        });

        // Make sure the application element points to our MainApplication class
        if (config.modResults.manifest.application && config.modResults.manifest.application[0]) {
            const packageName = config.android?.package || 'com.anonymous.testapp';
            config.modResults.manifest.application[0].$['android:name'] = `${packageName}.MainApplication`;
            console.log('Set android:name to MainApplication');
        }

        return config;
    });

    // Here we will add the Maven Repository
    config = withProjectBuildGradle(config, (config) => {
        console.log('Adding Maven Repository...');
        config.modResults.contents = addMavenRepository(config.modResults.contents);

        console.log('Adding Google Services plugin to project-level build.gradle...');
        config.modResults.contents = addGoogleServicesPluginToProject(config.modResults.contents);

        return config;
    });

    // Add dependencies 
    config = withAppBuildGradle(config, (config) => {
        console.log('Adding dependencies...');
        config.modResults.contents = addDependencies(config.modResults.contents);

        console.log('Adding Google Services plugin to app-level build.gradle...');
        config.modResults.contents = addGoogleServicesPluginToApp(config.modResults.contents);

        return config;
    });

    // Create or modify MainApplication.java 
    config = withMainApplication(config, (config) => {
        console.log('Creating/Modifying MainApplication.java...');

        // Check if MainApplication exists, if not create it
        if (!config.modResults.contents || config.modResults.contents.trim() === '') {
            console.log('Creating new MainApplication.java file...');
            config.modResults.contents = createMainApplicationFile(config, applicationKey, googleSenderId);
        } else {
            console.log('Modifying existing MainApplication.java...');
            config.modResults.contents = addPushConnectorToMainApplication(
                config.modResults.contents,
                applicationKey,
                googleSenderId
            );
        }

        return config;
    });

    // Add imports to all activities - MUST BE LAST AND AT TOP LEVEL
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            console.log('Adding imports to all activities...');
            await addImportsToAllActivities(config.modRequest.projectRoot);
            return config;
        },
    ]);

    return config;
};

function addMavenRepository(buildGradleContents) {
    const mavenUrl = 'https://maven.xtremepush.com/artifactory/libs-release-local/';
    const mavenRepo = `        maven { url '${mavenUrl}' }`;

    // Check if already added
    if (buildGradleContents.includes(mavenUrl)) {
        console.log('Maven Repository already exists.');
        return buildGradleContents;
    }

    // Find the allprojects repositories block and add our Maven Repo
    const allProjectsRegex = /(allprojects\s*{\s*repositories\s*{[^}]*)(})/;

    if (allProjectsRegex.test(buildGradleContents)) {
        return buildGradleContents.replace(
            allProjectsRegex,
            `$1${mavenRepo}\n    $2`
        );
    } else {
        console.warn('Could not find allprojects repositories block');
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

        // Check if dependency already exists
        if (modifiedContents.includes(dependency)) {
            console.log(`Dependency ${dependency} already exists`);
            return;
        }

        // More robust regex to find the dependencies block
        const dependenciesMatch = modifiedContents.match(/dependencies\s*\{/);

        if (dependenciesMatch) {
            const startIndex = dependenciesMatch.index + dependenciesMatch[0].length;

            // Find the matching closing brace for the dependencies block
            let braceCount = 1;
            let endIndex = startIndex;

            while (endIndex < modifiedContents.length && braceCount > 0) {
                if (modifiedContents[endIndex] === '{') braceCount++;
                if (modifiedContents[endIndex] === '}') braceCount--;
                endIndex++;
            }

            // Insert our dependency just before the closing brace
            const beforeClosing = modifiedContents.substring(0, endIndex - 1);
            const afterClosing = modifiedContents.substring(endIndex - 1);

            modifiedContents = beforeClosing + `\n${implementationLine}` + afterClosing;
            console.log(`Added dependency: ${dependency}`);
        } else {
            console.warn('Could not find dependencies block');
        }
    });

    return modifiedContents;
}

function addGoogleServicesPluginToProject(buildGradleContents) {
    const googleServicesPlugin = `    classpath 'com.google.gms:google-services:4.4.2'`;

    // Check if already added
    if (buildGradleContents.includes('com.google.gms:google-services')) {
        console.log('Google Services plugin already exists in project build.gradle');
        return buildGradleContents;
    }

    // Find the dependencies block in buildscript and add the Google Services plugin
    const buildscriptDepsMatch = buildGradleContents.match(/buildscript\s*{[\s\S]*?dependencies\s*\{/);

    if (buildscriptDepsMatch) {
        const startIndex = buildscriptDepsMatch.index + buildscriptDepsMatch[0].length;

        // Find the matching closing brace for the dependencies block
        let braceCount = 1;
        let endIndex = startIndex;

        while (endIndex < buildGradleContents.length && braceCount > 0) {
            if (buildGradleContents[endIndex] === '{') braceCount++;
            if (buildGradleContents[endIndex] === '}') braceCount--;
            endIndex++;
        }

        // Insert our plugin just before the closing brace
        const beforeClosing = buildGradleContents.substring(0, endIndex - 1);
        const afterClosing = buildGradleContents.substring(endIndex - 1);

        console.log('Added Google Services plugin to project build.gradle');
        return beforeClosing + `\n${googleServicesPlugin}` + afterClosing;
    } else {
        console.warn('Could not find buildscript dependencies block in project build.gradle');
        return buildGradleContents;
    }
}

function addGoogleServicesPluginToApp(buildGradleContents) {
    const googleServicesPlugin = `apply plugin: 'com.google.gms.google-services'`;

    // Check if already added
    if (buildGradleContents.includes('com.google.gms.google-services')) {
        console.log('Google Services plugin already exists in app build.gradle');
        return buildGradleContents;
    }

    // Find the existing apply plugin lines and add after them
    const applyPluginRegex = /(apply plugin:.*\n)+/;

    if (applyPluginRegex.test(buildGradleContents)) {
        buildGradleContents = buildGradleContents.replace(
            applyPluginRegex,
            `$&${googleServicesPlugin}\n`
        );
        console.log('Added Google Services plugin to app build.gradle');
        return buildGradleContents;
    } else {
        console.warn('Could not find apply plugin section in app build.gradle');
        return buildGradleContents;
    }
}

async function addImportsToAllActivities(projectRoot) {
    const androidSrcPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java');

    if (!fs.existsSync(androidSrcPath)) {
        console.warn('Android source directory not found');
        return;
    }

    try {
        await findAndModifyActivities(androidSrcPath);
    } catch (error) {
        console.error('Error adding imports to activities:', error);
    }
}

async function findAndModifyActivities(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Recursively search subdirectories
            await findAndModifyActivities(filePath);
        } else if (file.endsWith('Activity.java')) {
            // Found an activity file
            console.log(`Processing activity: ${file}`);
            addImportToActivity(filePath);
        }
    }
}

function addImportToActivity(activityFilePath) {
    const importStatement = 'import static ie.imobile.extremepush.PushConnector.mPushConnector;';

    try {
        let content = fs.readFileSync(activityFilePath, 'utf8');

        // Check if import already exists
        if (content.includes(importStatement)) {
            console.log(`Import already exists in ${path.basename(activityFilePath)}`);
            return;
        }

        // Add import after other imports
        const importRegex = /(import\s+[^;]+;\s*)+/;

        if (importRegex.test(content)) {
            content = content.replace(
                importRegex,
                `$&${importStatement}\n`
            );

            fs.writeFileSync(activityFilePath, content, 'utf8');
            console.log(`Added import to ${path.basename(activityFilePath)}`);
        } else {
            console.warn(`Could not find import section in ${path.basename(activityFilePath)}`);
        }
    } catch (error) {
        console.error(`Error modifying ${activityFilePath}:`, error);
    }
}

function createMainApplicationFile(config, applicationKey, googleSenderId) {
    // Get the package name from the config 
    const packageName = config.android?.package || 'com.anonymous.testapp';

    return `package ${packageName};

import android.app.Application;
import android.util.Log;
import ie.imobile.extremepush.PushConnector;

public class MainApplication extends Application {
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d("MainApplication", "MainApplication onCreate() called!");
        Log.d("MainApplication", "About to initialize PushConnector with appKey: ${applicationKey}");
        
        try {
            new PushConnector.Builder("${applicationKey}", "${googleSenderId}")
                .turnOnDebugLogs(true)
                .create(this);
            Log.d("MainApplication", "PushConnector initialized successfully!");
        } catch (Exception e) {
            Log.e("MainApplication", "Failed to initialize PushConnector: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
`;
}

function addPushConnectorToMainApplication(mainApplicationContents, applicationKey, googleSenderId) {
    const importStatement = 'import ie.imobile.extremepush.PushConnector';

    // Check if this is a Kotlin file based on content
    const isKotlin = mainApplicationContents.includes('class MainApplication : Application()') ||
        mainApplicationContents.includes('override fun onCreate()') ||
        !mainApplicationContents.includes('public class');

    let initializationCode;
    if (isKotlin) {
        // Kotlin syntax
        initializationCode = `        PushConnector.Builder("${applicationKey}", "${googleSenderId}")
            .turnOnDebugLogs(true)
            .create(this)`;
    } else {
        // Java syntax
        initializationCode = `        new PushConnector.Builder("${applicationKey}", "${googleSenderId}")
            .turnOnDebugLogs(true)
            .create(this);`;
    }

    let modifiedContents = mainApplicationContents;

    // Add import if not already present
    if (!modifiedContents.includes(importStatement)) {
        const importRegex = /(import\s+[^;\r\n]+[\r\n]+)+/;

        if (importRegex.test(modifiedContents)) {
            modifiedContents = modifiedContents.replace(
                importRegex,
                `$&${importStatement}\n`
            );
        }
        console.log('Added PushConnector import');
    }

    // Add initialization in onCreate method
    if (!modifiedContents.includes('PushConnector.Builder')) {
        if (isKotlin) {
            // Kotlin patterns
            const onCreateRegex1 = /(override fun onCreate\(\)\s*{[^}]*)(})/;
            const onCreateRegex2 = /(super\.onCreate\(\)[^}]*)(})/;

            if (onCreateRegex1.test(modifiedContents)) {
                modifiedContents = modifiedContents.replace(
                    onCreateRegex1,
                    `$1\n${initializationCode}\n    $2`
                );
                console.log('Added PushConnector initialization to Kotlin onCreate');
            } else if (onCreateRegex2.test(modifiedContents)) {
                modifiedContents = modifiedContents.replace(
                    onCreateRegex2,
                    `$1\n${initializationCode}`
                );
                console.log('Added PushConnector initialization after Kotlin super.onCreate()');
            } else {
                console.warn('Could not find onCreate method in Kotlin MainApplication');
            }
        } else {
            // Java patterns
            const onCreateRegex1 = /(public\s+void\s+onCreate\s*\(\s*\)\s*{[^}]*)(})/;
            const onCreateRegex2 = /(@Override\s*public\s+void\s+onCreate\s*\(\s*\)\s*{[^}]*)(})/;
            const onCreateRegex3 = /(super\.onCreate\(\);[^}]*)(})/;

            if (onCreateRegex1.test(modifiedContents)) {
                modifiedContents = modifiedContents.replace(
                    onCreateRegex1,
                    `$1\n${initializationCode}\n    $2`
                );
                console.log('Added PushConnector initialization to Java onCreate (pattern 1)');
            } else if (onCreateRegex2.test(modifiedContents)) {
                modifiedContents = modifiedContents.replace(
                    onCreateRegex2,
                    `$1\n${initializationCode}\n    $2`
                );
                console.log('Added PushConnector initialization to Java onCreate (pattern 2)');
            } else if (onCreateRegex3.test(modifiedContents)) {
                modifiedContents = modifiedContents.replace(
                    onCreateRegex3,
                    `$1\n${initializationCode}`
                );
                console.log('Added PushConnector initialization after Java super.onCreate()');
            } else {
                console.warn('Could not find onCreate method in Java MainApplication');
            }
        }

        if (!modifiedContents.includes('PushConnector.Builder')) {
            console.log('MainApplication content preview:', modifiedContents.substring(0, 500));
        }
    } else {
        console.log('PushConnector initialization already exists');
    }

    return modifiedContents;
}

module.exports = withXPExpoPlugin;