import * as cheerio from 'cheerio';
import { fetchWithRetry, assertSafeUrl } from '../net';

export interface CrawlResult {
  domain: string;
  pagesCrawled: number;
  emails: Set<string>;
  phones: Set<string>;
  socials: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    pinterest?: string;
  };
  aggregatedText: string;
  title: string;
  description: string;
}

const PRIORITY_PATHS = ['about', 'contact', 'team', 'leadership', 'our-story', 'founder'];

function isPriorityUrl(url: string, baseUrl: string): boolean {
  try {
    const parsed = new URL(url, baseUrl);
    if (parsed.hostname !== new URL(baseUrl).hostname) return false;
    const path = parsed.pathname.toLowerCase();
    return PRIORITY_PATHS.some(p => path.includes(p));
  } catch {
    return false;
  }
}

export async function deepCrawl(urlStr: string, maxPages = 5): Promise<CrawlResult> {
  const result: CrawlResult = {
    domain: '',
    pagesCrawled: 0,
    emails: new Set(),
    phones: new Set(),
    socials: {},
    aggregatedText: '',
    title: '',
    description: ''
  };

  try {
    const url = assertSafeUrl(urlStr);
    result.domain = url.hostname;

    const visited = new Set<string>();
    const queue: string[] = [url.toString()];
    
    while (queue.length > 0 && result.pagesCrawled < maxPages) {
      const currentUrl = queue.shift()!;
      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      try {
        const res = await fetchWithRetry(currentUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
          }
        }, { timeoutMs: 15000 });

        if (!res.ok) continue;

        const html = await res.text();
        const $ = cheerio.load(html);
        result.pagesCrawled++;

        if (result.pagesCrawled === 1) {
          result.title = $('title').text().trim();
          result.description = $('meta[name="description"]').attr('content') || '';
        }

        // Extract links
        const newLinks: string[] = [];
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href) return;
          
          // Check for mailto and tel
          if (href.toLowerCase().startsWith('mailto:')) {
            result.emails.add(href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase());
          } else if (href.toLowerCase().startsWith('tel:')) {
            result.phones.add(href.replace(/^tel:/i, '').trim());
          } else {
            try {
              const absoluteUrl = new URL(href, currentUrl).toString();
              if (!visited.has(absoluteUrl)) {
                if (isPriorityUrl(absoluteUrl, currentUrl)) {
                  // Put priority URLs at the front of the queue
                  queue.unshift(absoluteUrl);
                  visited.add(absoluteUrl); // prevent duplicate enqueuing
                } else if (result.pagesCrawled < maxPages) {
                  newLinks.push(absoluteUrl);
                }
              }

              // Social links extraction
              const hostname = new URL(absoluteUrl).hostname.toLowerCase();
              if (hostname.includes('linkedin.com/company')) result.socials.linkedin = absoluteUrl;
              else if (hostname.includes('twitter.com') || hostname.includes('x.com')) result.socials.twitter = absoluteUrl;
              else if (hostname.includes('instagram.com')) result.socials.instagram = absoluteUrl;
              else if (hostname.includes('facebook.com')) result.socials.facebook = absoluteUrl;
              else if (hostname.includes('youtube.com')) result.socials.youtube = absoluteUrl;
              else if (hostname.includes('tiktok.com')) result.socials.tiktok = absoluteUrl;
              else if (hostname.includes('pinterest.com')) result.socials.pinterest = absoluteUrl;
              
            } catch {
              // Ignore invalid URLs
            }
          }
        });

        // Add non-priority links to the back
        queue.push(...newLinks);

        // Extract text
        $('script, style, noscript, iframe, svg, img').remove();
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        result.aggregatedText += `\n--- PAGE: ${currentUrl} ---\n${text.substring(0, 3000)}`;

        // Global email regex as fallback
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
        const matches = text.match(emailRegex);
        if (matches) {
          matches.forEach(e => {
            if (!/\.(png|jpg|jpeg|gif|webp|svg|css|js)$/i.test(e)) {
              result.emails.add(e.toLowerCase());
            }
          });
        }
      } catch (err) {
        console.warn(`Failed to crawl ${currentUrl}:`, err);
      }
    }

  } catch (err) {
    console.error("Deep crawl error:", err);
  }

  // Trim aggregated text to fit within typical LLM context windows (e.g., max 15k chars for this task)
  if (result.aggregatedText.length > 15000) {
    result.aggregatedText = result.aggregatedText.substring(0, 15000) + "\n...[TRUNCATED]";
  }

  return result;
}
