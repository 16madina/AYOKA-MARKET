# Guide des captures d'écran pour les stores

## 📸 Vue d'ensemble

Les captures d'écran sont cruciales pour la conversion. Elles sont souvent le premier contact visuel avec votre app.

## 🍎 App Store (iOS)

### Tailles requises (Obligatoires)

**iPhone 6.7" (iPhone 14 Pro Max, 15 Plus, 15 Pro Max)**
- Résolution : 1290 x 2796 pixels
- Minimum : 3 captures
- Maximum : 10 captures
- **C'EST LA TAILLE PRINCIPALE - OBLIGATOIRE**

**iPhone 6.5" (iPhone 11 Pro Max, XS Max)**
- Résolution : 1242 x 2688 pixels
- Minimum : 3 captures
- Maximum : 10 captures

### Tailles optionnelles mais recommandées

**iPhone 5.5" (iPhone 8 Plus, 7 Plus, 6s Plus)**
- Résolution : 1242 x 2208 pixels

**iPad Pro (12.9-inch)**
- Résolution : 2048 x 2732 pixels
- Si votre app supporte iPad

### Format et spécifications
- Format : PNG ou JPEG
- Colorimétrie : RVB
- Pas de transparence (alpha channel)
- Poids maximum : 500 KB par image

### Ordre d'importance
1. **Écran d'accueil** : Première impression
2. **Fonctionnalité principale** : Ce qui rend votre app unique
3. **Création d'annonce** : Montrez comment publier
4. **Navigation** : Parcourir les annonces
5. **Messagerie** : Communication acheteur-vendeur
6. **Profil** : Gestion du compte

## 🤖 Play Store (Android)

### Tailles requises

**Phone (Portrait)**
- Résolution minimum : 320 pixels
- Résolution maximum : 3840 pixels
- Recommandé : 1080 x 1920 ou 1080 x 2340
- Minimum : 2 captures
- Maximum : 8 captures
- **OBLIGATOIRE**

**7-inch Tablet (Optionnel)**
- Résolution : 1200 x 1920 pixels

**10-inch Tablet (Optionnel)**
- Résolution : 1600 x 2560 pixels

### Format et spécifications
- Format : PNG ou JPEG
- 24-bit RGB (pas de transparence)
- Poids maximum : 8 MB par image
- Ratio : 16:9 ou 9:16

### Feature Graphic (OBLIGATOIRE)
- Dimensions : 1024 x 500 pixels exactement
- Format : PNG ou JPEG
- 24-bit RGB
- Utilisé en haut de votre fiche store

## 🎨 Meilleures pratiques pour DJASSA

### Structure d'une bonne capture

```
┌─────────────────────┐
│   [Status Bar]      │  ← Gardez la barre de statut pour le réalisme
├─────────────────────┤
│                     │
│   Contenu de        │
│   l'écran réel      │  ← Screenshot authentique de l'app
│                     │
│                     │
├─────────────────────┤
│   [Nav Bar]         │  ← Navigation visible
└─────────────────────┘
```

### Captures essentielles pour DJASSA

1. **Écran d'accueil** 
   - Grille de catégories visible
   - Annonces récentes affichées
   - Barre de recherche bien visible

2. **Liste d'annonces**
   - Plusieurs annonces avec photos
   - Prix et localisation visibles
   - Interface claire et aérée

3. **Détail d'une annonce**
   - Grande photo de qualité
   - Description complète
   - Bouton de contact clair
   - Profil du vendeur

4. **Publication d'annonce**
   - Formulaire simple et clair
   - Upload de photos
   - Sélection de catégorie

5. **Messagerie**
   - Conversation fluide
   - Interface moderne
   - Options de négociation

6. **Profil utilisateur**
   - Avatar et infos
   - Annonces publiées
   - Badges de confiance

### Conseils de design

**À FAIRE** ✅
- Utilisez du contenu réaliste (pas de "Lorem Ipsum")
- Montrez des photos attrayantes d'articles
- Utilisez des prix crédibles en FCFA
- Incluez des noms africains authentiques
- Montrez la localisation (Dakar, Abidjan, etc.)
- Mettez en valeur les fonctionnalités uniques
- Gardez une cohérence visuelle entre captures
- Utilisez votre vraie interface (pas de mockups)

**À ÉVITER** ❌
- Screenshots flous ou pixelisés
- Contenu inapproprié ou offensant
- Texte trop petit pour être lu
- Captures identiques ou redondantes
- Interface datée ou non finalisée
- Barres d'outils de développement visibles
- Données personnelles réelles

