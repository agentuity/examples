import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Zod schemas for type-safe API responses
const HNStorySchema = z.object({
  id: z.number(),             // Required by HN API
  title: z.string(),          // What we display
  url: z.string().optional(), // Available if needed
});

const DigestDataSchema = z.object({
  summary: z.string(),
  sources: z.array(z.string()),
  articleCount: z.number(),
  timestamp: z.string(),
  source: z.string(),
});

// Hacker News API endpoints
const HN_TOP_STORIES = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM = "https://hacker-news.firebaseio.com/v0/item";

// Scheduled interval in minutes
const INTERVAL = 5;

export const welcome = () => ({
  welcome: `AI News Digest - I fetch tech news and create AI-powered summaries every ${INTERVAL} minutes!`,
  prompts: [
    {
      data: "test fetch",
      contentType: "text/plain"
    },
    {
      data: "show digest",
      contentType: "text/plain"
    }
  ]
});

async function fetchTopStories(ctx: AgentContext, count: number = 5): Promise<string[]> {
  try {
    // Fetch top story IDs from HN
    const idsResponse = await fetch(`${HN_TOP_STORIES}?orderBy="$key"&limitToFirst=${count * 2}`);
    const storyIds = await idsResponse.json() as number[];
    
    // Fetch story details in parallel
    const storyPromises = storyIds.slice(0, count).map(async (id) => {
      const response = await fetch(`${HN_ITEM}/${id}.json`);
      const data = await response.json();
      
      // Validate with Zod
      try {
        const story = HNStorySchema.parse(data);
        return story.title;
      } catch (error) {
        ctx.logger.warn(`Invalid story data for ID ${id}`);
        return null;
      }
    });
    
    const stories = await Promise.all(storyPromises);
    return stories.filter((story): story is string => story !== null);
  } catch (error) {
    ctx.logger.error("Failed to fetch from HN API", error);
    throw error;
  }
}

export default async function AINewsDigest(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  
  // Handle cron trigger - full production logic
  if (req.trigger === 'cron') {
    ctx.logger.info("Cron triggered: Fetching news for digest...");
    
    let articles: string[] = [];
    let sourceType = "Hacker News API";
    
    try {
      // Fetch full 5 stories for production
      articles = await fetchTopStories(ctx, 5);
      ctx.logger.info("Fetched %d stories from Hacker News", articles.length);
    } catch (error) {
      ctx.logger.warn("API failed, using demo fallback data");
      // Demo fallback data
      articles = [
        "Demo: Latest AI breakthrough in code generation",
        "Demo: OpenAI launches GPT-5",
        "Demo: New approach to distributed systems"
      ];
      sourceType = "Demo Data (API unavailable)";
    }
    
    // Generate AI summary for the digest
    const { text } = await generateText({
      model: openai("gpt-5-nano"),
      prompt: `You are a tech news curator. Create a brief, engaging daily digest of these headlines for developers. Include:
      1. A 2-3 sentence summary of the main themes
      2. One key takeaway for developers
      
      Headlines: ${articles.join("; ")}
      
      Keep the total response under 300 words.`
    });
    
    // Create and validate digest with Zod
    const digest = DigestDataSchema.parse({
      summary: text,
      sources: articles,
      articleCount: articles.length,
      timestamp: new Date().toISOString(),
      source: sourceType
    });
    
    // Store in KV
    await ctx.kv.set("digest", "latest", digest);
    
    ctx.logger.info("Digest created and stored successfully");
    
    return resp.json({
      message: "New tech digest created!",
      ...digest
    });
  }
  
  // Handle manual trigger (testing in DevMode)
  else if (req.trigger === 'manual') {
    const command = await req.data.text().catch(() => "");
    
    // Test fetch
    if (command === 'test fetch') {
      ctx.logger.info("Quick test: Fetching top 3 stories...");
      
      try {
        const articles = await fetchTopStories(ctx, 3);
        return resp.json({
          message: "Test successful! Here are the current top stories:",
          articles,
          count: articles.length,
          note: "Use cron trigger for full digest with AI summary"
        });
      } catch (error) {
        return resp.json({
          error: "Test failed - HN API might be down",
          message: "Try again in a moment"
        });
      }
    }
    
    // Show a stored digest
    if (command === 'show digest') {
      const latest = await ctx.kv.get("digest", "latest");
      
      if (!latest.exists) {
        return resp.text(`No digest available yet! Set up a cron job to run every ${INTERVAL} minutes.`);
      }
      
      const rawData = await latest.data.json();
      const data = DigestDataSchema.parse(rawData);
      const timeAgo = Math.floor((Date.now() - new Date(data.timestamp).getTime()) / 60000);
      
      return resp.text(`Latest Tech Digest (${timeAgo} minutes ago)

${data.summary}

Analyzed ${data.articleCount} articles from ${data.source}

Next update in ${INTERVAL - (timeAgo % INTERVAL)} minutes`);
    }
    
    // Unknown manual command
    return resp.text("Unknown command. Try 'test fetch' or 'show digest'");
  }
  
  // Fallback for any other trigger type
  return resp.text("This agent responds to cron triggers and manual DevMode commands.");
}