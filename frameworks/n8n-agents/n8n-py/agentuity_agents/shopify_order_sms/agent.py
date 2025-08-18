from agentuity import AgentRequest, AgentResponse, AgentContext
from anthropic import AsyncAnthropic
from pinecone import Pinecone
import json
import hashlib
import os

client = AsyncAnthropic()

# Initialize Pinecone client (API key should be in environment)
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY", "dummy-key-for-demo"))
index_name = "shopify-order-sms"

def welcome():
    return {
        "welcome": "Welcome to the Shopify Order SMS Agent! I process Shopify order data and generate SMS notifications.",
        "prompts": [
            {
                "data": '{"id": "12345", "customer": {"first_name": "John", "last_name": "Doe", "phone": "+1234567890"}, "total_price": "99.99", "line_items": [{"title": "Test Product", "quantity": 1}]}',
                "contentType": "application/json"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    """
    Shopify Order SMS workflow implementation using Agentuity
    
    This agent processes Shopify order data and generates SMS notifications.
    """
    
    try:
        # Get webhook data - handle both JSON and text input
        user_input = await request.data.text() or ""
        
        # Try to parse as JSON first
        try:
            webhook_data = json.loads(user_input)
        except json.JSONDecodeError:
            # If not JSON, treat as raw text
            webhook_data = {"test_input": user_input}
        
        if not webhook_data:
            return response.text("No webhook data received. Please provide Shopify order data as JSON.")
        
        context.logger.info(f"Processing Shopify order data")
        
        # Process order data 
        order_text = json.dumps(webhook_data, indent=2)
        
        # Store in Pinecone vector database
        await store_in_pinecone(order_text, webhook_data, context)
        
        # Query relevant context from Pinecone
        relevant_context = await query_pinecone(order_text, context)
        
        # Process with RAG agent using Anthropic Claude
        result = await client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            messages=[
                {
                    "role": "user",
                    "content": f"You are generating an SMS message for a Shopify customer about their order. Respond with ONLY the SMS text - no explanations or additional content.\n\nCreate an SMS that includes:\n1. Hello + customer's first name\n2. If there are previous orders in the context, add a personalized message like 'Thanks for being a loyal customer!'\n3. Itemized receipt of their most recent order:\n   - Order number\n   - Each item with quantity and price\n   - Total amount\n\nKeep it concise and friendly. SMS character limit applies.\n\nOrder data and context:\n{relevant_context}"
                }
            ]
        )
        
        if result.content[0].type == "text":
            processed_result = result.content[0].text
            context.logger.info(f"Agent processed content successfully")
        else:
            processed_result = "Error processing with RAG agent"
        
        # The SMS text from the agent can be set up easily with Agentuity's SMS Outbound IO. No setup needed in code!
        return response.text(processed_result)
        
    except Exception as e:
        error_msg = f"Error processing Shopify order SMS: {str(e)}"
        context.logger.error(error_msg)
        return response.text(f"Error: {error_msg}")

async def ensure_pinecone_index(context: AgentContext):
    """
    Ensure the Pinecone index exists with integrated embeddings
    """
    try:
        # Check if index exists
        if not pc.has_index(index_name):
            context.logger.info(f"Creating Pinecone index: {index_name}")
            # Create index with integrated embedding model
            pc.create_index_for_model(
                name=index_name,
                cloud="aws",
                region="us-east-1",
                embed={
                    "model": "llama-text-embed-v2",  # Using Pinecone's integrated model
                    "field_map": {"text": "chunk_text"}
                }
            )
        return True
    except Exception as e:
        context.logger.error(f"Error with Pinecone index: {e}")
        return False


async def store_in_pinecone(order_text: str, metadata: dict, context: AgentContext):
    """
    Store order data in Pinecone vector database
    """
    try:
        # Ensure index exists
        if not await ensure_pinecone_index(context):
            context.logger.warning("Pinecone index not available, skipping vector storage")
            return
        
        # Get the index
        dense_index = pc.Index(index_name)
        
        # Prepare record for upsert
        record_id = hashlib.md5(order_text.encode()).hexdigest()[:8]
        record = {
            "_id": f"order_{record_id}",
            "chunk_text": order_text,
            "order_id": metadata.get("id", "unknown"),
            "category": "shopify_order"
        }
        
        # Upsert to Pinecone namespace
        dense_index.upsert_records("shopify-orders", [record])
        context.logger.info(f"Stored order data in Pinecone")
        
    except Exception as e:
        context.logger.error(f"Error storing in Pinecone: {e}")


async def query_pinecone(query_text: str, context: AgentContext, top_k: int = 5) -> str:
    """
    Query Pinecone for relevant context
    """
    try:
        # Ensure index exists
        if not await ensure_pinecone_index(context):
            context.logger.warning("Pinecone index not available, using original text")
            return query_text
        
        # Get the index
        dense_index = pc.Index(index_name)
        
        # Search for relevant context
        results = dense_index.search(
            namespace="shopify-orders",
            query={
                "top_k": top_k,
                "inputs": {
                    "text": query_text
                }
            }
        )
        
        # Extract and combine relevant text 
        if results.get("matches"):
            relevant_texts = []
            for match in results["matches"]:
                if match.get("metadata", {}).get("chunk_text"):
                    relevant_texts.append(match["metadata"]["chunk_text"])
            
            if relevant_texts:
                context.logger.info(f"Found {len(relevant_texts)} relevant records from Pinecone")
                return " ".join(relevant_texts)
        
        # Fallback to original query if no matches
        context.logger.info("No relevant records found, using original query")
        return query_text
        
    except Exception as e:
        context.logger.error(f"Error querying Pinecone: {e}")
        return query_text
