// Notification types for AYOKA MARKET

export type NotificationType = 
  | 'message'    // New message received
  | 'offer'      // Price offer received/accepted/rejected
  | 'promo'      // Promotional notification
  | 'like'       // Someone liked/favorited your listing
  | 'payment'    // Payment related notification
  | 'follower'   // New follower
  | 'review'     // New review received
  | 'listing'    // Listing status update
  | 'system';    // System notification

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    conversationId?: string;
    listingId?: string;
    userId?: string;
    offerId?: string;
    route?: string;
    [key: string]: string | undefined;
  };
}

export interface NotificationConfig {
  icon: string;
  badge: string;
  tag: string;
  color: string;
  sound: boolean;
  vibrate: boolean;
  requireInteraction: boolean;
}

export const notificationConfigs: Record<NotificationType, NotificationConfig> = {
  message: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-message',
    color: '#8B4513',
    sound: true,
    vibrate: true,
    requireInteraction: false
  },
  offer: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-offer',
    color: '#D4A574',
    sound: true,
    vibrate: true,
    requireInteraction: true
  },
  promo: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-promo',
    color: '#FFD700',
    sound: true,
    vibrate: false,
    requireInteraction: false
  },
  like: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-like',
    color: '#FF6B6B',
    sound: false,
    vibrate: true,
    requireInteraction: false
  },
  payment: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-payment',
    color: '#4CAF50',
    sound: true,
    vibrate: true,
    requireInteraction: true
  },
  follower: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-follower',
    color: '#2196F3',
    sound: false,
    vibrate: true,
    requireInteraction: false
  },
  review: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-review',
    color: '#FFC107',
    sound: true,
    vibrate: true,
    requireInteraction: false
  },
  listing: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-listing',
    color: '#9C27B0',
    sound: false,
    vibrate: false,
    requireInteraction: false
  },
  system: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-system',
    color: '#607D8B',
    sound: false,
    vibrate: false,
    requireInteraction: false
  }
};

export const notificationLabels: Record<NotificationType, string> = {
  message: 'Message',
  offer: 'Offre de prix',
  promo: 'Promotion',
  like: 'J\'aime',
  payment: 'Paiement',
  follower: 'Nouvel abonné',
  review: 'Avis',
  listing: 'Annonce',
  system: 'Système'
};
