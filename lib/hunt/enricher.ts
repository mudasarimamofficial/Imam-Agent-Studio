import { deepCrawl } from './crawler';
import { auditTechStack, TechStack } from './techAuditor';
import { AgentPipeline } from '../ai/orchestrator';

export interface EnrichedLead {
  domain: string;
  businessName: string;
  industry: string;
  summary: string;
  emails: string[];
  phones: string[];
  socials: Record<string, string>;
  techStack: TechStack | null;
  painPoints: string;
  founders: Array<{ name: string; role: string; linkedin?: string }>;
  draftEmail: string;
  draftLinkedIn: string;
}

export async function processHuntLead(
  domainOrUrl: string,
  settings: any,
  secrets: any,
  onProgress?: (status: string) => void
): Promise<EnrichedLead | null> {
  if (onProgress) onProgress(`Crawling ${domainOrUrl} (up to 5 pages)...`);
  
  const crawlRes = await deepCrawl(domainOrUrl.startsWith('http') ? domainOrUrl : `https://${domainOrUrl}`);
  
  if (!crawlRes.aggregatedText) {
    if (onProgress) onProgress(`Failed to crawl ${domainOrUrl}`);
    return null;
  }

  if (onProgress) onProgress(`Analyzing tech stack for ${domainOrUrl}...`);
  const { tech_stack } = auditTechStack(crawlRes.aggregatedText);

  // Set up the reasoning pipeline
  const pipeline = new AgentPipeline<{
    domain: string;
    text: string;
    extraction?: string; // stringified JSON
    outreach?: string; // stringified JSON
  }>();

  pipeline.addStep({
    name: 'extraction',
    taskType: 'extraction',
    systemInstruction: 'You are an elite data extraction AI. Extract the requested fields from the website text as strictly formatted JSON.',
    prompt: (ctx) => `
Website: ${ctx.domain}
Content:
${ctx.text}

Extract the following in JSON format:
{
  "businessName": "Name of the company",
  "industry": "Industry classification",
  "summary": "1-2 sentence business summary",
  "painPoints": "Technical or business pain points discovered",
  "founders": [{"name": "John Doe", "role": "CEO", "linkedin": "url"}]
}`
  });

  pipeline.addStep({
    name: 'outreach',
    taskType: 'reasoning',
    systemInstruction: 'You are a top-tier B2B salesperson. Draft highly personalized outreach based on the extracted business data.',
    prompt: (ctx) => `
Website: ${ctx.domain}
Extracted Data: ${ctx.extraction}

Draft a cold email (under 100 words) and a LinkedIn message (under 50 words) targeting the founders or leadership. Be consultative and mention pain points. Output strictly as JSON:
{
  "draftEmail": "Subject: ...\\n\\nHi...",
  "draftLinkedIn": "Hi..."
}`
  });

  if (onProgress) onProgress(`Running AI reasoning on ${domainOrUrl}...`);
  
  const ctx = await pipeline.execute(
    { domain: crawlRes.domain, text: crawlRes.aggregatedText },
    settings,
    secrets,
    (step) => {
      if (step === 'extraction') onProgress && onProgress(`Extracting founders and intelligence...`);
      if (step === 'outreach') onProgress && onProgress(`Drafting personalized outreach...`);
    }
  );

  let extractedData = { businessName: crawlRes.domain, industry: 'Unknown', summary: '', painPoints: '', founders: [] };
  try {
    const cleanedExt = (ctx.extraction || "").replace(/^```json\s*|```\s*$/g, '').trim();
    extractedData = { ...extractedData, ...JSON.parse(cleanedExt) };
  } catch (e) {}

  let outreachData = { draftEmail: '', draftLinkedIn: '' };
  try {
    const cleanedOut = (ctx.outreach || "").replace(/^```json\s*|```\s*$/g, '').trim();
    outreachData = { ...outreachData, ...JSON.parse(cleanedOut) };
  } catch (e) {}

  return {
    domain: crawlRes.domain,
    businessName: extractedData.businessName,
    industry: extractedData.industry,
    summary: extractedData.summary,
    emails: Array.from(crawlRes.emails),
    phones: Array.from(crawlRes.phones),
    socials: crawlRes.socials,
    techStack: tech_stack,
    painPoints: extractedData.painPoints,
    founders: extractedData.founders,
    draftEmail: outreachData.draftEmail,
    draftLinkedIn: outreachData.draftLinkedIn,
  };
}
