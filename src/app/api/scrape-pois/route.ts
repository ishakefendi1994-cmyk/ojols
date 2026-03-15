import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function POST(req: Request) {
  try {
    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const { lat, lng, radius, keyword } = await req.json();

    console.log('DEBUG: Scrape Request:', { lat, lng, radius, keyword });

    if (!GOOGLE_API_KEY) {
      console.error('DEBUG: Missing Google Maps API Key');
      return NextResponse.json({ error: 'Config Error: Missing Google Maps API Key' }, { status: 500 });
    }

    if (!lat || !lng || !radius) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    let allResults: any[] = [];
    let nextPageToken: string | null = null;

    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius * 1000}&key=${GOOGLE_API_KEY}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

    console.log('DEBUG: Fetching from Google Places...');
    const response = await fetch(url);
    const data = await response.json();

    console.log('DEBUG: Google API Response Status:', data.status);
    if (data.error_message) console.log('DEBUG: Google API Error Message:', data.error_message);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return NextResponse.json({ 
        error: data.error_message || `Google API Error: ${data.status}`, 
        googleStatus: data.status 
      }, { status: 500 });
    }

    allResults = [...(data.results || [])];
    
    console.log(`DEBUG: Found ${allResults.length} results.`);

    const poisToInsert = allResults.map((item: any) => ({
      place_id: item.place_id,
      name: item.name,
      address: item.vicinity || item.formatted_address,
      latitude: item.geometry.location.lat,
      longitude: item.geometry.location.lng,
      category: keyword || (item.types && item.types[0]),
      updated_at: new Date().toISOString(),
    }));

    if (poisToInsert.length > 0) {
      console.log(`DEBUG: Upserting ${poisToInsert.length} POIs to Supabase...`);
      const { error: upsertError } = await supabase
        .from('local_pois')
        .upsert(poisToInsert, { onConflict: 'place_id' });

      if (upsertError) {
        console.error('DEBUG: Supabase Upsert Error:', upsertError);
        return NextResponse.json({ error: `Database Error: ${upsertError.message}` }, { status: 500 });
      }
      console.log('DEBUG: Upsert Successful');
    }

    return NextResponse.json({ 
      success: true, 
      count: poisToInsert.length,
      message: `Berhasil mengambil ${poisToInsert.length} lokasi.` 
    });

  } catch (error: any) {
    console.error('DEBUG: Catch Block Error:', error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
