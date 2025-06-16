from agentuity import AgentRequest, AgentResponse, AgentContext  
from openai import AsyncOpenAI  
from mem0 import MemoryClient  
import os  
from dotenv import load_dotenv  
  
load_dotenv()  
  
# Initialize clients
client = AsyncOpenAI()
USER_ID = "mem0-demo-agent"
memory_client = MemoryClient()  
  
# System instructions for the assistant  
SYSTEM_INSTRUCTIONS = """You are a helpful Best Buy customer service AI assistant with expertise in electronics recommendations.   
  
Key capabilities:  
- Provide personalized product recommendations based on budget, use case, and preferences  
- Explain WHY each product is a good fit for the customer's specific needs  
- Ask follow-up questions to better understand requirements  
- Remember customer preferences from previous conversations  
- Compare products with pros/cons  
- Suggest alternatives at different price points  
  
Always be enthusiastic, knowledgeable, and helpful. Use emojis occasionally to make conversations engaging."""  
  
# Product Database  
PRODUCT_DATABASE = {  
    "laptops": [  
        {  
            "name": "MacBook Air M3",  
            "price": 1099,  
            "category": "laptop",  
            "specs": "13.6\" display, M3 chip, 8GB RAM, 256GB SSD",  
            "use_cases": ["student", "professional", "creative", "lightweight"],  
            "pros": ["Excellent battery life", "Silent operation", "Premium build quality"],  
            "cons": ["Limited ports", "Not upgradeable"]  
        },  
        {  
            "name": "Dell XPS 13",  
            "price": 899,  
            "category": "laptop",  
            "specs": "13.4\" display, Intel i7, 16GB RAM, 512GB SSD",  
            "use_cases": ["business", "professional", "student"],  
            "pros": ["Great keyboard", "Compact design", "Good performance"],  
            "cons": ["Average battery life", "Can run warm"]  
        },  
        {  
            "name": "ASUS ROG Strix G15",  
            "price": 1299,  
            "category": "laptop",  
            "specs": "15.6\" 144Hz display, AMD Ryzen 7, RTX 4060, 16GB RAM",  
            "use_cases": ["gaming", "content creation", "heavy workload"],  
            "pros": ["Powerful graphics", "High refresh rate", "Good cooling"],  
            "cons": ["Heavy", "Loud fans under load"]  
        },  
        {  
            "name": "HP Pavilion 15",  
            "price": 549,  
            "category": "laptop",  
            "specs": "15.6\" display, Intel i5, 8GB RAM, 256GB SSD",  
            "use_cases": ["budget", "student", "basic tasks"],  
            "pros": ["Affordable", "Decent performance", "Good value"],  
            "cons": ["Plastic build", "Mediocre display"]  
        }  
    ],  
    "tvs": [  
        {  
            "name": "Sony BRAVIA XR A95L OLED",  
            "price": 2499,  
            "category": "tv",  
            "specs": "65\" 4K OLED, 120Hz, Google TV, HDR10+",  
            "use_cases": ["premium", "movie watching", "gaming", "large room"],  
            "pros": ["Perfect blacks", "Excellent color accuracy", "Premium design"],  
            "cons": ["Expensive", "Risk of burn-in"]  
        },  
        {  
            "name": "Samsung QN90C Neo QLED",  
            "price": 1799,  
            "category": "tv",  
            "specs": "65\" 4K QLED, 120Hz, Tizen OS, Mini LED backlight",  
            "use_cases": ["bright room", "gaming", "sports", "family"],  
            "pros": ["Very bright", "No burn-in risk", "Great for gaming"],  
            "cons": ["Not true blacks like OLED", "Complex interface"]  
        },  
        {  
            "name": "LG C3 OLED",  
            "price": 1499,  
            "category": "tv",  
            "specs": "55\" 4K OLED, 120Hz, webOS, Dolby Vision",  
            "use_cases": ["gaming", "movie watching", "medium room"],  
            "pros": ["Great for gaming", "Excellent picture quality", "Good value OLED"],  
            "cons": ["Potential burn-in", "Not as bright as QLED"]  
        },  
        {  
            "name": "TCL 6-Series",  
            "price": 699,  
            "category": "tv",  
            "specs": "65\" 4K QLED, 60Hz, Roku TV, HDR10+",  
            "use_cases": ["budget", "family", "bedroom", "first 4K TV"],  
            "pros": ["Great value", "User-friendly interface", "Good picture quality"],  
            "cons": ["Limited gaming features", "Slower processor"]  
        }  
    ],  
    "phones": [  
        {  
            "name": "iPhone 15 Pro",  
            "price": 999,  
            "category": "phone",  
            "specs": "6.1\" Super Retina XDR, A17 Pro chip, 128GB, Triple camera",  
            "use_cases": ["premium", "photography", "professional", "ecosystem"],  
            "pros": ["Excellent cameras", "Premium build", "Long software support"],  
            "cons": ["Expensive", "Limited customization"]  
        },  
        {  
            "name": "Samsung Galaxy S24",  
            "price": 799,  
            "category": "phone",  
            "specs": "6.2\" Dynamic AMOLED, Snapdragon 8 Gen 3, 256GB, AI features",  
            "use_cases": ["android", "productivity", "customization", "photography"],  
            "pros": ["Great display", "Versatile cameras", "S Pen support"],  
            "cons": ["Complex interface", "Bloatware"]  
        },  
        {  
            "name": "Google Pixel 8",  
            "price": 699,  
            "category": "phone",  
            "specs": "6.2\" OLED, Google Tensor G3, 128GB, Pure Android",  
            "use_cases": ["photography", "clean android", "AI features"],  
            "pros": ["Best Android cameras", "Clean software", "AI features"],  
            "cons": ["Average battery life", "Limited availability"]  
        },  
        {  
            "name": "iPhone SE",  
            "price": 429,  
            "category": "phone",  
            "specs": "4.7\" Retina HD, A15 Bionic, 64GB, Touch ID",  
            "use_cases": ["budget", "compact", "simple", "first iPhone"],  
            "pros": ["Affordable iPhone", "Compact size", "Reliable performance"],  
            "cons": ["Old design", "Small screen", "Single camera"]  
        }  
    ]  
}  
  
