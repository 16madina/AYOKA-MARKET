
-- Activer REPLICA IDENTITY FULL pour obtenir les anciennes valeurs dans les événements UPDATE
ALTER TABLE public.messages REPLICA IDENTITY FULL;
