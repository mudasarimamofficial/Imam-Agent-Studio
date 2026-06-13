import { HuntResult } from '../types';
import { fetchWithRetry } from '../net';

/**
 * Predictive lead score (0-100): a weighted blend of reputation (rating),
 * social proof (review volume), and contactability (has a website).
 *   - website present .............. 30 pts
 *   - rating / 5 ................... 40 pts
 *   - log-scaled review count ...... 30 pts (saturates ~500 reviews)
 */
export function computeLeadScore(opts: {
  rating: number | null;
  userRatingCount: number;
  hasWebsite: boolean;
}): number {
  const websitePts = opts.hasWebsite ? 30 : 0;
  const ratingPts = opts.rating ? (opts.rating / 5) * 40 : 0;
  const volumePts = opts.userRatingCount > 0
    ? Math.min(Math.log10(opts.userRatingCount + 1) / Math.log10(501), 1) * 30
    : 0;
  return Math.round(websitePts + ratingPts + volumePts);
}

export async function executeHunt(query: string, userKey?: string | null): Promise<HuntResult[]> {
  const apiKey = userKey || process.env.GOOGLE_PLACES_API_KEY;
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
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.id,places.websiteUri'
      },
      body: JSON.stringify(reqBody)
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Google Places API Error: ${response.status} ${txt}`);
    }

    const data = await response.json();
    if (!data.places) return [];

    return data.places.map((p: any) => {
      const hasWebsite = !!p.websiteUri;
      const userRatingCount = p.userRatingCount ?? 0;
      const score = computeLeadScore({
        rating: p.rating ?? null,
        userRatingCount,
        hasWebsite,
      });
      return {
        business_name: p.displayName?.text || 'Unknown',
        category: p.types ? p.types[0] : 'Business',
        location: p.formattedAddress || 'Unknown location',
        rating: p.rating ? p.rating.toString() : 'N/A',
        insight: p.websiteUri || 'No website found',
        website_uri: p.websiteUri || 'No website found',
        place_id: p.id,
        user_rating_count: userRatingCount,
        score,
      };
    });
  } catch (error) {
    console.error("Hunt engine error:", error);
    throw error;
  }
}
