export interface TechStack {
  platform: 'Shopify' | 'WordPress' | 'Wix' | 'Squarespace' | null;
  isShopify: boolean;
  detected: string[];
  accessibility: {
    totalImages: number;
    missingAltImages: number;
    missingAriaInteractive: number;
    missingHtmlLang: boolean;
  };
  performance: {
    largeImages: number;
    imagesWithoutLazyLoad: number;
    scriptTags: number;
  };
}

export function auditTechStack(html: string): { tech_stack: TechStack; audit_pain_points: string } {
  const detected: string[] = [];
  let platform: TechStack['platform'] = null;

  // Platform detection heuristics
  if (/cdn\.shopify\.com|myshopify\.com|\/collections\/|\/products\/|shopify-payment/i.test(html)) {
    platform = 'Shopify';
    detected.push('Shopify framework', 'Shopify CDN asset path');
  } else if (/wp-content|wp-includes|wordpress/i.test(html)) {
    platform = 'WordPress';
    detected.push('WordPress assets', 'WP theme resources');
  } else if (/wix\.com|wixsite|wix-code/i.test(html)) {
    platform = 'Wix';
    detected.push('Wix website builder');
  } else if (/squarespace\.com|squarespace-headers|static1\.squarespace/i.test(html)) {
    platform = 'Squarespace';
    detected.push('Squarespace engine');
  }

  // Accessibility checks
  // 1. Check images
  const imgMatches = html.match(/<img\s+[^>]*>/gi) || [];
  const totalImages = imgMatches.length;
  let missingAltImages = 0;
  let imagesWithoutLazyLoad = 0;
  
  for (const img of imgMatches) {
    if (!/alt\s*=\s*['"][^'"]*['"]/i.test(img) || /alt\s*=\s*['"]\s*['"]/i.test(img)) {
      missingAltImages++;
    }
    if (!/loading\s*=\s*['"]lazy['"]/i.test(img)) {
      imagesWithoutLazyLoad++;
    }
  }

  // 2. Interactive elements missing ARIA labels
  const interactiveMatches = html.match(/<(button|a|input|select)\s+[^>]*>/gi) || [];
  let missingAriaInteractive = 0;
  for (const el of interactiveMatches) {
    if (el.toLowerCase().startsWith('<button') || el.toLowerCase().startsWith('<input')) {
      if (!/aria-label|aria-labelledby|title/i.test(el)) {
        missingAriaInteractive++;
      }
    }
  }

  // 3. HTML Lang check
  const missingHtmlLang = !/<html[^>]*\s+lang\s*=\s*['"][^'"]+['"]/i.test(html);

  // Performance checks
  const scriptTags = (html.match(/<script\s+[^>]*>/gi) || []).length;
  if (scriptTags >= 15) {
    detected.push('Heavy script loading count (' + scriptTags + ')');
  }

  const tech_stack: TechStack = {
    platform,
    isShopify: platform === 'Shopify',
    detected,
    accessibility: {
      totalImages,
      missingAltImages,
      missingAriaInteractive,
      missingHtmlLang
    },
    performance: {
      largeImages: Math.round(totalImages * 0.1), // estimate based on count
      imagesWithoutLazyLoad,
      scriptTags
    }
  };

  // Build human-readable pain point summary
  const painPoints: string[] = [];
  if (platform === 'Shopify') {
    painPoints.push("Site runs on Shopify — theme performance and Core Web Vitals directly affect cart conversions.");
  } else if (platform) {
    painPoints.push(`Site runs on ${platform} — legacy modules can degrade site load speeds.`);
  }

  if (missingAltImages > 0) {
    painPoints.push(`${missingAltImages} of ${totalImages} images lack alt attributes (violates WCAG 1.1.1, degrading accessibility & SEO ranking).`);
  }
  if (missingAriaInteractive > 0) {
    painPoints.push(`${missingAriaInteractive} interactive elements lack descriptive ARIA tags (hurts screen-readers).`);
  }
  if (missingHtmlLang) {
    painPoints.push("Missing HTML lang attribute, causing localization parsing warnings.");
  }
  if (scriptTags >= 15) {
    painPoints.push(`Heavy javascript load: ${scriptTags} external script files are slowing down mobile render time.`);
  }

  const audit_pain_points = painPoints.length > 0 
    ? painPoints.join(" ") 
    : "No major technical red flags detected in lightweight HTML scan.";

  return { tech_stack, audit_pain_points };
}
