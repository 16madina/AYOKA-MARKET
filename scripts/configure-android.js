#!/usr/bin/env node

/**
 * Script de configuration automatique Android pour AYOKA MARKET
 * Ce script met à jour les fichiers de configuration Android
 * incluant les deep links et App Links
 * 
 * Usage: node scripts/configure-android.js
 * Ou via npm: npm run configure:android
 */

const fs = require('fs');
const path = require('path');

const ANDROID_PATH = path.join(__dirname, '..', 'android');
const ANDROID_MANIFEST_PATH = path.join(ANDROID_PATH, 'app', 'src', 'main', 'AndroidManifest.xml');
const ANDROID_STRINGS_PATH = path.join(ANDROID_PATH, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const ANDROID_STYLES_PATH = path.join(ANDROID_PATH, 'app', 'src', 'main', 'res', 'values', 'styles.xml');
const RESOURCES_STRINGS_PATH = path.join(__dirname, '..', 'resources', 'android-strings.xml');
const RESOURCES_STYLES_PATH = path.join(__dirname, '..', 'resources', 'android-styles.xml');

function copyFileIfExists(src, dest) {
  if (fs.existsSync(src)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      console.log(`  📁 Création du dossier: ${destDir}`);
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

function configureDeepLinks() {
  if (!fs.existsSync(ANDROID_MANIFEST_PATH)) {
    console.log('  ⚠️  AndroidManifest.xml non trouvé');
    return false;
  }

  let manifest = fs.readFileSync(ANDROID_MANIFEST_PATH, 'utf8');

  // Vérifier si les deep links sont déjà configurés
  if (manifest.includes('android:host="ayokamarket.com"')) {
    console.log('  ℹ️  Deep links déjà configurés');
    return true;
  }

  // Ajouter launchMode="singleTask" à MainActivity si pas présent
  if (!manifest.includes('android:launchMode="singleTask"')) {
    manifest = manifest.replace(
      /(<activity[^>]*android:name="\.MainActivity")/,
      '$1\n            android:launchMode="singleTask"'
    );
  }

  // Intent filters pour les deep links
  const intentFilters = `
        <!-- App Links - HTTPS (vérifiés via assetlinks.json) -->
        <intent-filter android:autoVerify="true">
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" android:host="ayokamarket.com" />
        </intent-filter>

        <!-- Custom URL Scheme -->
        <intent-filter>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="ayokamarket" />
        </intent-filter>
`;

  // Insérer avant la fermeture de </activity>
  // Trouver la première occurrence de </activity> après MainActivity
  const mainActivityMatch = manifest.match(/<activity[^>]*android:name="\.MainActivity"[\s\S]*?<\/activity>/);
  if (mainActivityMatch) {
    const activityBlock = mainActivityMatch[0];
    const newActivityBlock = activityBlock.replace(
      '</activity>',
      `${intentFilters}
        </activity>`
    );
    manifest = manifest.replace(activityBlock, newActivityBlock);
  }

  fs.writeFileSync(ANDROID_MANIFEST_PATH, manifest);
  return true;
}

function main() {
  console.log('🤖 Configuration Android pour AYOKA MARKET\n');
  
  if (!fs.existsSync(ANDROID_PATH)) {
    console.error('❌ Projet Android non trouvé');
    console.log('💡 Exécutez "npx cap add android" d\'abord');
    process.exit(1);
  }
  
  console.log('📝 Configuration des fichiers:\n');
  
  // Copy strings.xml
  if (copyFileIfExists(RESOURCES_STRINGS_PATH, ANDROID_STRINGS_PATH)) {
    console.log('  ✅ strings.xml (nom de l\'app)');
  } else {
    console.log('  ⚠️  strings.xml non trouvé dans resources/');
  }
  
  // Copy styles.xml
  if (copyFileIfExists(RESOURCES_STYLES_PATH, ANDROID_STYLES_PATH)) {
    console.log('  ✅ styles.xml (splash screen)');
  } else {
    console.log('  ⚠️  styles.xml non trouvé dans resources/');
  }

  // Configure deep links
  console.log('\n🔗 Configuration des Deep Links:\n');
  if (configureDeepLinks()) {
    console.log('  ✅ AndroidManifest.xml (deep links + App Links)');
  }
  
  console.log('\n✨ Configuration Android terminée!\n');
  console.log('📱 Prochaines étapes:');
  console.log('   1. npx cap sync android');
  console.log('   2. adb uninstall com.ayoka.market');
  console.log('   3. npx cap run android');
  console.log('   4. adb shell pm get-app-links com.ayoka.market');
  console.log('');
}

main();
