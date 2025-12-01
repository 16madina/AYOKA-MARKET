# Guide de test VoiceOver pour AYOKA MARKET iOS

Ce guide vous aide à tester l'accessibilité de l'app AYOKA MARKET avec VoiceOver avant la soumission à l'App Store.

## Activation de VoiceOver

### Sur iPhone/iPad physique :
1. Ouvrez **Réglages** → **Accessibilité** → **VoiceOver**
2. Activez **VoiceOver**
3. **Raccourci rapide** : Triple-clic sur le bouton latéral

### Sur simulateur Xcode :
1. **Simulateur** → **Accessibilité** → **VoiceOver** (ou cmd+F5)

## Gestes VoiceOver essentiels

- **Glisser avec 1 doigt** : Parcourir les éléments
- **Double-tap** : Activer l'élément sélectionné
- **Glisser vers la droite/gauche avec 3 doigts** : Défiler les pages
- **Double-tap avec 2 doigts** : Répondre/raccrocher
- **Tap avec 3 doigts** : Lire toute la page
- **Glisser vers le haut/bas avec 2 doigts** : Scroller

## Tests critiques pour AYOKA MARKET

### 1. Page d'accueil (/)
✅ **À vérifier :**
- [ ] Le logo AYOKA MARKET est lu comme "AYOKA MARKET"
- [ ] Le bouton thème est annoncé "Changer de thème"
- [ ] Les catégories populaires sont toutes cliquables avec leurs noms
- [ ] Les annonces récentes ont des descriptions complètes (titre, prix, localisation)
- [ ] Les images d'annonces ont des descriptions alt détaillées
- [ ] La navigation en bas est claire (Accueil, Catégories, Publier, Messages, Profil)

**Test pratique :**
```
Parcourez avec VoiceOver → Vérifiez que chaque carte d'annonce lit :
"Titre de l'annonce - Catégorie en état [condition] à [ville] pour [prix] FCFA"
```

### 2. Détail d'une annonce (/listing/:id)
✅ **À vérifier :**
- [ ] Bouton retour : "Retour"
- [ ] Bouton favori : "Ajouter aux favoris" ou "Retirer des favoris"
- [ ] Bouton signalement : "Signaler cette annonce"
- [ ] Bouton partage : "Partager cette annonce"
- [ ] Galerie d'images avec descriptions détaillées
- [ ] Bouton "Envoyer un message" clairement annoncé
- [ ] Informations du vendeur accessibles

### 3. Publier une annonce (/publish)
✅ **À vérifier :**
- [ ] Tous les champs de formulaire ont des labels clairs
- [ ] Les messages d'erreur sont lus automatiquement
- [ ] Le bouton "Publier" est accessible
- [ ] L'upload de photos annonce "Ajouter une photo"

### 4. Messages (/messages)
✅ **À vérifier :**
- [ ] Les conversations sont clairement identifiées
- [ ] Les messages non lus sont annoncés
- [ ] Le champ de saisie a un label "Écrire un message"
- [ ] Le bouton d'envoi est accessible

### 5. Profil (/profile)
✅ **À vérifier :**
- [ ] Les statistiques (ventes, abonnés) sont lues
- [ ] Les badges vendeur sont décrits
- [ ] Les boutons d'action (Éditer, Supprimer) sont tous étiquetés
- [ ] État des annonces (Disponible, Vendu) annoncé clairement

### 6. Paramètres (/settings)
✅ **À vérifier :**
- [ ] Tous les switches ont des labels clairs
- [ ] Les liens vers Conditions générales et Politique de confidentialité sont accessibles
- [ ] Le bouton de déconnexion est clairement identifié

## Tests spécifiques aux interactions

### Boutons d'action (44x44px minimum)
✅ **Vérifier que tous les boutons sont facilement sélectionnables :**
- [ ] Boutons de navigation (retour, suivant)
- [ ] Boutons favoris
- [ ] Boutons de partage
- [ ] Boutons de suppression

