-- Phase 2: Indexes critiques pour optimisation des performances

-- Index pour les requêtes de listings par statut et date
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON public.listings(status, created_at DESC);

-- Index pour les listings par catégorie et statut
CREATE INDEX IF NOT EXISTS idx_listings_category_status ON public.listings(category_id, status);

-- Index pour les listings par utilisateur et statut
CREATE INDEX IF NOT EXISTS idx_listings_user_status ON public.listings(user_id, status);

-- Index pour le tri par vues (listings populaires)
CREATE INDEX IF NOT EXISTS idx_listings_views ON public.listings(views DESC) WHERE status = 'active';

-- Index pour la recherche géographique
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings USING gin(to_tsvector('french', location));

-- Index pour les conversations
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON public.conversations(buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON public.conversations(seller_id, last_message_at DESC);

-- Index pour les messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(receiver_id, is_read) WHERE is_read = false;