def find_products_by_criteria(category=None, max_price=None, use_cases=None, min_price=0):  
    """Find products matching specific criteria"""  
    matching_products = []  
      
    # Get all products from specified category or all categories  
    if category and category in PRODUCT_DATABASE:  
        products_to_search = PRODUCT_DATABASE[category]  
    else:  
        products_to_search = []  
        for cat_products in PRODUCT_DATABASE.values():  
            products_to_search.extend(cat_products)  
      
    for product in products_to_search:  
        # Check price range  
        if max_price and product["price"] > max_price:  
            continue  
        if product["price"] < min_price:  
            continue  
              
        # Check use cases  
        if use_cases:  
            if any(use_case.lower() in product["use_cases"] for use_case in use_cases):  
                matching_products.append(product)  
        else:  
            matching_products.append(product)  
      
    # Sort by price (ascending)  
    return sorted(matching_products, key=lambda x: x["price"])  
  
def format_product_recommendation(products, context=""):  
    """Format product recommendations in a nice way"""  
    if not products:  
        return "I couldn't find any products matching your criteria. Let me know if you'd like to adjust your requirements!"  
      
    recommendation = f"Here are my top recommendations{' ' + context if context else ''}: 🎯\n\n"  
      
    for i, product in enumerate(products[:3], 1):  # Limit to top 3  
        recommendation += f"**{i}. {product['name']} - ${product['price']:,}**\n"  
        recommendation += f"   📋 {product['specs']}\n"  
        recommendation += f"   ✅ **Why it's great:** {', '.join(product['pros'])}\n"  
        recommendation += f"   ⚠️  **Consider:** {', '.join(product['cons'])}\n\n"  
      
    return recommendation  
  
