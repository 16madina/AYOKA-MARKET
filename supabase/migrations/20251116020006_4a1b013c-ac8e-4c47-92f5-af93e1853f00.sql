-- Add subcategories for all main categories
-- Note: This assumes parent categories already exist. We'll create subcategories for common ones.

-- First, let's get common parent categories and create subcategories for them
-- Électronique subcategories
INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Téléphones & Tablettes', 'telephones-tablettes', 'Smartphone', id FROM categories WHERE slug = 'electronique'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Ordinateurs', 'ordinateurs', 'Laptop', id FROM categories WHERE slug = 'electronique'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'TV & Audio', 'tv-audio', 'Tv', id FROM categories WHERE slug = 'electronique'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Accessoires électroniques', 'accessoires-electroniques', 'Usb', id FROM categories WHERE slug = 'electronique'
ON CONFLICT (slug) DO NOTHING;

-- Mode subcategories
INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Femme', 'mode-femme', 'User', id FROM categories WHERE slug = 'mode'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Homme', 'mode-homme', 'User', id FROM categories WHERE slug = 'mode'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Enfants & Bébés', 'enfants-bebes', 'Baby', id FROM categories WHERE slug = 'mode'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Accessoires mode', 'accessoires-mode', 'Watch', id FROM categories WHERE slug = 'mode'
ON CONFLICT (slug) DO NOTHING;

-- Véhicules subcategories
INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Voitures', 'voitures', 'Car', id FROM categories WHERE slug = 'vehicules'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Motos', 'motos', 'Bike', id FROM categories WHERE slug = 'vehicules'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Pièces auto', 'pieces-auto', 'Wrench', id FROM categories WHERE slug = 'vehicules'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Vélos', 'velos', 'Bike', id FROM categories WHERE slug = 'vehicules'
ON CONFLICT (slug) DO NOTHING;

-- Maison subcategories
INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Meubles', 'meubles', 'Sofa', id FROM categories WHERE slug = 'maison'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Électroménager', 'electromenager', 'Microwave', id FROM categories WHERE slug = 'maison'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Décoration', 'decoration', 'Lamp', id FROM categories WHERE slug = 'maison'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Jardin', 'jardin', 'TreePine', id FROM categories WHERE slug = 'maison'
ON CONFLICT (slug) DO NOTHING;

-- Loisirs subcategories
INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Sport', 'sport', 'Dumbbell', id FROM categories WHERE slug = 'loisirs'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Musique', 'musique', 'Music', id FROM categories WHERE slug = 'loisirs'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Jeux & Jouets', 'jeux-jouets', 'Gamepad2', id FROM categories WHERE slug = 'loisirs'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, icon, parent_id)
SELECT 'Livres & Films', 'livres-films', 'BookOpen', id FROM categories WHERE slug = 'loisirs'
ON CONFLICT (slug) DO NOTHING;