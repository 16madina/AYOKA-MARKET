-- Promouvoir "Meubles" en catégorie principale (retirer le parent_id)
UPDATE public.categories 
SET parent_id = NULL 
WHERE slug = 'meubles';

-- Vérifier et ajouter l'icône appropriée pour Meubles si nécessaire
UPDATE public.categories 
SET icon = 'Sofa' 
WHERE slug = 'meubles' AND icon IS NULL;