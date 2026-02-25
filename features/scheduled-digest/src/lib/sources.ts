import type { SourceData, SourceItem } from './types';

export const SOURCES = [
	{
		id: 'hn',
		name: 'Hacker News',
		url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
		description: 'Top stories from Hacker News',
	},
	{
		id: 'github',
		name: 'GitHub Trending',
		url: 'https://api.github.com/search/repositories?q=stars:>100+pushed:>2026-02-12&sort=stars&per_page=5',
		description: 'Trending repositories on GitHub',
	},
] as const;

export type SourceId = (typeof SOURCES)[number]['id'];

// Hacker News item shape from API
interface HNItem {
	id: number;
	title: string;
	url?: string;
	text?: string;
	score: number;
}

// GitHub repo shape from search API
interface GitHubRepo {
	full_name: string;
	html_url: string;
	description: string | null;
	stargazers_count: number;
	language: string | null;
}

export async function fetchHackerNews(): Promise<SourceData> {
	const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
	const ids = (await res.json()) as number[];
	const top = ids.slice(0, 8);

	const items: SourceItem[] = await Promise.all(
		top.map(async (id) => {
			const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
			const item = (await itemRes.json()) as HNItem;
			return {
				title: item.title,
				url: item.url,
				description: item.text ? item.text.slice(0, 200) : `${item.score} points`,
			};
		}),
	);

	return { name: 'Hacker News', items };
}

export async function fetchGitHubTrending(): Promise<SourceData> {
	const date = new Date();
	date.setDate(date.getDate() - 7);
	const since = date.toISOString().split('T')[0];

	const res = await fetch(
		`https://api.github.com/search/repositories?q=stars:>100+pushed:>${since}&sort=stars&per_page=5`,
		{ headers: { Accept: 'application/vnd.github.v3+json' } },
	);
	const data = (await res.json()) as { items: GitHubRepo[] };

	const items: SourceItem[] = (data.items ?? []).map((repo) => ({
		title: repo.full_name,
		url: repo.html_url,
		description: `${repo.description ?? 'No description'} (${repo.stargazers_count.toLocaleString()} stars, ${repo.language ?? 'unknown'})`,
	}));

	return { name: 'GitHub Trending', items };
}

export async function fetchAllSources(): Promise<SourceData[]> {
	const results = await Promise.allSettled([fetchHackerNews(), fetchGitHubTrending()]);

	return results
		.filter((r): r is PromiseFulfilledResult<SourceData> => r.status === 'fulfilled')
		.map((r) => r.value);
}
