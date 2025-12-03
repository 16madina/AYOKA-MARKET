# Configuration Firebase Cloud Messaging pour Android

Ce guide vous aide à configurer Firebase Cloud Messaging (FCM) pour recevoir des notifications push dans votre application AYOKA MARKET.

## Prérequis

- Avoir créé un projet Firebase et ajouté votre application Android
- Avoir téléchargé le fichier `google-services.json` (déjà fourni dans le projet)
- Avoir exécuté `npx cap add android` pour créer le dossier Android natif

## Étapes de configuration

### 1. Placer le fichier google-services.json

Le fichier `google-services.json` se trouve à la racine du projet. Vous devez le déplacer dans le dossier Android:

```bash
# Après avoir exécuté npx cap add android
cp google-services.json android/app/google-services.json
```

### 2. Modifier android/build.gradle

Ouvrez le fichier `android/build.gradle` et ajoutez le plugin Google Services dans la section `dependencies` du bloc `buildscript`:

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.1'
        classpath 'com.google.gms:google-services:4.4.0'  // Ajoutez cette ligne
    }
}
```

### 3. Modifier android/app/build.gradle

Ouvrez le fichier `android/app/build.gradle` et:

1. Ajoutez le plugin à la fin du fichier:

```gradle
apply plugin: 'com.google.gms.google-services'
```

2. Ajoutez les dépendances Firebase dans la section `dependencies`:

```gradle
dependencies {
    // ... autres dépendances existantes
    
    // Firebase Cloud Messaging
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
    implementation 'com.google.firebase:firebase-analytics'
}
```

### 4. Configurer les permissions Android

Les permissions pour les notifications sont déjà configurées dans `capacitor.config.ts`, mais vérifiez que `android/app/src/main/AndroidManifest.xml` contient:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.INTERNET" />
```

### 5. Synchroniser le projet

Après avoir effectué ces modifications:

```bash
# Construire le projet
npm run build

# Synchroniser avec Capacitor
npx cap sync android

# Ouvrir dans Android Studio pour vérifier
npx cap open android
```

## Configuration Firebase Console

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet "bazaram-321cc" (AYOKA MARKET)
3. Dans le menu latéral, cliquez sur **Cloud Messaging**
4. Notez votre **Server Key** (clé serveur) - vous en aurez besoin pour envoyer des notifications depuis votre backend

## Envoyer des notifications depuis le backend

Une edge function `send-push-notification` est déjà configurée et prête à l'emploi. Elle utilise Firebase Admin SDK pour envoyer des notifications.

### Utilisation de l'edge function

L'edge function accepte les paramètres suivants:

```typescript
{
  userId: string;      // ID de l'utilisateur à notifier
  title: string;       // Titre de la notification
  body: string;        // Corps de la notification
  data?: {             // Données supplémentaires (optionnel)
    [key: string]: string;
  }
}
```

### Exemple d'utilisation depuis votre code

```typescript
import { supabase } from "@/integrations/supabase/client";

// Envoyer une notification à un utilisateur
const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    userId: 'user-uuid-here',
    title: 'Nouveau message',
    body: 'Vous avez reçu un nouveau message de Jean',
    data: {
      type: 'message',
      conversationId: 'conversation-uuid',
    }
  }
});

if (error) {
  console.error('Erreur envoi notification:', error);
} else {
  console.log('Notification envoyée:', data);
}
```

### Exemples de cas d'usage

**1. Notification de nouveau message:**
```typescript
await supabase.functions.invoke('send-push-notification', {
  body: {
    userId: receiverId,
    title: 'Nouveau message',
    body: `${senderName} vous a envoyé un message`,
    data: {
      type: 'message',
      conversationId: conversationId,
    }
  }
});
```

**2. Notification d'offre acceptée:**
```typescript
await supabase.functions.invoke('send-push-notification', {
  body: {
    userId: buyerId,
    title: 'Offre acceptée',
    body: 'Votre offre a été acceptée par le vendeur',
    data: {
      type: 'offer_accepted',
      listingId: listingId,
    }
  }
});
```

**3. Notification de nouvelle annonce favorite:**
```typescript
await supabase.functions.invoke('send-push-notification', {
  body: {
    userId: followerId,
    title: 'Nouvelle annonce',
    body: `${sellerName} a publié une nouvelle annonce`,
    data: {
      type: 'new_listing',
      listingId: listingId,
    }
  }
});
```

## Test sur appareil physique

Les notifications push ne fonctionnent que sur un appareil physique, pas sur l'émulateur:

```bash
# Construire et déployer sur un appareil Android connecté
npx cap run android
```

## Vérification

Pour vérifier que tout fonctionne:

1. Lancez l'application sur un appareil physique
2. Connectez-vous à votre compte
3. L'application demandera automatiquement la permission pour les notifications
4. Le `push_token` sera enregistré dans la table `profiles`
5. Vous pouvez tester en envoyant une notification depuis Firebase Console (Cloud Messaging > Nouvelle campagne)

## Dépannage

### L'application ne demande pas la permission pour les notifications

- Vérifiez que vous êtes sur un appareil physique
- Désinstallez et réinstallez l'application
- Vérifiez les logs Android Studio pour les erreurs

### Le token n'est pas enregistré

- Vérifiez que l'utilisateur est bien connecté
- Vérifiez les logs dans la console
- Assurez-vous que `google-services.json` est bien placé dans `android/app/`

### Les notifications ne sont pas reçues

- Vérifiez que le token est bien enregistré dans la base de données
- Testez d'abord avec l'interface Firebase Console (Cloud Messaging)
- Vérifiez les logs Firebase pour les erreurs d'envoi

## Ressources

- [Documentation Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Documentation Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Guide Firebase pour Android](https://firebase.google.com/docs/android/setup)