### Feedback haptique
⚠️ **Note** : VoiceOver ne teste pas les vibrations, mais vous devriez sentir :
- Vibration légère lors des toggles (mode sombre, switches)
- Vibration moyenne lors des ajouts aux favoris
- Vibration forte lors des suppressions

### Images
✅ **Chaque image doit avoir un alt descriptif :**
```
Exemple bon : "Canapé 3 places - Meubles en bon état à Abidjan pour 150000 FCFA"
Exemple mauvais : "product" ou "image"
```

## Points de contrôle obligatoires Apple

### Contraste des couleurs
✅ Ratio minimum **4.5:1** pour le texte normal
✅ Ratio minimum **3:1** pour le texte large (≥18pt)

**Testez visuellement :**
- Textes secondaires sur fond clair/sombre
- Badges et labels
- Textes sur images

### Dynamic Type
✅ **Test avec différentes tailles de texte :**
1. **Réglages** → **Accessibilité** → **Affichage et taille du texte** → **Taille du texte**
2. Augmentez la taille au maximum
3. Vérifiez que tout reste lisible et que l'interface ne casse pas

**Pages critiques à tester :**
- [ ] Page d'accueil (cartes d'annonces)
- [ ] Détail d'annonce
- [ ] Formulaire de publication
- [ ] Messages
- [ ] Paramètres

## Erreurs courantes à éviter

❌ **Boutons sans label** : `<button><Icon /></button>`
✅ **Correct** : `<button aria-label="Supprimer"><Icon /></button>`

❌ **Images sans alt** : `<img src="..." />`
✅ **Correct** : `<img src="..." alt="Description détaillée" />`

❌ **Texte trop petit** : `text-xs` sans support Dynamic Type
✅ **Correct** : Utiliser `rem` au lieu de `px`

❌ **Contraste insuffisant** : Texte gris clair sur fond blanc
✅ **Correct** : Contraste ≥4.5:1 (déjà corrigé dans AYOKA MARKET)

## Checklist finale avant soumission

### Accessibilité
- [ ] Tous les boutons avec icônes uniquement ont des aria-labels
- [ ] Toutes les images produits ont des alt descriptifs complets
- [ ] Les contrastes de couleurs respectent WCAG 2.1 AA
- [ ] Toutes les zones cliquables font minimum 44x44px
- [ ] Les pages /privacy et /terms sont accessibles et complètes

### VoiceOver
- [ ] Navigation complète possible sans voir l'écran
- [ ] Tous les éléments interactifs sont sélectionnables
- [ ] Les messages d'erreur/succès sont annoncés
- [ ] L'ordre de navigation est logique

### Dynamic Type
- [ ] L'app reste utilisable avec taille de texte maximale
- [ ] Aucun texte ne dépasse ou ne se chevauche
- [ ] Les cartes d'annonces s'adaptent correctement

### Haptic Feedback
- [ ] Vibrations cohérentes sur actions importantes
- [ ] Pas de vibrations excessives ou gênantes

## Ressources Apple

- [Human Interface Guidelines - Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Testing for Accessibility](https://developer.apple.com/videos/play/wwdc2019/257/)
- [VoiceOver gestures](https://support.apple.com/guide/iphone/learn-voiceover-gestures-iph3e2e2281/ios)

## Résolution de problèmes

**VoiceOver ne lit rien :**
- Vérifiez que VoiceOver est bien activé
- Redémarrez l'app
- Vérifiez les aria-labels dans le code

**Éléments ignorés par VoiceOver :**
- Vérifiez que l'élément n'a pas `aria-hidden="true"`
- Assurez-vous que l'élément est visible (opacity, display)

**Navigation confuse :**
- Vérifiez l'ordre des éléments dans le DOM
- Utilisez `tabindex` si nécessaire pour corriger l'ordre

---

**Temps estimé pour un test complet : 30-45 minutes**

⚠️ **IMPORTANT** : Effectuez ce test AVANT chaque soumission à l'App Store. Apple teste systématiquement l'accessibilité et peut rejeter l'app si elle n'est pas conforme.
