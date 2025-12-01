import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodingResult {
  lat: string;
  lon: string;
}

async function geocodeLocation(location: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'AyokaMarket/1.0',
        },
      }
    );
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: data[0].lat,
        lon: data[0].lon,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error for location:', location, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all listings without coordinates
    const { data: listings, error: fetchError } = await supabase
      .from('listings')
      .select('id, location')
      .is('latitude', null)
      .is('longitude', null)
      .limit(100); // Process in batches of 100

    if (fetchError) {
      console.error('Error fetching listings:', fetchError);
      throw fetchError;
    }

    if (!listings || listings.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No listings to geocode',
          processed: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Processing ${listings.length} listings...`);

    let successCount = 0;
    let failCount = 0;

    // Process listings with delay to respect API rate limits
    for (const listing of listings) {
      const coordinates = await geocodeLocation(listing.location);
      
      if (coordinates) {
        const { error: updateError } = await supabase
          .from('listings')
          .update({
            latitude: parseFloat(coordinates.lat),
            longitude: parseFloat(coordinates.lon),
          })
          .eq('id', listing.id);

        if (updateError) {
          console.error(`Error updating listing ${listing.id}:`, updateError);
          failCount++;
        } else {
          console.log(`Successfully geocoded listing ${listing.id}: ${listing.location}`);
          successCount++;
        }
      } else {
        console.log(`Failed to geocode listing ${listing.id}: ${listing.location}`);
        failCount++;
      }

      // Add delay to respect Nominatim rate limits (1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1100));
    }

    return new Response(
      JSON.stringify({ 
        message: 'Geocoding completed',
        total: listings.length,
        success: successCount,
        failed: failCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in geocode-listings function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});