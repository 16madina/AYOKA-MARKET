# Guide de Traduction / Translation Guide

## 📖 Introduction

Cette application supporte le **français** et l'**anglais**. Le système de traduction permet aux utilisateurs de changer la langue dans les paramètres, et toute l'interface s'adapte automatiquement.

This application supports **French** and **English**. The translation system allows users to change the language in settings, and the entire interface adapts automatically.

---

## 🚀 Comment utiliser le système de traduction / How to use the translation system

### 1. Importer le hook `useLanguage`

```typescript
import { useLanguage } from "@/contexts/LanguageContext";
```

### 2. Utiliser le hook dans votre composant

```typescript
const MyComponent = () => {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
    </div>
  );
};
```

### 3. Fonctions disponibles / Available functions

- **`t(key: string)`**: Traduit une clé en fonction de la langue actuelle
- **`language`**: Retourne la langue actuelle ('fr' ou 'en')
- **`setLanguage(lang: 'fr' | 'en')`**: Change la langue de l'application

---

## 📝 Ajouter de nouvelles traductions / Adding new translations

### Étape 1: Ouvrir le fichier de traduction
Open the translation file: `src/contexts/LanguageContext.tsx`

### Étape 2: Ajouter votre clé dans les deux langues

```typescript
const translations: Record<Language, Record<string, string>> = {
  fr: {
    // ... existing translations
    "my.new.key": "Mon nouveau texte",
  },
  en: {
    // ... existing translations
    "my.new.key": "My new text",
  }
};
```

### Étape 3: Utiliser la traduction dans votre composant

```typescript
const { t } = useLanguage();

return <p>{t('my.new.key')}</p>;
```

---

## 🗂️ Organisation des clés / Key organization

Les clés sont organisées par sections:

```
nav.*          - Navigation (accueil, catégories, profil, etc.)
hero.*         - Section hero de la page d'accueil
listings.*     - Annonces et listings
condition.*    - États des articles (neuf, bon état, etc.)
publish.*      - Formulaire de publication
search.*       - Recherche et filtres
messages.*     - Messagerie
profile.*      - Profil utilisateur
settings.*     - Paramètres
auth.*         - Authentification
common.*       - Éléments communs (boutons, états, etc.)
```

---

## 💡 Exemples / Examples

### Exemple 1: Traduction simple / Simple translation

```typescript
const { t } = useLanguage();

return <button>{t('common.save')}</button>;
```

### Exemple 2: Traduction avec condition / Translation with condition

```typescript
import { useLanguage } from "@/contexts/LanguageContext";
import { translateCondition } from "@/utils/translations";

const { language } = useLanguage();

// Traduire l'état d'un article
const conditionText = translateCondition("good", language);
// FR: "Bon état"
// EN: "Good"
```

### Exemple 3: Changer la langue / Changing language

```typescript
const { setLanguage } = useLanguage();

const handleLanguageChange = (lang: "fr" | "en") => {
  setLanguage(lang);
  toast.success(
    lang === "fr" 
      ? "Langue changée en Français" 
      : "Language changed to English"
  );
};
```

---

## 🔧 Fonctions utilitaires / Utility functions

### `translateCondition(condition, language)`

Fonction spéciale pour traduire les conditions des articles:

```typescript
import { translateCondition } from "@/utils/translations";

const translated = translateCondition("like_new", "en");
// Returns: "Like New"
```

---

## ✅ Bonnes pratiques / Best practices

1. **Toujours utiliser des clés descriptives**
   ```typescript
   // ✅ Bon
   t('search.no_results')
   
   // ❌ Mauvais
   t('text1')
   ```

2. **Grouper les traductions par fonctionnalité**
   ```typescript
   "publish.form.title"
   "publish.form.description"
   "publish.success"
   ```

3. **Éviter les textes hardcodés**
   ```typescript
   // ✅ Bon
   <h1>{t('hero.title')}</h1>
   
   // ❌ Mauvais
   <h1>Bienvenue sur DJASSA</h1>
   ```

4. **Tester dans les deux langues**
   - Vérifiez que votre interface fonctionne bien en français ET en anglais
   - Assurez-vous que les textes ne dépassent pas les conteneurs

---

## 🌍 Où l'utilisateur peut changer la langue / Where users can change language

Les utilisateurs peuvent changer la langue dans:
- **Paramètres** → **Paramètres régionaux** → **Langue**
- Settings → Regional Settings → Language

La préférence est automatiquement sauvegardée:
- Dans le profil utilisateur (si connecté)
- Dans le localStorage (si non connecté)

---

## 📱 Support mobile

Le système de traduction fonctionne de manière identique sur mobile et desktop.

The translation system works identically on mobile and desktop.

---

## 🆘 Besoin d'aide? / Need help?

Si une traduction manque, elle affichera simplement la clé. Par exemple:
- `{t('missing.key')}` affichera `"missing.key"`

Ajoutez simplement la traduction dans le fichier `LanguageContext.tsx` pour résoudre le problème.
