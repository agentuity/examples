import OpenAI from 'openai';
import type { StartupLink, StartupSummary } from './types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CONCURRENCY = 5;

export async function summarizeStartups(
  links: StartupLink[],
): Promise<StartupSummary[]> {
  /* split into chunks of `CONCURRENCY` links */
  const chunks = Array.from(
    { length: Math.ceil(links.length / CONCURRENCY) },
    (_, n) => links.slice(n * CONCURRENCY, (n + 1) * CONCURRENCY),
  );

  const summaries: StartupSummary[] = [];

  for (const group of chunks) {
    const settled = await Promise.allSettled(group.map(callOpenAI));
    for (const res of settled) {
      if (res.status === 'fulfilled') summaries.push(res.value);
    }
  }

  return summaries;
}

async function callOpenAI(link: StartupLink): Promise<StartupSummary> {
  /* bigger prompt for a longer answer */
  const prompt = `You are a venture-capital analyst writing deal briefs.

Read the article at:
${link.url}

Return a single **JSON object** with these keys ⬇︎
- name
- industry
- summary            – 2-4 sentences, 60-120 words, plain text
- founders           – null if unknown
- why_it_matters     – 1-2 sentences on strategic significance, null if unknown
- funding_source     – null if not mentioned`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    /* give the model room for the longer summary */
    max_tokens: 400,
    temperature: 0.4,
  });

  const raw = res.choices?.[0]?.message?.content ?? '{}';
  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  /* sane fallbacks / normalisation */
  const summary: StartupSummary = {
    name: parsed.name ?? 'Unknown',
    industry: normaliseIndustry(parsed.industry),
    summary: parsed.summary ?? 'Summary unavailable.',
    founders: parsed.founders ?? null,
    why_it_matters: parsed.why_it_matters ?? null,
    funding_source: parsed.funding_source ?? null,
    source: link.url,
  };

  return summary;
}

/* small helper to bucket common industry values */
function normaliseIndustry(raw?: string): 'AI' | 'VC' | 'Tech' | 'Startups' | undefined {
    if (!raw) return undefined;
    const t = raw.toLowerCase();
    if (/(^| )(ai|artificial intelligence|machine learning|ml)( |$)/.test(t)) { return 'AI';}
    if (/(vc|venture|fund|capital|investor)/.test(t)) { return 'VC';}
    if (/(startup|accelerator|incubator|founder program)/.test(t)) { return 'Startups';}
    if (/(tech|technology|robot|drone|fintech|crypto|software|hardware|cloud|SaaS)/.test(t)) { return 'Tech';}
    return undefined;
  }
