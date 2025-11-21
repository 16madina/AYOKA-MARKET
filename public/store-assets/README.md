# Captures d'écran et visuels pour les stores

## 📸 Images générées

Ce dossier contient les captures d'écran et visuels promotionnels pour DJASSA :

### Captures d'écran disponibles

1. **screenshot-home.jpg** - Écran d'accueil avec catégories et annonces récentes
2. **screenshot-listings.jpg** - Liste d'annonces avec filtres
3. **screenshot-detail.jpg** - Détail d'une annonce
4. **screenshot-publish.jpg** - Création d'annonce
5. **screenshot-messages.jpg** - Messagerie avec négociation
6. **screenshot-profile.jpg** - Profil utilisateur avec statistiques
7. **android-screenshot-01-home.jpg** - Version Android de l'accueil
8. **android-screenshot-02-listings.jpg** - Version Android des listings
9. **play-store-feature-graphic.jpg** - Bannière horizontale pour Play Store

## 📐 Redimensionnement nécessaire

Les images générées sont en résolution **1080x1920** (limite de l'outil). Vous devez les redimensionner :

### Pour iOS App Store
**Dimensions requises : 1290 x 2796 pixels (iPhone 6.7")**

Utilisez un outil comme :
- [Figma](https://www.figma.com/) - Professionnel
- [Canva](https://www.canva.com/) - Facile
- Photoshop / GIMP

**Étapes :**
1. Ouvrez l'image dans votre outil
2. Créez un artboard de 1290 x 2796 px
3. Centrez et redimensionnez l'image (étirer légèrement)
4. Exportez en PNG ou JPEG (max 500 KB)

### Pour Android Play Store
**Dimensions recommandées : 1080 x 2340 pixels**

Les images générées sont déjà à la bonne largeur (1080). Il suffit d'ajouter 420 pixels de hauteur :
1. Ajoutez un fond blanc/bleu en haut ou en bas
2. Ou recadrez légèrement pour ajuster

Le **feature graphic** (1024x512) est aux bonnes dimensions ✅

## 🎯 Organisation par Store

### App Store (iOS)
Utilisez les 6 captures principales redimensionnées :
1. screenshot-home.jpg → 1290x2796
2. screenshot-listings.jpg → 1290x2796
3. screenshot-detail.jpg → 1290x2796
4. screenshot-publish.jpg → 1290x2796
5. screenshot-messages.jpg → 1290x2796
6. screenshot-profile.jpg → 1290x2796

### Play Store (Android)
Minimum 2 captures :
1. android-screenshot-01-home.jpg → 1080x2340
2. android-screenshot-02-listings.jpg → 1080x2340

**+ Feature Graphic obligatoire :**
- play-store-feature-graphic.jpg (1024x512) ✅ Prêt

## 🛠️ Outils recommandés

### Redimensionnement rapide
- [Figma](https://www.figma.com/) - Gratuit, professionnel
- [Canva](https://www.canva.com/) - Facile, templates
- [Photopea](https://www.photopea.com/) - Photoshop en ligne gratuit

### Ajout de cadres (mockups)
- [Previewed](https://previewed.app/) - Mockups de devices
- [Shots.so](https://shots.so/) - Frames minimalistes
- [Screenshot.rocks](https://screenshot.rocks/) - Rapide

### Optimisation
- [TinyPNG](https://tinypng.com/) - Compression sans perte
- [Squoosh](https://squoosh.app/) - Contrôle avancé

## ✅ Checklist avant soumission

### iOS
- [ ] 3-10 captures en 1290x2796
- [ ] Format PNG ou JPEG, RGB
- [ ] Poids < 500 KB chacune
- [ ] Pas d'informations personnelles sensibles
- [ ] Interface en français
- [ ] Ordre logique (accueil → features → profil)

### Android
- [ ] Minimum 2 captures en 1080x1920 ou 1080x2340
- [ ] Feature Graphic 1024x500 ✅
- [ ] Format PNG ou JPEG, 24-bit RGB
- [ ] Poids < 8 MB chacune
- [ ] Contenu récent et représentatif

## 💡 Conseils

1. **Cohérence** : Gardez le même style pour toutes les captures
2. **Contenu réaliste** : Les images montrent déjà du contenu africain authentique
3. **Ordre** : Commencez par l'accueil, puis les features principales
4. **Qualité** : Ne surdimensionnez pas, gardez la netteté
5. **Test** : Prévisualisez sur mobile avant soumission

## 📚 Documentation complète

Pour plus de détails, consultez :
- `APP_STORE_SETUP.md` - Configuration complète iOS & Android
- `resources/screenshot-guide.md` - Guide détaillé des captures
- `STORE_SUBMISSION_CHECKLIST.md` - Checklist de soumission

---

**Note** : Les images générées sont des mockups AI. Pour de meilleurs résultats, prenez des captures d'écran réelles de votre app via :
- iOS : Simulateur Xcode (Cmd+S)
- Android : Émulateur Android Studio (bouton caméra)
