# Liste de vérification avant déploiement KAZAM Market

## ✅ Correctifs appliqués

### 1. Sécurité des clés API
- [x] Clé Mapbox déplacée dans `.env` (VITE_MAPBOX_TOKEN)
- [x] Fichier `.env.example` créé pour la documentation
- [x] **Important** : Ne jamais commit le fichier `.env` (déjà dans `.gitignore`)

### 2. Configuration Capacitor pour production
- [x] URL de développement commentée dans `capacitor.config.ts`
- [x] `cleartext: true` désactivé pour la production
- [x] Permissions iOS ajoutées avec descriptions explicites :
  - NSCameraUsageDescription
  - NSPhotoLibraryUsageDescription  
  - NSLocationWhenInUseUsageDescription
  - NSFaceIDUsageDescription
- [x] Permissions Android déclarées :
  - CAMERA, READ/WRITE_EXTERNAL_STORAGE
  - ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION

### 3. Cohérence de marque
- [x] "ReVivo" remplacé par "KAZAM Market" dans :
  - Settings.tsx (partage de l'application)
  - Help.tsx (email de support : support@kazammarket.com)

### 4. URLs de confirmation email
- [x] URL de confirmation cohérente : `/email-verified` dans les edge functions et le frontend

## 📋 Actions à effectuer avant le build de production

### Configuration de l'environnement
```bash
# 1. Copier .env.example vers .env si ce n'est pas déjà fait
cp .env.example .env

# 2. Vérifier que toutes les variables sont définies
cat .env
```

### Build et déploiement natif
```bash
# 1. Transférer le projet vers GitHub
# Utiliser le bouton "Export to Github" dans Lovable

# 2. Cloner et installer
git clone <votre-repo>
cd <votre-projet>
npm install

# 3. Ajouter les plateformes natives
npx cap add ios      # Sur Mac avec Xcode
npx cap add android  # Nécessite Android Studio

# 4. Build de production
npm run build

# 5. Synchroniser avec les plateformes natives
npx cap sync

# 6. Ouvrir dans l'IDE natif
npx cap open ios      # Ouvre Xcode
npx cap open android  # Ouvre Android Studio
```

### Configuration iOS (Xcode)
1. Ouvrir `ios/App/App.xcworkspace`
2. Vérifier les descriptions de permissions dans `Info.plist`
3. Configurer le bundle ID et l'équipe de développement
4. Configurer les capacités (Push Notifications si nécessaire)
5. Tester sur simulateur puis sur appareil réel
6. Archiver pour App Store Connect

### Configuration Android (Android Studio)
1. Ouvrir le dossier `android` dans Android Studio
2. Vérifier `AndroidManifest.xml` pour les permissions
3. Configurer le signing pour release dans `build.gradle`
4. Tester sur émulateur puis sur appareil réel
5. Générer le bundle AAB pour Google Play Console

## ⚠️ Points de vigilance

### Sécurité et conformité
- [ ] Vérifier que `.env` n'est PAS commité dans Git
- [ ] Tester l'authentification biométrique sur de vrais appareils
- [ ] Valider que la géolocalisation fonctionne correctement
- [ ] S'assurer que la caméra et la galerie fonctionnent

### Modération de contenu
- [ ] Le système de signalement est fonctionnel
- [ ] Politique anti-contenu illégal documentée
- [ ] Processus de modération en place (manuel ou automatique)

### Politiques et mentions légales
- [ ] Politique de confidentialité complète et à jour
- [ ] CGU mentionnant tous les contenus interdits
- [ ] Coordonnées de contact valides (support@kazammarket.com)

### Performance
- [ ] Compression des images côté client activée
- [ ] Lazy loading des images implémenté
- [ ] Tester sur appareils Android 13/14 et iOS 17+

### App Store & Play Store
- [ ] Captures d'écran préparées (plusieurs tailles)
- [ ] Description de l'application rédigée (FR et EN si international)
- [ ] Icône de l'app en haute résolution
- [ ] Politique de confidentialité accessible publiquement
- [ ] Déclarer toutes les permissions utilisées

## 🔐 Variables d'environnement requises

```
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
VITE_MAPBOX_TOKEN
```

## 📱 Tests à effectuer avant soumission

### iOS
- [ ] Face ID / Touch ID fonctionne
- [ ] Appareil photo et galerie accessibles
- [ ] Localisation avec permission appropriée
- [ ] Navigation fluide sans crash
- [ ] Notifications push (si implémentées)

### Android
- [ ] Empreinte digitale fonctionne
- [ ] Permissions runtime demandées correctement
- [ ] Compatibilité Android 13+ (targetSdkVersion 33+)
- [ ] Back button gère correctement la navigation

## 🚀 Déploiement final

### Web (Frontend)
1. Cliquer sur "Publish" dans Lovable
2. Cliquer sur "Update" pour déployer

### Mobile
1. Soumettre sur App Store Connect (iOS)
2. Soumettre sur Google Play Console (Android)
3. Attendre la review (1-3 jours iOS, quelques heures Android)

## 📞 Support

En cas de problème :
- Documentation Capacitor : https://capacitorjs.com/docs
- Supabase : https://supabase.com/docs
- Mapbox : https://docs.mapbox.com/

---
**Date de dernière mise à jour** : ${new Date().toLocaleDateString('fr-FR')}
