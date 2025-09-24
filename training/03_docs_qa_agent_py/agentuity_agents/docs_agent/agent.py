import json
from datetime import datetime
from typing import Dict, Any, List
from agentuity import AgentRequest, AgentResponse, AgentContext
from openai import AsyncOpenAI

# Initialize OpenAI client
client = AsyncOpenAI()

# Storage name constants for easy management
OBJECT_STORAGE_BUCKET = 'python-docs'
VECTOR_STORAGE_NAME = 'python-docs-sections'  # Separated sections of uploaded docs
KV_STORAGE_NAME = 'python-query-history'

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        # Get text content - works for both file uploads and search queries
        text_content = await request.data.text()

        # Detect if this is the llms.txt file
        starts_with_agentuity = text_content.startswith('# Agentuity')
        has_features = '## Features' in text_content or '## Product Features' in text_content
        has_about = '## About' in text_content
        is_file_upload = starts_with_agentuity and has_features and has_about

        if is_file_upload:
            # Handle file (`llms.txt`) upload in DevMode UI
            context.logger.info('Request type: upload (file content patterns detected)')

            # Convert text to binary using UTF-8 encoding to preserve special characters (—, ', emojis, etc.)
            binary_data = text_content.encode('utf-8')

            # Generate a unique key for the file to be stored in Object Storage
            key = f"llms-{int(datetime.now().timestamp() * 1000)}.txt"

            # Store binary data directly in Object Storage
            await context.objectstore.put(OBJECT_STORAGE_BUCKET, key, binary_data)
            context.logger.info(f"Stored file in Object Storage: {key}")

            # Create a public URL for the file (valid for 1 hour)
            public_url = await context.objectstore.create_public_url(OBJECT_STORAGE_BUCKET, key)

            # PHASE 1: Add Vector Storage
            # Split the text into sections based on the ## headers

            # Find the exact positions of the main ## headers
            features_index = text_content.find('## Product Features')
            if features_index == -1:  # Fallback to just '## Features' if 'Product Features' not found
                features_index = text_content.find('## Features')
            core_benefits_index = text_content.find('## Core Benefits')
            about_index = text_content.find('## About')
            blog_index = text_content.find('## Blog Posts')

            context.logger.info(f"Section indices - Product Features: {features_index}, Core Benefits: {core_benefits_index}, About: {about_index}, Blog: {blog_index}")

            # Create the 5 major sections based on these positions
            sections = [
                text_content[:features_index].strip(),  # Intro
                text_content[features_index:core_benefits_index].strip(),  # Product Features section
                text_content[core_benefits_index:about_index].strip(),  # Core Benefits section
                text_content[about_index:blog_index].strip(),  # About section
                text_content[blog_index:].strip()  # Blog Posts
            ]

            # Section titles for metadata
            section_titles = ['Introduction', 'Product Features', 'Core Benefits', 'About', 'Blog Posts']

            # Store each section in vector storage
            vector_ids = []
            context.logger.info(f"Starting to index {len(sections)} sections in vector storage")

            for i in range(len(sections)):
                section_content = sections[i]
                section_title = section_titles[i]

                # Make sure we have valid data
                if not section_content or not section_title:
                    context.logger.error(f"Missing data for section {i}")
                    continue

                # Prepare the vector upsert parameters
                # - key: unique identifier for this vector
                # - document: text that gets converted to embeddings for semantic search
                # - metadata: additional data returned when searching (used by the LLM when generating responses)
                vector_params = {
                    "key": f"{key}-section-{i}",   # Unique key for each vector
                    "document": section_content,   # Text for embedding generation
                    "metadata": {
                        "source": key,
                        "sectionIndex": i,
                        "sectionTitle": section_title,
                        # Store full content in metadata for AI context (vector.search only returns metadata, not documents)
                        "content": section_content
                    }
                }

                # Upsert (add or update vectors) to vector storage - returns array of IDs
                ids = await context.vector.upsert(VECTOR_STORAGE_NAME, [vector_params])
                vector_ids.extend(ids)
                context.logger.info(f"Indexed section {i}: {section_title}")

            context.logger.info(f"Successfully indexed {len(vector_ids)} sections in vector storage")

            # Return enhanced response showing both storages
            return response.json({
                "mode": "upload",
                "message": "File processed and stored successfully!",
                "storage": {
                    "object": {
                        "bucket": OBJECT_STORAGE_BUCKET,
                        "key": key,
                        "size": f"{len(binary_data)} bytes",
                        "publicUrl": public_url
                    },
                    "vector": {
                        "collection": VECTOR_STORAGE_NAME,
                        "sectionsIndexed": len(sections),
                        "vectorIds": vector_ids
                    }
                }
            })

        else:
            # Handle user query in DevMode UI
            context.logger.info(f"Request type: search (query: {text_content})")

            # Search vector storage for relevant content (returns metadata)
            search_results = await context.vector.search(
                VECTOR_STORAGE_NAME,
                query=text_content,
                limit=3,
                similarity=0.5  # Minimum similarity threshold
            )

            context.logger.info(f"Found {len(search_results)} results for query: {text_content}")

            # Use KV storage to track user queries
            existing_queries = await context.kv.get(KV_STORAGE_NAME, 'python-user-queries')
            query_history = []

            if existing_queries.exists:
                query_history = await existing_queries.data.json()

            # Add this query to the history with readable timestamp
            query_history.append({
                "query": text_content,
                "timestamp": datetime.now().strftime("%H:%M:%S"),  # Readable time format
                "results": len(search_results),
                "topResult": search_results[0].metadata.get('sectionTitle', 'none') if search_results else 'none'
            })

            # Store the updated history with nicer formatting
            await context.kv.set(KV_STORAGE_NAME, 'python-user-queries',
                json.dumps(query_history, indent=2))

            # Build context for LLM using most relevant results (top 2 sections/chunks from vector storage)
            context_sections = []
            for result in search_results[:2]:  # Use top 2 results for context
                content = result.metadata.get('content', '') if result.metadata else ''
                if content:  # Remove any empty results
                    context_sections.append(content)

            context_text = "\n\n".join(context_sections)

            # Generate response from the LLM
            try:
                ai_result = await client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": "Answer questions about Agentuity based on the documentation provided."
                        },
                        {
                            "role": "user",
                            "content": f"""Answer this question about Agentuity based on the documentation provided.

Documentation context:
{context_text or 'No relevant documentation found.'}

Question: {text_content}

Provide a helpful, concise answer in 2-3 sentences. If no context is available, politely indicate that."""
                        }
                    ]
                )

                ai_answer = ai_result.choices[0].message.content.strip()
                context.logger.info(f'Generated AI answer for query (length: {len(ai_answer)} chars)')

            except Exception as e:
                context.logger.error(f"AI generation failed: {e}")
                context.logger.error(f"Error type: {type(e).__name__}")
                ai_answer = "I encountered an error generating a response. Please try again."

            # Return the LLM's response
            return response.text(ai_answer)

    except Exception as e:
        context.logger.error(f"Error running agent: {e}")
        context.logger.error(f"Error type: {type(e).__name__}")
        import traceback
        context.logger.error(f"Traceback: {traceback.format_exc()}")
        return response.json({
            "message": "Error processing request",
            "error": str(e)
        })


