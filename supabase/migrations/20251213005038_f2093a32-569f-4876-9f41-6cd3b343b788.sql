-- Supprimer les triggers dupliqués sur followers (garder trigger_notify_new_follower)
DROP TRIGGER IF EXISTS on_follower_created ON public.followers;
DROP TRIGGER IF EXISTS on_new_follower_notify ON public.followers;

-- Supprimer les triggers dupliqués sur messages (garder trigger_notify_new_message)
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
DROP TRIGGER IF EXISTS on_new_message_notify ON public.messages;

-- Supprimer les triggers dupliqués sur reviews (garder trigger_notify_new_review)
DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
DROP TRIGGER IF EXISTS on_new_review_notify ON public.reviews;

-- Supprimer les anciennes fonctions qui créent des notifications locales seulement (sans HTTP)
DROP FUNCTION IF EXISTS public.notify_new_follower() CASCADE;
DROP FUNCTION IF EXISTS public.notify_new_message() CASCADE;
DROP FUNCTION IF EXISTS public.notify_new_review() CASCADE;

-- Recréer les triggers avec les bonnes fonctions
CREATE TRIGGER trigger_notify_new_follower
AFTER INSERT ON public.followers
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notify_new_follower();

CREATE TRIGGER trigger_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notify_new_message();

CREATE TRIGGER trigger_notify_new_review
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.trigger_notify_new_review();