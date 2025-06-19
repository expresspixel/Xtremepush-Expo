#!/bin/bash

echo "🧪 Testing XtremePush Expo Plugin..."

# Test 1: Check if supporting files exist
echo "📁 Checking supporting files..."
if [ -f "plugins/xtremepush.js" ]; then
    echo "✅ xtremepush.js exists"
else
    echo "❌ xtremepush.js missing"
    exit 1
fi

if [ -f "plugins/supporting-files/android/RNXtremepushReactModule.java" ]; then
    echo "✅ RNXtremepushReactModule.java exists"
else
    echo "❌ RNXtremepushReactModule.java missing"
    exit 1
fi

if [ -f "plugins/supporting-files/android/RNXtremepushReactPackage.java" ]; then
    echo "✅ RNXtremepushReactPackage.java exists"
else
    echo "❌ RNXtremepushReactPackage.java missing"
    exit 1
fi

if [ -f "plugins/supporting-files/ios/RNXtremepushReact.h" ]; then
    echo "✅ RNXtremepushReact.h exists"
else
    echo "❌ RNXtremepushReact.h missing"
    exit 1
fi

if [ -f "plugins/supporting-files/ios/RNXtremepushReact.m" ]; then
    echo "✅ RNXtremepushReact.m exists"
else
    echo "❌ RNXtremepushReact.m missing"
    exit 1
fi

# Test 2: Check plugin syntax
echo "🔧 Checking plugin syntax..."
node -c plugins/expo-plugin.js
if [ $? -eq 0 ]; then
    echo "✅ Plugin syntax is valid"
else
    echo "❌ Plugin syntax error"
    exit 1
fi

# Test 3: Check if plugin exports correctly
echo "📦 Checking plugin exports..."
node -e "
const plugin = require('./plugins/expo-plugin.js');
if (typeof plugin === 'function') {
    console.log('✅ Plugin exports correctly');
} else {
    console.log('❌ Plugin export error');
    process.exit(1);
}
"

echo "🎉 All tests passed! Plugin is ready to use."
