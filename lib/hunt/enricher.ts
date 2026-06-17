import { fetchWithRetry, assertSafeUrl } from '../net';
import { auditTechStack, TechStack } from './techAuditor';

export interface EnrichmentResult {
  email: string | null;
  instagram_handle: string | null;
  has_email: boolean;
  has_instagram: boolean;
  has_whatsapp: boolean;
  tech_stack: TechStack | null;
  audit_pain_points: string | null;
  website_text_snippet: string | null;
  discovery_error: string | null;
}

export async function enrichWebsite(urlStr: string, phoneStr?: string | null): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    email: null,
    instagram_handle: null,
    has_email: false,
    has_instagram: false,
    has_whatsapp: !!phoneStr,
    tech_stack: null,
    audit_pain_points: null,
    website_text_snippet: null,
    discovery_error: null,
  };

  if (!urlStr || urlStr === 'No website found') {
    result.discovery_error = "No website available to enrich";
    return result;
  }

  try {
    const url = assertSafeUrl(urlStr);
    const res = await fetchWithRetry(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    }, { timeoutMs: 10000 });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const html = await res.text();
    
    // Truncate snippet for AI brain prompt context
    const cleanText = html
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    result.website_text_snippet = cleanText.slice(0, 600);

    // Email extraction
    const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    let extractedEmail = mailtoMatch ? mailtoMatch[1] : null;
    
    if (!extractedEmail) {
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
      const generalMatches = html.match(emailRegex);
      if (generalMatches) {
        // filter out common image/svg noise
        const filtered = generalMatches.filter(e => !/\.(png|jpg|jpeg|gif|webp|svg|css)$/i.test(e));
        if (filtered.length > 0) {
          extractedEmail = filtered[0];
        }
      }
    }
    
    if (extractedEmail) {
      result.email = extractedEmail.toLowerCase();
      result.has_email = true;
    }

    // Instagram handle extraction
    const igMatch = html.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i);
    if (igMatch && !['p', 'reels', 'explore', 'stories'].includes(igMatch[1])) {
      result.instagram_handle = igMatch[1];
      result.has_instagram = true;
    }

    // Trigger tech auditor heuristics
    const { tech_stack, audit_pain_points } = auditTechStack(html);
    result.tech_stack = tech_stack;
    result.audit_pain_points = audit_pain_points;

  } catch (error: any) {
    result.discovery_error = error.message || "Failed to fetch website contents";
  }

  return result;
}