def welcome():  
    """Welcome function for Agentuity DevMode"""  
    return {  
        "welcome": "Hey there! I'm your personal Best Buy electronics expert! Tell me what you're looking for and I'll help you find the perfect product based on your needs and budget.",  
        "prompts": [  
            {  
                "data": "I need a laptop for college under $800",  
                "contentType": "text/plain"  
            },  
            {  
                "data": "What's the best TV for gaming?",  
                "contentType": "text/plain"  
            },  
            {  
                "data": "Recommend a phone with great camera under $700",  
                "contentType": "text/plain"  
            },  
            {  
                "data": "I'm looking for budget-friendly electronics",  
                "contentType": "text/plain"  
            }  
        ]  
    }  
  
async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):  
    """Main agent function following Agentuity pattern"""  
    try:  
        # Extract user input  
        user_question = await request.data.text()  
          
                # Use the predefined user ID for consistent memory storage
        user_id = USER_ID  
          
        # Log the interaction  
        context.logger.info("Processing Best Buy query: %s", user_question)  
          
        # Get relevant memories from previous conversations  
        try:  
            relevant_memories = memory_client.search(user_question, user_id=user_id)  
            memory_context = "\n".join([m["memory"] for m in relevant_memories])  
        except Exception as mem_error:  
            context.logger.warn("Memory search failed: %s", str(mem_error))  
            memory_context = ""  
          
        # Check if this is a product recommendation request  
        product_keywords = ['recommend', 'suggestion', 'best', 'looking for', 'need', 'want', 'laptop', 'tv', 'phone', 'budget', 'gaming', 'student']  
        is_product_request = any(keyword in user_question.lower() for keyword in product_keywords)  
          
        # Build enhanced prompt based on request type  
        if is_product_request:  
            prompt = f"""Answer the user question considering the previous interactions and available products.  
  
Previous interactions:  
{memory_context}  
  
AVAILABLE PRODUCTS DATABASE:  
You have access to current Best Buy inventory with detailed specs, prices, and recommendations.  
  
Categories available:  
- Laptops: MacBook Air M3 ($1,099), Dell XPS 13 ($899), ASUS ROG Strix G15 ($1,299), HP Pavilion 15 ($549)  
- TVs: Sony BRAVIA XR A95L OLED ($2,499), Samsung QN90C Neo QLED ($1,799), LG C3 OLED ($1,499), TCL 6-Series ($699)    
- Phones: iPhone 15 Pro ($999), Samsung Galaxy S24 ($799), Google Pixel 8 ($699), iPhone SE ($429)  
  
For each product, you know the specs, use cases, pros, and cons. Use this knowledge to make personalized recommendations.  
  
INSTRUCTIONS:  
1. Ask clarifying questions about budget, use case, and preferences if needed  
2. Recommend 2-3 specific products with detailed explanations  
3. Explain WHY each product fits their needs  
4. Include price comparisons and alternatives  
5. Use emojis and engaging language  
  
Question: {user_question}"""  
        else:  
            prompt = f"""Answer the user question considering the previous interactions:  
  
Previous interactions:  
{memory_context}  
  
Question: {user_question}"""  
          
        # Get AI response using OpenAI  
        result = await client.chat.completions.create(  
            model="gpt-4o",  
            messages=[  
                {"role": "system", "content": SYSTEM_INSTRUCTIONS},  
                {"role": "user", "content": prompt}  
            ]  
        )  
          
        answer = result.choices[0].message.content  
          
        # Store interaction in memory for future context  
        try:  
            new_interaction = [  
                {"role": "user", "content": user_question},  
                {"role": "assistant", "content": answer}  
            ]  
            memory_client.add(messages=new_interaction, user_id=user_id)  
        except Exception as mem_error:  
            context.logger.warn("Failed to store memory: %s", str(mem_error))  
          
        context.logger.info("Successfully processed Best Buy query")  
        return response.text(answer)  
          
    except Exception as e:  
        context.logger.error("Error in Best Buy assistant: %s", str(e), exc_info=True)  
        return response.text("Sorry, I encountered an error while helping you find the perfect product. Please try asking again!")