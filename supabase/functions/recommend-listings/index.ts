import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cache
    const cacheKey = user.id;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Returning cached recommendations');
      return new Response(
        JSON.stringify(cached.data),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer le profil utilisateur pour le filtrage géographique
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("city, country")
      .eq("id", user.id)
      .single();

    console.log("User profile:", userProfile);

    // Récupérer les favoris de l'utilisateur
    const { data: favorites } = await supabase
      .from("favorites")
      .select(`
        listing:listings(
          id,
          title,
          description,
          category_id,
          categories(name)
        )
      `)
      .eq("user_id", user.id)
      .limit(10);

    // Fonction pour déterminer la priorité géographique
    const getLocationPriority = (location: string) => {
      const [city, country] = location.split(',').map(s => s.trim());
      
      if (userProfile?.city && city && city.toLowerCase() === userProfile.city.toLowerCase()) {
        return 0; // same-city
      }
      if (userProfile?.country && country && country.toLowerCase() === userProfile.country.toLowerCase()) {
        return 1; // same-country
      }
      // Ne pas recommander les pays voisins ou autres
      return 999; // other
    };

    // Récupérer toutes les annonces actives - limité à 50 pour performance
    const { data: allListings } = await supabase
      .from("listings")
      .select(`
        id,
        title,
        description,
        price,
        images,
        location,
        created_at,
        category_id,
        categories(name)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);

    // Filtrer pour ne garder que les annonces du même pays
    const filteredListings = allListings?.filter(listing => {
      const priority = getLocationPriority(listing.location);
      return priority < 999; // Garder seulement same-city et same-country
    }) || [];

    // Trier par priorité géographique
    const sortedListings = filteredListings.sort((a, b) => {
      return getLocationPriority(a.location) - getLocationPriority(b.location);
    });

    console.log(`Total listings: ${allListings?.length}, Filtered: ${filteredListings.length}`);

    if (!sortedListings || sortedListings.length === 0) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Préparer le contexte pour l'IA
    const favoritesContext = favorites?.map((f: any) => ({
      title: f.listing?.title,
      description: f.listing?.description,
      category: f.listing?.categories?.name,
    })) || [];

    const listingsContext = sortedListings.map((l: any) => ({
      id: l.id,
      title: l.title,
      category: l.categories?.name,
      description: l.description?.substring(0, 100),
      location: l.location,
    }));

    const userLocation = userProfile?.city && userProfile?.country 
      ? `${userProfile.city}, ${userProfile.country}`
      : userProfile?.country || "non spécifié";

    // Appeler Lovable AI pour obtenir des recommandations
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Tu es un système de recommandation pour une plateforme de vente d'occasion en Afrique de l'Ouest. 
L'utilisateur se trouve à: ${userLocation}

RÈGLES IMPORTANTES:
- Privilégie ABSOLUMENT les annonces de la même ville en priorité
- Ensuite, privilégie les annonces du même pays
- NE RECOMMANDE JAMAIS d'annonces d'autres pays
- Les annonces sont déjà pré-filtrées géographiquement

Analyse les préférences de l'utilisateur basées sur ses favoris et recommande jusqu'à 5 annonces pertinentes.
Retourne uniquement un tableau JSON avec les IDs des annonces recommandées dans l'ordre de pertinence.
Format: {"recommendations": ["id1", "id2", "id3", "id4", "id5"]}`
          },
          {
            role: "user",
            content: `Localisation utilisateur: ${userLocation}

Favoris de l'utilisateur: ${JSON.stringify(favoritesContext)}
            
Annonces disponibles (déjà filtrées par localisation): ${JSON.stringify(listingsContext)}

Recommande jusqu'à 5 annonces qui correspondent le mieux aux intérêts de l'utilisateur, en privilégiant la proximité géographique.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_listings",
              description: "Retourne les IDs des annonces recommandées",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Liste des IDs d'annonces recommandées"
                  }
                },
                required: ["recommendations"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "recommend_listings" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez plus tard" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    const recommendedIds = toolCall ? JSON.parse(toolCall.function.arguments).recommendations : [];

    // Récupérer les annonces complètes recommandées
    const { data: recommendedListings } = await supabase
      .from("listings")
      .select(`
        *,
        categories(name, icon),
        profiles(full_name, avatar_url, rating_average)
      `)
      .in("id", recommendedIds)
      .eq("status", "active");

    // Trier selon l'ordre de recommandation
    const sortedRecommendations = recommendedIds
      .map((id: string) => recommendedListings?.find((l: any) => l.id === id))
      .filter(Boolean);

    return new Response(JSON.stringify({ recommendations: sortedRecommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