## 🛠️ Outils pour créer les captures

### Simulateurs et émulateurs

**iOS**
```bash
# Lancer le simulateur
npx cap run ios

# Captures via : Cmd + S dans le simulateur
# Ou : Capture > Save Screen dans le menu
```

**Android**
```bash
# Lancer l'émulateur
npx cap run android

# Captures via : Bouton caméra dans l'émulateur
# Ou : Via Android Studio > Logcat > Camera icon
```

### Outils de traitement

**Redimensionnement et cadrage**
- [Figma](https://www.figma.com/) - Professionnel et gratuit
- [Canva](https://www.canva.com/) - Templates prêts à l'emploi
- [Sketch](https://www.sketch.com/) - Pour Mac uniquement

**Frames et mockups**
- [Previewed](https://previewed.app/) - Mockups de devices
- [Shots](https://shots.so/) - Frames minimalistes
- [Screenshot.rocks](https://screenshot.rocks/) - Rapide et simple

**Optimisation**
- [TinyPNG](https://tinypng.com/) - Compression sans perte
- [Squoosh](https://squoosh.app/) - Contrôle avancé

## 📐 Template Figma pour DJASSA

Créez un template avec ces artboards :

```
iPhone 6.7" (1290 x 2796)
├── 01-home-screen
├── 02-category-listings
├── 03-listing-detail
├── 04-create-listing
├── 05-messages
└── 06-user-profile

Android Phone (1080 x 2340)
├── 01-home-screen
├── 02-category-listings
├── 03-listing-detail
├── 04-create-listing
├── 05-messages
└── 06-user-profile
```

## ✅ Checklist avant soumission

### iOS
- [ ] Minimum 3 captures en 1290x2796 (iPhone 6.7")
- [ ] Format PNG ou JPEG, RGB, pas de transparence
- [ ] Contenu approprié et professionnel
- [ ] Pas d'informations personnelles sensibles
- [ ] Captures dans le bon ordre (de l'accueil vers les features)
- [ ] Texte lisible même sur petit écran
- [ ] Interface en français (marché cible)

### Android
- [ ] Minimum 2 captures en 1080x1920 ou 1080x2340
- [ ] Feature Graphic 1024x500 créé
- [ ] Format PNG ou JPEG, 24-bit RGB
- [ ] Poids inférieur à 8 MB par capture
- [ ] Pas de contenu trompeur
- [ ] Screenshots récents (dernière version de l'app)

## 🎯 Feature Graphic pour Play Store

Le Feature Graphic apparaît en haut de votre fiche Play Store.

### Spécifications
- Dimensions : **1024 x 500 pixels (exact)**
- Format : PNG ou JPEG
- 24-bit RGB, pas de transparence
- Poids max : 8 MB

### Contenu recommandé
```
┌────────────────────────────────────────────────┐
│  [Logo DJASSA]    Marketplace de seconde vie  │
│                                                │
│  📱 Achetez & Vendez facilement               │
│     • Milliers d'annonces                     │
│     • Transactions sécurisées                 │
│     • Afrique de l'Ouest                      │
└────────────────────────────────────────────────┘
```

### Éléments à inclure
- Logo de l'app
- Tagline claire
- 2-3 points forts maximum
- Couleurs de votre marque
- Pas de captures d'écran (réservé aux screenshots)

## 📱 Tester vos captures

1. **Visualisation Play Store**
   - Utilisez [Mock-up Generator](https://www.norio.be/android-mockup-generator/)
   - Prévisualisez comment elles apparaîtront

2. **Visualisation App Store**
   - Utilisez [App Store Connect](https://appstoreconnect.apple.com/)
   - Preview dans l'interface de soumission

3. **Demander des retours**
   - Montrez à des utilisateurs cibles
   - Testez la clarté du message
   - Vérifiez l'attractivité visuelle

## 📚 Ressources supplémentaires

- [Apple Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications)
- [Google Play Store Asset Guidelines](https://support.google.com/googleplay/android-developer/answer/9866151)
- [Design Tips from Apple](https://developer.apple.com/design/human-interface-guidelines/app-icons)

## 💡 Astuce finale

Vos captures d'écran sont votre vitrine. Investissez du temps pour les rendre parfaites. C'est ce qui convaincra les utilisateurs de télécharger DJASSA !
