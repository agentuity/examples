/**
 * Startup News Scraper – Agentuity entry point.
 * n8n POSTs `{}`  or  `{ "perFeed": 3 }`
 * We grab the newest `perFeed` articles from each feed (default 3).
 */

import type { AgentRequest, AgentResponse } from '@agentuity/sdk';
import { getStartupLinks } from './fetchFeeds';
import { summarizeStartups } from './summarize';
import type { StartupSummary } from './types';

export const welcome = () => ({
  welcome:
    'POST {} (or {"perFeed":3}) to receive the three freshest startup articles from each feed, summarized.',
});

export default async function Agent(req: AgentRequest, resp: AgentResponse) {
  try {
    const raw  = (await req.data.text()) || '{}';
    const body = JSON.parse(raw) as { perFeed?: number };

    const perFeed = body.perFeed ?? 3;            // ← new default

    const links    = await getStartupLinks(perFeed);
    const startups = await summarizeStartups(links);

    return resp.json({
      generatedAt: new Date().toISOString(),
      perFeed,
      total: startups.length,
      startups,
    });
  } catch (err) {
    console.error('StartupScraper error', err);
    return resp.text('Agent failed – check logs.');
  }
}
