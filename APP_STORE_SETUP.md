# Configuration des métadonnées pour iOS et Android

Ce guide vous aide à configurer toutes les métadonnées nécessaires pour publier KAZAM Market sur l'App Store (iOS) et le Play Store (Android).

## 📱 Informations de base de l'application

- **Nom de l'app** : KAZAM Market
- **Package ID** : `app.lovable.fdde6a57c0ea45b0bd6d4e42d3d22471`
- **Version** : 1.0.0
- **Description courte** : Marketplace de petites annonces pour l'Afrique de l'Ouest
- **Catégorie** : Shopping / Marketplace

## 🎨 Icônes de l'application

### Prérequis
Vous avez besoin d'une icône carrée haute résolution (1024x1024px minimum) sans coins arrondis, sans transparence.

### Générer les icônes automatiquement

**Option 1 : Utiliser un générateur en ligne (Recommandé)**
1. Allez sur [https://www.appicon.co/](https://www.appicon.co/) ou [https://icon.kitchen/](https://icon.kitchen/)
2. Uploadez votre icône 1024x1024px
3. Téléchargez les assets pour iOS et Android
4. Placez-les dans les dossiers appropriés (voir ci-dessous)

**Option 2 : Utiliser Capacitor Asset Generator**
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#FFFFFF' --iconBackgroundColorDark '#000000' --splashBackgroundColor '#FFFFFF' --splashBackgroundColorDark '#000000'
```

### Structure des icônes iOS

Après avoir généré les icônes, placez-les dans :
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
```

Tailles requises pour iOS :
- 20x20 (@1x, @2x, @3x)
- 29x29 (@1x, @2x, @3x)
- 40x40 (@1x, @2x, @3x)
- 60x60 (@2x, @3x)
- 76x76 (@1x, @2x)
- 83.5x83.5 (@2x)
- 1024x1024 (App Store)

### Structure des icônes Android

Placez les icônes dans :
```
android/app/src/main/res/
```

Tailles requises :
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

Pour l'icône adaptative Android (recommandé) :
```
android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
android/app/src/main/res/drawable/ic_launcher_background.xml
android/app/src/main/res/drawable/ic_launcher_foreground.xml
```

## 🌅 Splash Screens

### iOS Splash Screen

Créez un splash screen dans :
```
ios/App/App/Assets.xcassets/Splash.imageset/
```

Créez un fichier `splash.png` avec les dimensions :
- splash@1x.png : 2732x2732
- splash@2x.png : 2732x2732
- splash@3x.png : 2732x2732

Alternative : Utilisez `LaunchScreen.storyboard` pour un splash screen personnalisé.

### Android Splash Screen

Le splash screen Android est géré dans :
```
android/app/src/main/res/drawable/splash.png
```

Créez les variantes :
- `drawable-mdpi/splash.png` (320x480)
- `drawable-hdpi/splash.png` (480x800)
- `drawable-xhdpi/splash.png` (720x1280)
- `drawable-xxhdpi/splash.png` (1080x1920)
- `drawable-xxxhdpi/splash.png` (1440x2560)

Ou configurez le splash dans `android/app/src/main/res/values/styles.xml` :
```xml
<style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
    <item name="android:background">@drawable/splash</item>
</style>
```

## 📝 Nom d'affichage de l'application

### iOS

1. Ouvrez `ios/App/App.xcodeproj` dans Xcode
2. Sélectionnez le projet "App" dans le navigateur
3. Dans la section "General", modifiez :
   - **Display Name** : KAZAM Market
   - **Bundle Identifier** : app.lovable.fdde6a57c0ea45b0bd6d4e42d3d22471
   - **Version** : 1.0.0
   - **Build** : 1

Ou modifiez directement `ios/App/App/Info.plist` :
```xml
<key>CFBundleDisplayName</key>
<string>KAZAM Market</string>
<key>CFBundleName</key>
<string>KAZAM Market</string>
```

### Android

Modifiez `android/app/src/main/res/values/strings.xml` :
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">DJASSA</string>
    <string name="title_activity_main">DJASSA</string>
    <string name="package_name">app.lovable.fdde6a57c0ea45b0bd6d4e42d3d22471</string>
    <string name="custom_url_scheme">app.lovable.fdde6a57c0ea45b0bd6d4e42d3d22471</string>
</resources>
```

## 🎨 Couleurs et thème

### iOS

Modifiez `ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json` pour définir les couleurs :
```json
{
  "info" : {
    "version" : 1,
    "author" : "xcode"
  }
}
```

### Android

Modifiez `android/app/src/main/res/values/colors.xml` :
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#3B82F6</color>
    <color name="colorPrimaryDark">#2563EB</color>
    <color name="colorAccent">#3B82F6</color>
    <color name="statusBarColor">#FFFFFF</color>
    <color name="toolbarColor">#FFFFFF</color>
    <color name="navigationBarColor">#FFFFFF</color>
</resources>
```

## 📱 Configuration du manifeste Android

Vérifiez `android/app/src/main/AndroidManifest.xml` :

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>
    </application>

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
</manifest>
```

## 📄 Info.plist iOS

Vérifiez que `ios/App/App/Info.plist` contient toutes les permissions nécessaires :

```xml
<key>NSCameraUsageDescription</key>
<string>Nous avons besoin d'accéder à votre appareil photo pour prendre des photos de vos articles à vendre</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Nous avons besoin d'accéder à votre galerie pour sélectionner des photos de vos articles</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Nous utilisons votre position pour estimer la distance avec les annonceurs et améliorer vos résultats de recherche</string>

<key>NSFaceIDUsageDescription</key>
<string>Utilisez Face ID pour vous authentifier rapidement et en toute sécurité</string>
```

## 🔧 Build et Version

### iOS (Info.plist)
```xml
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

### Android (build.gradle)
```gradle
android {
    defaultConfig {
        applicationId "app.lovable.fdde6a57c0ea45b0bd6d4e42d3d22471"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

## 📸 Captures d'écran pour les stores

### App Store (iOS)
Dimensions requises :
- **iPhone 6.7"** : 1290 x 2796 (obligatoire)
- **iPhone 6.5"** : 1242 x 2688
- **iPhone 5.5"** : 1242 x 2208
- **iPad Pro 12.9"** : 2048 x 2732

Minimum : 3-10 captures d'écran par taille d'appareil

### Play Store (Android)
Dimensions requises :
- **Phone** : 1080 x 1920 ou 1080 x 2340 (minimum 2 captures)
- **7-inch Tablet** : 1200 x 1920 (optionnel)
- **10-inch Tablet** : 1600 x 2560 (optionnel)

Format : PNG ou JPEG, 24-bit RGB, pas de transparence

## 🎨 Graphiques promotionnels

### App Store
- **Icône** : 1024 x 1024 (obligatoire, sans coins arrondis)
- **Preview vidéo** : Optionnel mais recommandé

### Play Store
- **Icône** : 512 x 512 (obligatoire)
- **Feature Graphic** : 1024 x 500 (obligatoire)
- **Promo Video** : Lien YouTube (optionnel)
- **TV Banner** : 1280 x 720 (si vous ciblez Android TV)

## ✅ Checklist finale

### iOS
- [ ] Toutes les icônes générées et placées dans Assets.xcassets
- [ ] Splash screen configuré
- [ ] Info.plist avec toutes les permissions et descriptions
- [ ] Display Name défini sur "DJASSA"
- [ ] Bundle Identifier correct
- [ ] Version et Build number définis
- [ ] Captures d'écran préparées (minimum 3)
- [ ] Icône 1024x1024 pour l'App Store

### Android
- [ ] Toutes les densités d'icônes générées
- [ ] Icône adaptative configurée (optionnel mais recommandé)
- [ ] Splash screens pour toutes les densités
- [ ] AndroidManifest.xml correct avec permissions
- [ ] strings.xml avec le bon nom d'app
- [ ] colors.xml avec le thème
- [ ] google-services.json dans android/app/
- [ ] build.gradle avec versions correctes
- [ ] Captures d'écran préparées (minimum 2)
- [ ] Feature Graphic 1024x500

## 🚀 Commandes de build

### Pour iOS
```bash
# Après avoir configuré tout ce qui précède
npm run build
npx cap sync ios
npx cap open ios

# Dans Xcode :
# 1. Sélectionnez "Any iOS Device (arm64)" dans la barre d'outils
# 2. Product > Archive
# 3. Distribute App > App Store Connect
```

### Pour Android
```bash
# Après avoir configuré tout ce qui précède
npm run build
npx cap sync android
npx cap open android

# Dans Android Studio :
# 1. Build > Generate Signed Bundle / APK
# 2. Sélectionnez "Android App Bundle"
# 3. Créez ou sélectionnez votre keystore
# 4. Build
```

## 📚 Ressources utiles

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)
- [Capacitor Assets Generator](https://github.com/ionic-team/capacitor-assets)
- [App Icon Generator](https://www.appicon.co/)
- [Splash Screen Generator](https://icon.kitchen/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Play Store Policy Center](https://play.google.com/about/developer-content-policy/)

## 💡 Conseils

1. **Icônes** : Gardez le design simple et reconnaissable même à petite taille
2. **Splash Screen** : Doit charger en moins de 3 secondes
3. **Captures d'écran** : Montrez les fonctionnalités principales de l'app
4. **Descriptions** : Soyez clair et concis sur ce que fait votre app
5. **Tests** : Testez sur plusieurs appareils et tailles d'écran avant de soumettre
6. **Conformité** : Assurez-vous que tout le contenu respecte les guidelines des stores
