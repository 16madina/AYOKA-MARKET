# ✅ Checklist complète pour soumettre KAZAM Market aux stores

Cette checklist vous guide étape par étape pour soumettre KAZAM Market sur l'App Store (iOS) et le Play Store (Android).

## 📋 Pré-requis généraux

### Comptes développeurs
- [ ] Compte Apple Developer (99 USD/an) - [Inscription](https://developer.apple.com/programs/)
- [ ] Compte Google Play Console (25 USD paiement unique) - [Inscription](https://play.google.com/console/signup)

### Préparation du projet
- [ ] Code source exporté vers GitHub
- [ ] Projet cloné localement avec `git pull`
- [ ] Dépendances installées : `npm install`
- [ ] Build de production testé : `npm run build`

### Configuration Capacitor
- [ ] iOS ajouté : `npx cap add ios` (si pas déjà fait)
- [ ] Android ajouté : `npx cap add android` (si pas déjà fait)
- [ ] Configuration vérifiée dans `capacitor.config.ts`
- [ ] `google-services.json` copié dans `android/app/`

## 🎨 Assets graphiques

### Icônes (OBLIGATOIRE)
- [ ] Icône source 1024x1024 créée (PNG, sans transparence)
- [ ] Icônes iOS générées (toutes tailles dans Assets.xcassets)
- [ ] Icônes Android générées (toutes densités dans res/mipmap-*)
- [ ] Icône ronde Android (ic_launcher_round) si applicable
- [ ] Testées sur simulateur/émulateur

**Recommandé** : Utilisez [Icon.kitchen](https://icon.kitchen/) pour générer automatiquement

### Splash Screens
- [ ] Splash source 2732x2732 créé
- [ ] Splash iOS configuré dans Assets.xcassets
- [ ] Splash Android configuré pour toutes densités
- [ ] Configuration splash dans `capacitor.config.ts` vérifiée
- [ ] Temps de chargement acceptable (<3s)

### Captures d'écran

**iOS (OBLIGATOIRE)**
- [ ] Minimum 3 captures en 1290x2796 (iPhone 6.7")
- [ ] Format PNG ou JPEG
- [ ] Contenu en français
- [ ] Interface finale (pas de debug)

**Android (OBLIGATOIRE)**
- [ ] Minimum 2 captures en 1080x1920 ou 1080x2340
- [ ] Format PNG ou JPEG 24-bit RGB
- [ ] Feature Graphic 1024x500 créé

**Contenu des captures**
- [ ] Écran d'accueil
- [ ] Navigation dans les annonces
- [ ] Détail d'une annonce
- [ ] Publication d'annonce
- [ ] Messagerie
- [ ] Profil utilisateur

Voir `resources/screenshot-guide.md` pour plus de détails.

## 🔧 Configuration technique

### Android

#### Fichiers de configuration
- [ ] `android/app/src/main/res/values/strings.xml` mis à jour avec "KAZAM Market"
- [ ] `android/app/src/main/res/values/colors.xml` avec les couleurs (#ea384c)
- [ ] `android/app/src/main/AndroidManifest.xml` avec toutes les permissions
- [ ] `android/app/build.gradle` avec version correcte (1.0.0)
- [ ] `google-services.json` dans `android/app/`

#### Permissions Android vérifiées
- [ ] INTERNET
- [ ] ACCESS_NETWORK_STATE
- [ ] CAMERA
- [ ] READ_EXTERNAL_STORAGE
- [ ] WRITE_EXTERNAL_STORAGE
- [ ] ACCESS_FINE_LOCATION
- [ ] ACCESS_COARSE_LOCATION
- [ ] POST_NOTIFICATIONS

#### Firebase (pour notifications)
- [ ] Plugin Google Services dans `build.gradle`
- [ ] Dépendances Firebase ajoutées
- [ ] Configuration FCM testée

### iOS

#### Fichiers de configuration
- [ ] `ios/App/App/Info.plist` avec tous les NSUsageDescription
- [ ] Display Name défini sur "KAZAM Market"
- [ ] Bundle Identifier : app.lovable.fdde6a57c0ea45b0bd6d4e42d3d22471
- [ ] Version : 1.0.0, Build : 1

#### Permissions iOS vérifiées
- [ ] NSCameraUsageDescription
- [ ] NSPhotoLibraryUsageDescription
- [ ] NSLocationWhenInUseUsageDescription
- [ ] NSFaceIDUsageDescription

#### Profils et certificats
- [ ] Certificat de distribution créé sur developer.apple.com
- [ ] Profil de provisioning créé
- [ ] Téléchargés et installés dans Xcode

## 🏗️ Build de production

### Build Android (AAB)

```bash
# 1. Build du projet web
npm run build

# 2. Sync avec Capacitor
npx cap sync android

# 3. Ouvrir dans Android Studio
npx cap open android
```

Dans Android Studio :
- [ ] Build → Generate Signed Bundle / APK
- [ ] Sélectionner "Android App Bundle"
- [ ] Créer ou sélectionner keystore (GARDER PRÉCIEUSEMENT !)
- [ ] Build → .aab généré dans `android/app/release/`
- [ ] Fichier .aab sauvegardé (djassa-release-1.0.0.aab)

**IMPORTANT** : Sauvegardez votre keystore et son mot de passe en lieu sûr !

### Build iOS (Archive)

```bash
# 1. Build du projet web
npm run build

# 2. Sync avec Capacitor
npx cap sync ios

# 3. Ouvrir dans Xcode
npx cap open ios
```

Dans Xcode :
- [ ] Sélectionner "Any iOS Device (arm64)"
- [ ] Product → Archive
- [ ] Window → Organizer → Archives
- [ ] Distribute App → App Store Connect
- [ ] Archive uploadé avec succès

## 📝 Informations pour les stores

### Métadonnées communes

**Nom de l'app**
- Nom : DJASSA
- Sous-titre iOS (30 char max) : Marketplace seconde main
- Description courte Android (80 char max) : Achetez et vendez facilement en Afrique de l'Ouest

**Description complète** (Voir ci-dessous pour le texte complet)

**Catégories**
- Primaire : Shopping
- Secondaire : Style de vie / Lifestyle

**Mots-clés** (pour recherche)
- iOS : marketplace, occasion, annonces, afrique, vendre, acheter, seconde main
- Android : Tags similaires

**Contact**
- Email support : support@djassamarket.com
- Site web : https://djassamarket.com (ou votre URL Lovable)
- Politique de confidentialité : (URL vers votre politique)

### Description de l'app

```
DJASSA - Le marketplace de l'économie circulaire en Afrique de l'Ouest

🌍 DJASSA vous permet d'acheter et de vendre facilement des articles de seconde main dans toute l'Afrique de l'Ouest.

✨ FONCTIONNALITÉS PRINCIPALES

📸 Publication simple
• Prenez des photos directement dans l'app
• Ajoutez une description détaillée
• Fixez votre prix
• Publiez en quelques secondes

🔍 Recherche puissante
• Parcourez des milliers d'annonces
• Filtrez par catégorie, prix, localisation
• Trouvez exactement ce que vous cherchez
• Notifications pour les nouvelles annonces

💬 Messagerie intégrée
• Contactez directement les vendeurs
• Négociez les prix en toute sécurité
• Partagez votre localisation pour la rencontre
• Historique de vos conversations

🏆 Confiance et sécurité
• Profils vérifiés
• Système d'évaluation
• Badges de confiance
• Modération des annonces

🌍 Couverture régionale
• Disponible dans tous les pays d'Afrique de l'Ouest
• Support multi-devises (FCFA, GHS, NGN, etc.)
• Interface en français
• Géolocalisation pour trouver des articles près de chez vous

📱 Catégories variées
• Électronique & High-tech
• Mode & Vêtements
• Maison & Décoration
• Auto & Moto
• Loisirs & Sports
• Et bien plus encore !

💡 POURQUOI CHOISIR DJASSA ?

✓ Gratuit à télécharger et à utiliser
✓ Pas de frais cachés
✓ Interface simple et intuitive
✓ Transactions directes entre particuliers
✓ Support client réactif
✓ Mises à jour régulières

🌱 ENGAGÉS POUR L'ÉCONOMIE CIRCULAIRE

Donnez une seconde vie à vos articles et contribuez à une consommation plus responsable. Avec DJASSA, chaque objet trouve un nouveau propriétaire.

📞 SUPPORT

Besoin d'aide ? Notre équipe est là pour vous.
Email : support@djassamarket.com

Téléchargez DJASSA maintenant et rejoignez la communauté du marketplace circulaire !
```

### Informations légales

- [ ] Politique de confidentialité publiée (URL accessible)
- [ ] Conditions d'utilisation publiées (URL accessible)
- [ ] Politique de publication (pour règles du contenu)
- [ ] Contact support défini

## 🚀 Soumission sur les stores

### App Store (iOS)

**Dans App Store Connect**
- [ ] Connexion sur [App Store Connect](https://appstoreconnect.apple.com/)
- [ ] "Mes Apps" → "+" → Nouvelle app
- [ ] Plateforme : iOS
- [ ] Nom : DJASSA
- [ ] Langue principale : Français
- [ ] Bundle ID : app.lovable.fdde6a57c0ea45b0bd6d4e42d3d22471
- [ ] SKU : djassa-ios-001

**Informations de l'app**
- [ ] Captures d'écran uploadées (toutes tailles requises)
- [ ] Description uploadée
- [ ] Mots-clés ajoutés
- [ ] URL de support
- [ ] URL de politique de confidentialité
- [ ] Icône 1024x1024 uploadée
- [ ] Catégorie sélectionnée

**Versions et build**
- [ ] Sélectionner le build uploadé depuis Xcode
- [ ] Numéro de version : 1.0.0
- [ ] Copyright : © 2025 DJASSA

**Review Information**
- [ ] Contact de review (nom, email, téléphone)
- [ ] Notes pour les reviewers (optionnel)
- [ ] Compte de démo si nécessaire

**Pricing and Availability**
- [ ] Prix : Gratuit
- [ ] Disponibilité : Tous les pays ou sélection
- [ ] Date de publication : Automatique ou manuelle

**Soumission finale**
- [ ] Bouton "Submit for Review" cliqué
- [ ] Confirmation reçue par email

### Play Store (Android)

**Dans Google Play Console**
- [ ] Connexion sur [Play Console](https://play.google.com/console/)
- [ ] "Créer une application"
- [ ] Nom : DJASSA
- [ ] Langue par défaut : Français (France)
- [ ] Type : Application
- [ ] Gratuit/Payant : Gratuit

**Fiche du Play Store**
- [ ] Description courte (80 caractères)
- [ ] Description complète (jusqu'à 4000 caractères)
- [ ] Captures d'écran phone uploadées (min 2)
- [ ] Feature Graphic uploadé (1024x500)
- [ ] Icône 512x512 uploadée
- [ ] Catégorie : Shopping
- [ ] Tags : marketplace, occasion, etc.
- [ ] Coordonnées (email, site, téléphone)
- [ ] Politique de confidentialité (URL)

**Configuration de l'app**
- [ ] Package name : app.lovable.fdde6a57c0ea45b0bd6d4e42d3d22471
- [ ] Classification du contenu (questionnaire)
- [ ] Public cible et contenu (âge)
- [ ] Pays de distribution sélectionnés

**Release de production**
- [ ] "Releases" → "Production"
- [ ] "Create new release"
- [ ] Upload du fichier .aab
- [ ] Notes de version (français)
- [ ] Nom de la release : v1.0.0

**Tarification et distribution**
- [ ] Gratuit
- [ ] Pays disponibles sélectionnés
- [ ] Contient des publicités : Non (ajuster si applicable)
- [ ] Achats intégrés : Non

**Soumission finale**
- [ ] Vérifier toutes les sections (coche verte)
- [ ] "Envoyer pour examen"
- [ ] Confirmation reçue

## 🕐 Délais d'approbation

- **iOS** : 24-48 heures en moyenne (peut aller jusqu'à 7 jours)
- **Android** : Quelques heures à 3 jours

## 🎉 Après approbation

### iOS
- [ ] App visible sur l'App Store
- [ ] Lien de téléchargement récupéré
- [ ] Badge "Télécharger sur l'App Store" ajouté au site web
- [ ] Partage sur les réseaux sociaux

### Android
- [ ] App visible sur le Play Store
- [ ] Lien de téléchargement récupéré  
- [ ] Badge "Disponible sur Google Play" ajouté au site web
- [ ] Partage sur les réseaux sociaux

## 📊 Suivi post-lancement

### Métriques à surveiller
- [ ] Nombre de téléchargements
- [ ] Évaluations et avis
- [ ] Taux de crash
- [ ] Temps d'utilisation moyen
- [ ] Taux de rétention

### Actions recommandées
- [ ] Répondre aux avis utilisateurs
- [ ] Monitorer les rapports de crash
- [ ] Préparer les mises à jour
- [ ] Suivre les KPIs
- [ ] Collecter les feedbacks

## 🔄 Mises à jour futures

Pour les prochaines versions :
1. Incrémenter la version dans `capacitor.config.ts`
2. Rebuild : `npm run build`
3. Sync : `npx cap sync`
4. Créer nouveau build/archive
5. Soumettre la mise à jour sur les stores

**iOS** : Incrémenter le Build number à chaque soumission
**Android** : Incrémenter versionCode dans build.gradle

## 📚 Ressources utiles

- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Play Console Help](https://support.google.com/googleplay/android-developer/)

## 💡 Conseils finaux

✅ **Testez tout avant de soumettre** : Aucun crash, toutes les fonctionnalités marchent
✅ **Préparez-vous aux rejets** : C'est normal, lisez attentivement les motifs
✅ **Soyez réactifs** : Répondez vite aux demandes des reviewers
✅ **Documentation** : Gardez tous vos mots de passe et keystores en sécurité
✅ **Communication** : Préparez votre plan de lancement marketing

---

Bonne chance pour la soumission de DJASSA ! 🚀
