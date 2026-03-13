
# Plan : Correction des problèmes de devise et de tri géographique

## Contexte des problèmes

### Problème 1 : Devises incorrectes sur les annonces de Guinée
**Diagnostic** : 2 annonces à Conakry ont été publiées avec `FCFA` au lieu de `GNF` parce que le profil n'était pas encore chargé lors de la soumission du formulaire.

**Annonces concernées** :
- "Ensemble Sac et bob (personnalisation possible)"
- "Sac à Sacs à Dos Ocre & Pétales (Jaune Moutarde)"

### Problème 2 : Tri géographique incohérent
**Diagnostic** : Le tri fonctionne correctement selon les logs. Les logs console montrent que le testeur actuel est localisé au **Canada** (Longueuil), ce qui explique pourquoi toutes les annonces sont classées comme "other".

Pour l'utilisatrice "Madina Admin Diallo" en Côte d'Ivoire, il faut vérifier que son profil a bien les champs `city` et `country` correctement remplis.

---

## Actions à effectuer

### Étape 1 : Corriger les devises des annonces existantes (Base de données)

Mettre à jour les 2 annonces de Guinée avec la bonne devise :

```sql
UPDATE public.listings l
SET currency = p.currency
FROM public.profiles p
WHERE p.id = l.user_id 
  AND p.country = 'Guinée' 
  AND p.currency = 'GNF' 
  AND l.currency = 'FCFA';
```

### Étape 2 : Renforcer la logique de publication (Code)

Modifier `src/pages/Publish.tsx` pour :
1. **Attendre que le profil soit complètement chargé** avant de permettre la soumission
2. **Afficher une erreur** si la devise du profil n'est pas disponible au lieu de prendre FCFA par défaut

**Changements dans le code** :
- Ajouter une validation qui vérifie `profile?.currency` avant la soumission
- Afficher un message si le profil n'est pas encore chargé

### Étape 3 : Vérifier le profil de l'utilisatrice Madina

Il faut trouver son profil dans la base de données pour s'assurer que ses champs `city` et `country` sont correctement remplis. Si son profil a été créé avant le trigger de synchronisation, elle devra peut-être mettre à jour sa localisation manuellement dans les paramètres du compte.

---

## Résumé des fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| Base de données | Mise à jour des devises pour les annonces Guinée avec FCFA → GNF |
| `src/pages/Publish.tsx` | Ajout d'une validation pour s'assurer que le profil est chargé avant publication |

---

## Résultat attendu

1. ✅ Les annonces de Guinée afficheront le prix en **GNF** avec la conversion **≈ X FCFA** à côté
2. ✅ Les nouvelles publications utiliseront toujours la devise correcte du profil
3. ✅ Le tri géographique fonctionnera correctement pour les utilisateurs avec localisation valide

