# Guide de création des icônes pour DJASSA

## 🎨 Création de l'icône principale

### Spécifications de design
- **Taille source** : 1024x1024px minimum
- **Format** : PNG avec fond opaque (pas de transparence)
- **Marges** : Laissez 10% de marge sur tous les côtés
- **Style** : Simple, reconnaissable, cohérent avec votre marque
- **Couleurs** : Utilisez les couleurs de votre marque (#ea384c pour DJASSA)

### Règles importantes
❌ **À ÉVITER** :
- Transparence ou canal alpha
- Texte trop petit (illisible à petite taille)
- Détails trop fins
- Coins arrondis (iOS les ajoutera automatiquement)

✅ **RECOMMANDÉ** :
- Design minimaliste et clair
- Contraste élevé
- Fonctionne en mode clair et sombre
- Identifiable même à 40x40px

## 🔧 Générer automatiquement toutes les tailles

### Méthode 1 : Icon.kitchen (Recommandé)
1. Allez sur https://icon.kitchen/
2. Uploadez votre icône 1024x1024
3. Prévisualisez sur différents appareils
4. Téléchargez le pack complet
5. Extrayez dans votre projet :
   - Dossier `android/` → racine android/
   - Dossier `ios/` → racine ios/

### Méthode 2 : Capacitor Assets CLI
```bash
# Installer globalement
npm install -g @capacitor/assets

# Placer votre icône dans : resources/icon.png (1024x1024)
# Placer votre splash dans : resources/splash.png (2732x2732)

# Générer tous les assets
npx capacitor-assets generate
```

### Méthode 3 : AppIcon.co
1. Allez sur https://www.appicon.co/
2. Uploadez icon-1024.png
3. Téléchargez les packs iOS et Android séparément
4. Placez-les dans les dossiers appropriés

## 📱 Structure des fichiers générés

### iOS
Après génération, vous devriez avoir :
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
├── AppIcon-20x20@1x.png
├── AppIcon-20x20@2x.png
├── AppIcon-20x20@3x.png
├── AppIcon-29x29@1x.png
├── AppIcon-29x29@2x.png
├── AppIcon-29x29@3x.png
├── AppIcon-40x40@1x.png
├── AppIcon-40x40@2x.png
├── AppIcon-40x40@3x.png
├── AppIcon-60x60@2x.png
├── AppIcon-60x60@3x.png
├── AppIcon-76x76@1x.png
├── AppIcon-76x76@2x.png
├── AppIcon-83.5x83.5@2x.png
├── AppIcon-1024x1024@1x.png
└── Contents.json
```

### Android
Après génération, vous devriez avoir :
```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png (48x48)
│   └── ic_launcher_round.png
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72)
│   └── ic_launcher_round.png
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96x96)
│   └── ic_launcher_round.png
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144x144)
│   └── ic_launcher_round.png
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png (192x192)
│   └── ic_launcher_round.png
└── mipmap-anydpi-v26/
    ├── ic_launcher.xml
    └── ic_launcher_round.xml
```

## 🌅 Splash Screen

### Spécifications
- **Taille** : 2732x2732px (carré universel)
- **Format** : PNG
- **Design** : Logo centré sur fond uni
- **Zone sûre** : Gardez les éléments importants dans un cercle de 1200px au centre

### Création du splash screen
1. Fond uni avec la couleur de votre marque (#FFFFFF pour DJASSA)
2. Logo centré (environ 400x400px)
3. Pas de texte (excepté le nom de l'app si nécessaire)
4. Simple et rapide à charger

### Configuration Capacitor
Le splash est configuré dans `capacitor.config.ts` :
```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    launchAutoHide: true,
    backgroundColor: "#FFFFFF",
    androidScaleType: "CENTER_CROP",
    showSpinner: false,
    androidSpinnerStyle: "large",
    iosSpinnerStyle: "small",
    spinnerColor: "#ea384c"
  }
}
```

## ✅ Validation

### Checklist avant build
- [ ] Icône 1024x1024 créée et sans transparence
- [ ] Toutes les tailles iOS générées
- [ ] Toutes les densités Android générées
- [ ] Splash screen 2732x2732 créé
- [ ] Testé sur simulateur iOS
- [ ] Testé sur émulateur Android
- [ ] Vérifié en mode clair et sombre
- [ ] Lisible à toutes les tailles

### Tests recommandés
1. **iOS Simulator** : Vérifiez l'icône sur l'écran d'accueil
2. **Android Emulator** : Testez avec différentes formes d'icône (rond, carré, etc.)
3. **Appareils réels** : Toujours tester sur au moins un appareil physique

## 🎨 Exemples de bonnes icônes

**Simple et efficace** :
- Logo sur fond uni
- Initiales stylisées
- Pictogramme reconnaissable

**Mauvais exemples** :
- Capture d'écran de l'app
- Texte trop petit
- Design trop complexe
- Gradient avec transparence

## 🔗 Outils utiles

- [Icon.kitchen](https://icon.kitchen/) - Générateur complet (recommandé)
- [AppIcon.co](https://www.appicon.co/) - Simple et rapide
- [Figma](https://www.figma.com/) - Pour créer l'icône de base
- [Remove.bg](https://www.remove.bg/) - Pour retirer les fonds
- [Squoosh](https://squoosh.app/) - Pour optimiser les PNG

## 📝 Notes finales

- Gardez votre icône source (1024x1024) dans `resources/icon-source.png`
- Gardez votre splash source (2732x2732) dans `resources/splash-source.png`
- Versionnez ces fichiers sources dans Git
- Régénérez les assets à chaque changement de design