def split_document_into_sections(content: str) -> List[Dict[str, str]]:
    """Split a document into logical sections based on ## headers."""
    sections = []

    # Find all ## headers
    import re
    header_pattern = r'^## (.+)$'
    matches = list(re.finditer(header_pattern, content, re.MULTILINE))

    if not matches:
        # No sections found, treat entire document as one section
        sections.append({
            "title": "Complete Document",
            "content": content
        })
        return sections

    # Add introduction section (content before first header)
    if matches[0].start() > 0:
        intro_content = content[:matches[0].start()].strip()
        if intro_content:
            sections.append({
                "title": "Introduction",
                "content": intro_content
            })

    # Process each section
    for i, match in enumerate(matches):
        title = match.group(1).strip()
        start_pos = match.start()
        end_pos = matches[i + 1].start() if i + 1 < len(matches) else len(content)

        section_content = content[start_pos:end_pos].strip()
        if section_content:
            sections.append({
                "title": title,
                "content": section_content
            })

    return sections


def welcome():
    return {
        "welcome": "Welcome! I can help you store and search documentation. Upload a file to index it, or ask me questions about the content.",
        "prompts": [
            {
                "data": "What is Agentuity?",
                "contentType": "text/plain"
            },
            {
                "data": "What is the AI gateway?",
                "contentType": "text/plain"
            },
            {
                "data": "Are there any blogs covering agent to agent communication?",
                "contentType": "text/plain"
            }
        ]
    }
