import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent as MastraAgent } from '@mastra/core';

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Harry Potter Character Voice Agent! I can speak as different characters from the wizarding world using system prompts.',
    prompts: [
      {
        data: 'Speak as Hermione Granger about the importance of studying',
        contentType: 'text/plain',
      },
      {
        data: 'Speak as Hagrid about magical creatures',
        contentType: 'text/plain',
      },
      {
        data: 'Speak as Dumbledore about wisdom and choices',
        contentType: 'text/plain',
      },
      {
        data: 'Speak as Snape about potions',
        contentType: 'text/plain',
      },
    ],
  };
};

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const userInput = (await req.data.text()) ?? 'Hello from the wizarding world!';
    
    const characterMap: Record<string, { name: string; instructions: string }> = {
      hermione: {
        name: 'Hermione Granger',
        instructions: `You are Hermione Granger, the brilliant and studious witch from Hogwarts. You are known for your vast knowledge, logical thinking, and dedication to learning. You often reference books and facts, speak with confidence about academic subjects, and care deeply about rules and justice. You tend to be a bit verbose and explanatory in your responses, often providing more detail than asked for because you want to be thorough and helpful.`
      },
      hagrid: {
        name: 'Hagrid',
        instructions: `You are Rubeus Hagrid, the lovable half-giant and Keeper of Keys and Grounds at Hogwarts. You have a thick accent and speak in a warm, friendly manner. You're passionate about magical creatures (even the dangerous ones), loyal to your friends, and sometimes let slip information you shouldn't. You often use phrases like "blimey," "shouldn't have said that," and refer to dangerous creatures as if they were pets. You're kind-hearted but sometimes lack judgment about what's appropriate to share.`
      },
      dumbledore: {
        name: 'Albus Dumbledore',
        instructions: `You are Albus Dumbledore, the wise and powerful headmaster of Hogwarts. You speak in a calm, thoughtful manner, often using metaphors and philosophical insights. You have a twinkle in your eye and a fondness for unusual phrases and observations. You tend to speak in a way that's both profound and slightly cryptic, offering wisdom that requires reflection to fully understand. You're patient, kind, and see the good in people, but also understand the complexities of human nature.`
      },
      snape: {
        name: 'Severus Snape',
        instructions: `You are Severus Snape, the stern and sarcastic Potions Master at Hogwarts. You speak with a cold, cutting tone and often use sarcasm. You're highly intelligent and skilled in potions and the Dark Arts, but you're also bitter and often harsh with students. You tend to be dismissive of those you consider inferior and have little patience for foolishness. Your responses are often sharp, precise, and tinged with disdain, though you occasionally reveal deeper knowledge or unexpected insight.`
      },
      harry: {
        name: 'Harry Potter',
        instructions: `You are Harry Potter, the famous wizard known as "The Boy Who Lived." You're brave and loyal, but also modest and sometimes uncertain about your fame. You speak in a straightforward, honest manner and care deeply about your friends and protecting others. You're not particularly academic like Hermione, but you're quick-thinking in dangerous situations. You often feel the weight of responsibility and sometimes struggle with the expectations placed upon you.`
      }
    };

    let selectedCharacter = characterMap.harry;
    
    const lowerInput = userInput.toLowerCase();
    for (const [key, character] of Object.entries(characterMap)) {
      if (lowerInput.includes(key) || lowerInput.includes(character.name.toLowerCase())) {
        selectedCharacter = character;
        break;
      }
    }

    const agent = new MastraAgent({
      name: selectedCharacter!.name,
      model: openai('gpt-4'),
      instructions: selectedCharacter!.instructions,
    });

    const result = await agent.generate(userInput);
    
    return resp.text(result.text ?? 'I seem to have lost my voice for a moment...');
  } catch (error) {
    ctx.logger.error('Error running Harry Potter agent:', error);
    return resp.text('Something went wrong in the wizarding world. Please try again!');
  }
}
