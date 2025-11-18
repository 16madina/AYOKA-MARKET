# Configuration des Notifications Push Firebase

## ✅ Ce qui est déjà fait

L'infrastructure Firebase Cloud Messaging (FCM) est déjà en place :

1. **Hook Frontend** (`src/hooks/usePushNotifications.ts`)
   - Demande les permissions de notifications
   - Enregistre le token FCM dans la base de données
   - Gère la réception et l'affichage des notifications

2. **Edge Functions**
   - `send-push-notification`: Envoie les notifications via Firebase
   - `notify-new-message`: Déclenché lors d'un nouveau message
   - `notify-new-review`: Déclenché lors d'un nouvel avis
   - `notify-new-follower`: Déclenché lors d'un nouvel abonné

3. **Configuration Firebase**
   - Le secret `FIREBASE_SERVICE_ACCOUNT` est déjà configuré
   - Le fichier `google-services.json` est présent pour Android

4. **Triggers de Base de Données**
   - Des triggers automatiques sont configurés pour créer des notifications système
   - Des triggers webhook sont prêts à appeler les edge functions

## 📱 Fonctionnement

Quand un événement se produit (message, avis, abonné) :

1. Le trigger SQL crée une notification dans la table `system_notifications`
2. Le trigger webhook appelle l'edge function correspondante
3. L'edge function :
   - Récupère le token FCM de l'utilisateur
   - Appelle Firebase Cloud Messaging
   - Envoie la notification push au device

4. L'application mobile :
   - Reçoit la notification
   - L'affiche même si l'app est fermée
   - Redirige vers la bonne page au clic

## 🔧 Configuration Requise dans Lovable Cloud

Les webhooks de base de données nécessitent que les URLs des edge functions soient accessibles. Les triggers utilisent l'extension `pg_net` pour faire des appels HTTP asynchrones.

Si les notifications push ne fonctionnent pas automatiquement, vous pouvez configurer manuellement les Database Webhooks dans Lovable Cloud :

1. Ouvrez votre backend Lovable Cloud
2. Allez dans Database → Webhooks
3. Créez 3 webhooks :

### Webhook 1 : Messages
- **Table** : messages
- **Events** : INSERT
- **Type** : HTTP Request
- **Method** : POST
- **URL** : `https://lczzyelucnfvkicwdbbe.supabase.co/functions/v1/notify-new-message`
- **Headers** : 
  ```
  Content-Type: application/json
  Authorization: Bearer [VOTRE_SERVICE_ROLE_KEY]
  ```

### Webhook 2 : Reviews
- **Table** : reviews
- **Events** : INSERT
- **Type** : HTTP Request
- **Method** : POST
- **URL** : `https://lczzyelucnfvkicwdbbe.supabase.co/functions/v1/notify-new-review`
- **Headers** : 
  ```
  Content-Type: application/json
  Authorization: Bearer [VOTRE_SERVICE_ROLE_KEY]
  ```

### Webhook 3 : Followers
- **Table** : followers
- **Events** : INSERT
- **Type** : HTTP Request
- **Method** : POST
- **URL** : `https://lczzyelucnfvkicwdbbe.supabase.co/functions/v1/notify-new-follower`
- **Headers** : 
  ```
  Content-Type: application/json
  Authorization: Bearer [VOTRE_SERVICE_ROLE_KEY]
  ```

## 📲 Test sur Mobile

### Android
1. Exportez le projet vers GitHub
2. Clonez le projet localement
3. Installez les dépendances : `npm install`
4. Ajoutez la plateforme Android : `npx cap add android`
5. Synchronisez : `npx cap sync`
6. Ouvrez dans Android Studio : `npx cap open android`
7. Lancez l'app sur un appareil ou émulateur

### iOS
1. Exportez le projet vers GitHub
2. Clonez le projet localement
3. Installez les dépendances : `npm install`
4. Ajoutez la plateforme iOS : `npx cap add ios`
5. Synchronisez : `npx cap sync`
6. Ouvrez dans Xcode : `npx cap open ios`
7. Configurez les Push Notifications dans Xcode :
   - Capabilities → Push Notifications → ON
   - Ajoutez votre certificat APNs
8. Lancez l'app sur un appareil iOS (les notifications ne fonctionnent pas sur le simulateur)

## 🔍 Debug

Pour vérifier si les notifications sont envoyées :

1. Consultez les logs des edge functions dans Lovable Cloud
2. Vérifiez que le `push_token` est enregistré dans la table `profiles`
3. Testez manuellement l'envoi avec :
   ```javascript
   await supabase.functions.invoke('send-push-notification', {
     body: {
       userId: 'USER_ID',
       title: 'Test',
       body: 'Test notification',
       data: {}
     }
   })
   ```

## 📚 Ressources

- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Lovable Mobile Development](https://docs.lovable.dev/features/mobile-apps)
