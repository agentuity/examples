import Parser from 'rss-parser';
import type { StartupLink } from './types';

const parser = new Parser();

/** keywords we keep in the Tech-news context */
const KEEP = [
  'startup', 'startups',
  'ai', 'artificial intelligence',
  'tech', 'technology',
  'vc', 'venture capital',
];

/* Feeds: VentureBeat removed */
const FEEDS: Record<string, string> = {
  techcrunch: 'https://techcrunch.com/tag/startups/feed/',
  yc:         'https://www.ycombinator.com/blog/rss.xml',
  crunchbase: 'https://news.crunchbase.com/feed/',
};

/** Return the newest `perFeed` items from each feed */
export async function getStartupLinks(perFeed = 3): Promise<StartupLink[]> {
  const results: StartupLink[] = [];

  const feeds = await Promise.all(
    Object.values(FEEDS).map(u => parser.parseURL(u).catch(() => null)),
  );

  for (const feed of feeds) {
    if (!feed) continue;

    const latest = feed.items
      .filter(i => i.title && i.link)
      .filter(i => {
        const haystack = (i.title + ' ' + (i.contentSnippet ?? '')).toLowerCase();
        return KEEP.some(kw => haystack.includes(kw));
      })
      .slice(0, perFeed)
      .map(i => ({ title: i.title!, url: i.link! }));

    results.push(...latest);
  }

  return results;
}
