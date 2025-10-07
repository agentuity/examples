import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { Agent as MastraAgent } from '@mastra/core/agent';
import { RuntimeContext } from '@mastra/core/runtime-context';

type SupportRuntimeContext = {
  'user-tier': 'free' | 'pro' | 'enterprise';
  language: 'en' | 'es' | 'ja';
};

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Mastra Dynamic Context Agent! I provide technical support for Mastra Cloud with responses adapted to your subscription tier and preferred language.',
    prompts: [
      {
        data: JSON.stringify({
          prompt: 'Can Mastra Cloud handle long-running requests?',
          userTier: 'free',
          language: 'en',
        }),
        contentType: 'text/plain',
      },
      {
        data: JSON.stringify({
          prompt: '¿Cuáles son las mejores prácticas para escalar agentes?',
          userTier: 'pro',
          language: 'es',
        }),
        contentType: 'text/plain',
      },
      {
        data: JSON.stringify({
          prompt: 'エンタープライズプランの機能について教えてください',
          userTier: 'enterprise',
          language: 'ja',
        }),
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
    const requestText = await req.data.text();
    let prompt = requestText;
    let userTier: 'free' | 'pro' | 'enterprise' = 'free';
    let language: 'en' | 'es' | 'ja' = 'en';

    try {
      const requestData = JSON.parse(requestText);
      prompt = requestData.prompt || requestText;
      userTier = requestData.userTier || 'free';
      language = requestData.language || 'en';
    } catch {
      ctx.logger.info('Using plain text input with default context values');
    }

    const runtimeContext = new RuntimeContext<SupportRuntimeContext>();
    runtimeContext.set('user-tier', userTier);
    runtimeContext.set('language', language);

    const agent = new MastraAgent({
      name: 'support-agent',
      instructions: async ({ runtimeContext: rc }) => {
        const tier = rc.get('user-tier');
        const lang = rc.get('language');

        return `You are a customer support agent for Mastra Cloud (https://mastra.ai/en/docs/mastra-cloud/overview).
The current user is on the ${tier} tier.

Support guidance:
${tier === 'free' ? '- Give basic help and link to documentation.' : ''}
${tier === 'pro' ? '- Offer detailed technical support and best practices.' : ''}
${tier === 'enterprise' ? '- Provide priority assistance with tailored solutions.' : ''}

Always respond in ${lang === 'en' ? 'English' : lang === 'es' ? 'Spanish' : 'Japanese'}.`;
      },
      model: openai('gpt-4o'),
    });

    const result = await agent.generate(prompt, {
      runtimeContext,
      maxSteps: 5,
    });

    return resp.text(result.text ?? 'No response generated');
  } catch (error) {
    ctx.logger.error('Error running dynamic context agent:', error);
    return resp.text(
      'Sorry, there was an error processing your request. Please try again.'
    );
  }
}
