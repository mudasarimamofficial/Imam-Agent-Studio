import { HuntResult } from '../types';
import { fetchWithRetry } from '../net';

export async function executeHunt(query: string): Promise<HuntResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("Missing GOOGLE_PLACES_API_KEY, using fallback empty results.");
    return [
      {
        business_name: "Mocked Tech Corp",
        category: "Software",
        location: "Mock City",
        rating: "4.5",
        insight: "Fallback result, please provide GOOGLE_PLACES_API_KEY."
      }
    ];
  }

  const url = "https://places.googleapis.com/v1/places:searchText";
  const reqBody = {
    textQuery: query,
    languageCode: "en"
  };

  try {
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.types,places.id,places.websiteUri'
      },
      body: JSON.stringify(reqBody)
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Google Places API Error: ${response.status} ${txt}`);
    }

    const data = await response.json();
    if (!data.places) return [];

    return data.places.map((p: any) => ({
      business_name: p.displayName?.text || 'Unknown',
      category: p.types ? p.types[0] : 'Business',
      location: p.formattedAddress || 'Unknown location',
      rating: p.rating ? p.rating.toString() : 'N/A',
      insight: p.websiteUri || 'No website found',
      website_uri: p.websiteUri || 'No website found',
      place_id: p.id
    }));
  } catch (error) {
    console.error("Hunt engine error:", error);
    throw error;
  }
}
