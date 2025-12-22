// TODO - check on object storage

import { createAgent, type AgentContext } from '@agentuity/runtime';
import { s } from '@agentuity/schema';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Storage name constants for easy management
const OBJECT_STORAGE_BUCKET = 'docs';
const VECTOR_STORAGE_NAME = 'docs-chunks'; // Separated sections of the `llms.txt` docs
const KV_STORAGE_NAME = 'user-query-history';

const agent = createAgent('storage-types', {
	description: 'An agent using Vercel AI SDK with OpenAI',
	schema: {
		input: s.object({ textContent: s.string() }),
		output: s.union(
			s.object({
				message: s.string(),
				error: s.string()
			}),
			s.object({
				mode: s.literal('upload'),
				message: s.string(),
				storage: s.object({
					object: s.object({
						bucket: s.string(),
						key: s.string(),
						size: s.string(),
						publicUrl: s.string()
					}),
					vector: s.object({
						collection: s.string(),
						sectionsIndexed: s.number(),
						vectorIds: s.array(s.string())
					})
				})
			}),
			s.string()
		),
	},
	handler: async (ctx, { textContent }) => {
		try {
			// Detect if this is the llms.txt file
			const isFileUpload = textContent.startsWith('# Agentuity') &&
												(textContent.includes('## Features') || textContent.includes('## Product Features')) &&
												textContent.includes('## About');

			if (isFileUpload) {
				/* Handle file (`llms.txt`) upload in DevMode UI*/
				ctx.logger.info('Request type: upload (file content patterns detected)');

				// Convert text to binary using UTF-8 encoding to preserve special characters (—, ', emojis, etc.)
				const binaryData = new TextEncoder().encode(textContent);

				// Generate a unique key for the file to be stored in Object Storage
				const key = `llms-${Date.now()}.txt`;

				ctx.logger.info(`Storing binary data to Object Storage with key: ${key}`);

				// Store binary data directly in Object Storage
				await ctx.objectstore.put(OBJECT_STORAGE_BUCKET, key, binaryData);

				ctx.logger.info(`Successfully stored file in Object Storage: ${key}`);

				// Create a public URL for the file (valid for 1 hour)
				const publicUrl = await ctx.objectstore.createPublicURL(OBJECT_STORAGE_BUCKET, key);

				// PHASE 1: Add Vector Storage
				/* Split the text into sections based on the ## headers */

				// Find the exact positions of the main ## headers
				let featuresIndex = textContent.indexOf('## Product Features');
				if (featuresIndex === -1) {  // Fallback to just '## Features' if 'Product Features' not found
					featuresIndex = textContent.indexOf('## Features');
				}
				const coreBenefitsIndex = textContent.indexOf('## Core Benefits');
				const aboutIndex = textContent.indexOf('## About');
				const blogIndex = textContent.indexOf('## Blog Posts');

				// Create the 5 major sections based on these positions
				const sections: string[] = [
					textContent.substring(0, featuresIndex).trim(),  // Intro
					textContent.substring(featuresIndex, coreBenefitsIndex).trim(),  // Product Features section
					textContent.substring(coreBenefitsIndex, aboutIndex).trim(),  // Core Benefits section
					textContent.substring(aboutIndex, blogIndex).trim(),  // About section
					textContent.substring(blogIndex).trim()  // Blog Posts
				];

				// Section titles for metadata
				const sectionTitles = ['Introduction', 'Product Features', 'Core Benefits', 'About', 'Blog Posts'];

				// Store each section in vector storage
				const vectorIds: VectorUpsertResult[] = [];
				ctx.logger.info(`Starting to index ${sections.length} sections in vector storage`);

				for (let i = 0; i < sections.length; i++) {
					const sectionContent = sections[i];
					const sectionTitle = sectionTitles[i];

					// Make sure we have valid data
					if (!sectionContent || !sectionTitle) {
						ctx.logger.error(`Missing data for section ${i}`);
						continue;
					}

					// Prepare the vector upsert parameters
					// - key: unique identifier for this vector
					// - document: text that gets converted to embeddings for semantic search
					// - metadata: additional data returned when searching (used by the LLM when generating responses)
					const vectorParams = {
						key: `${key}-section-${i}`,   // Unique key for each vector
						document: sectionContent,     // Text for embedding generation
						metadata: {
							source: key,
							sectionIndex: i,
							sectionTitle: sectionTitle,
							// Store full content in metadata for AI context (vector.search only returns metadata, not documents)
							content: sectionContent
						}
					};

					ctx.logger.info(`Indexing section ${i}: ${sectionTitle} (${sectionContent.length} chars)`);

					// Upsert (add or update vectors) to vector storage - returns array of IDs
					const ids = await ctx.vector.upsert(VECTOR_STORAGE_NAME, vectorParams);
					vectorIds.push(...ids);
				}

				ctx.logger.info(`Successfully indexed ${vectorIds.length} sections in vector storage`);

				// Return enhanced response showing both storages
				return {
					mode: 'upload',
					message: 'File processed and stored successfully!',
					storage: {
						object: {
							bucket: OBJECT_STORAGE_BUCKET,
							key: key,
							size: `${binaryData.byteLength} bytes`,
							publicUrl: publicUrl
						},
						vector: {
							collection: VECTOR_STORAGE_NAME,
							sectionsIndexed: sections.length,
							vectorIds: vectorIds
						}
					}
				};

			} else {
				/* Handle user query in DevMode UI */
				ctx.logger.info(`Request type: search (query: ${textContent})`);

				// Search vector storage for relevant content (returns metadata)
				const searchResults = await ctx.vector.search(VECTOR_STORAGE_NAME, {
					query: textContent,
					limit: 3,
					similarity: 0.5  // Minimum similarity threshold
				});

				ctx.logger.info(`Found ${searchResults.length} results for query: ${textContent}`);

				/* Use KV storage to track user queries */
				// Store all queries in one place for easy viewing
				const existingQueries = await ctx.kv.get(KV_STORAGE_NAME, 'demo-user-queries');
				const queryHistory = existingQueries.exists
					? await existingQueries.data.json() as any[]
					: [];

				// Add this query to the history with readable timestamp
				queryHistory.push({
					query: textContent,
					timestamp: new Date().toLocaleTimeString(),  // Readable time format
					results: searchResults.length,
					topResult: searchResults[0]?.metadata?.sectionTitle || 'none'
				});

				// Store the updated history with nicer formatting
				await ctx.kv.set(KV_STORAGE_NAME, 'demo-user-queries',
					JSON.stringify(queryHistory, null, 2));

				ctx.logger.info(`Query tracked in KV storage (${queryHistory.length} total queries)`);

				// Build context for LLM using most relevant results (top 2 sections/chunks from vector storage)
				const context = searchResults
					.slice(0, 2)  // Use top 2 results for context
					.map(result => result.metadata?.content || '')
					.filter(content => content)  // Remove any empty results
					.join('\n\n');

				// Generate response from the LLM
				const { text: aiAnswer } = await generateText({
					model: openai('gpt-5-nano'),
					prompt: `Answer this question about Agentuity based on the documentation provided.

Documentation context:
${context || 'No relevant documentation found.'}

Question: ${textContent}

Provide a helpful, concise answer in 2-3 sentences. If no context is available, politely indicate that.`
				});

				ctx.logger.info('Generated AI answer for query');

				// Return the LLM's response
				return aiAnswer;
			}
		} catch (error) {
			ctx.logger.error('Error running agent:', error);
			return {
				message: 'Error processing file',
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	},
});

export default agent;
