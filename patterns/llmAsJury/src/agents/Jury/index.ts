import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';


let anthropicClient: Anthropic | null = null;
try {
  anthropicClient = new Anthropic();
} catch (error) {
  console.error('Failed to initialize Anthropic client. Claude evaluation will be skipped.');
}

// Define the evaluation schema for structured output
const evaluationSchema = z.object({
  clarity: z.number().min(1).max(10).describe('Score for clarity (1-10)'),
  structure: z.number().min(1).max(10).describe('Score for structure (1-10)'), 
  engagement: z.number().min(1).max(10).describe('Score for engagement (1-10)'),
  technical: z.number().min(1).max(10).describe('Score for technical accuracy (1-10)'),
  overall: z.number().min(1).max(10).describe('Overall score (1-10)'),
  explanation: z.string().describe('Detailed explanation of the evaluation with reasoning for each score')
});

type EvaluationResult = z.infer<typeof evaluationSchema>;

export const welcome = () => {
  return {
    welcome:
      'Welcome to the Multi-Model AI Jury! I evaluate content using different AI models like GPT-4, Claude, and others to provide a balanced assessment.',
    prompts: [
      {
        data: 'Paste your blog post or article here for evaluation by multiple AI models.',
        contentType: 'text/plain',
      }
    ],
  };
};

export default async function JuryAgent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    // Get the blog post content from the request
    const blogPost = await req.data.text();
    
    if (!blogPost || blogPost.trim() === '') {
      return resp.text('No content was provided for evaluation.');
    }
    
    // Check if this is a handoff from ContentWriter
    const source = req.get('source') as string;
    const topic = req.get('topic') as string;
    const isHandoff = source === 'ContentWriter';
    
    if (isHandoff) {
      ctx.logger.info(`Received handoff from ContentWriter with topic: ${topic}`);
    } else {
      ctx.logger.info('Evaluating content submitted directly');
    }
    
    ctx.logger.info('Evaluating content with multiple AI models');
    
    // Define our evaluation criteria for each model
    const evaluationPrompt = `
    Evaluate the following content on a scale of 1-10 for these criteria:
    - Clarity: How clear and understandable is the content?
    - Structure: How well-organized is the content?
    - Engagement: How engaging and interesting is the content?
    - Technical accuracy: How factually accurate is the content?
    
    For each criterion, provide a score out of 10. Also provide an overall score that averages all criteria.
    
    For the explanation, use this exact format:
    "Clarity: [Brief 1-2 sentence explanation of clarity score]
    
    Structure: [Brief 1-2 sentence explanation of structure score]
    
    Engagement: [Brief 1-2 sentence explanation of engagement score]
    
    Technical Accuracy: [Brief 1-2 sentence explanation of technical score]
    
    Overall: [Brief summary of overall assessment]"
    
    Content to evaluate:
    ${blogPost}
    `;
    
    // Create different model judges
    // GPT-4o mini as first judge
    const gpt4oMiniJudge = new Agent({
      name: 'GPT-4o Mini',
      instructions: 'You are a precise and thorough evaluator of written content.',
      model: openai('gpt-4o-mini'),
    });
    
    // GPT-4 as second judge
    const gpt4Judge = new Agent({
      name: 'GPT-4',
      instructions: 'You are a critical and detailed evaluator of content who focuses on technical merits.',
      model: openai('gpt-4o'), // Using gpt-4o as our most capable OpenAI model
    });
    
    // Array to collect model evaluations
    const modelEvaluations: Array<{name: string; evaluation: EvaluationResult}> = [];
    
    // Run OpenAI model evaluations in parallel with structured output
    const [gpt4oMiniResult, gpt4Result] = await Promise.all([
      gpt4oMiniJudge.generate(evaluationPrompt, { output: evaluationSchema }),
      gpt4Judge.generate(evaluationPrompt, { output: evaluationSchema })
    ]);
    
    // Add OpenAI model results
    modelEvaluations.push({
      name: 'GPT-4o Mini',
      evaluation: gpt4oMiniResult.object as EvaluationResult
    });
    
    modelEvaluations.push({
      name: 'GPT-4',
      evaluation: gpt4Result.object as EvaluationResult
    });
    
    // Check if Claude is available and use it
    if (anthropicClient) {
      try {
        // Use Claude API directly with request for JSON output
        const claudeResponse = await anthropicClient.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          system: 'You are a critical evaluator of written content. You MUST respond with ONLY valid JSON - no additional text, explanations, or formatting. Return only the JSON object.',
          messages: [
            {
              role: 'user',
              content: `${evaluationPrompt}

IMPORTANT: Respond with ONLY valid JSON. Do not include any text before or after the JSON. Do not use markdown formatting.

Required JSON format:
{
  "clarity": 7.5,
  "structure": 8.0,
  "engagement": 6.0,
  "technical": 9.0,
  "overall": 7.6,
  "explanation": "Clarity: Brief explanation.\\n\\nStructure: Brief explanation.\\n\\nEngagement: Brief explanation.\\n\\nTechnical Accuracy: Brief explanation.\\n\\nOverall: Brief summary."
}`
            }
          ]
        });
        
        // Safely extract Claude's text response
        let claudeText = '';
        
        // Handle Claude API response carefully to avoid type errors
        try {
          if (claudeResponse?.content && Array.isArray(claudeResponse.content) && claudeResponse.content.length > 0) {
            // Claude API returns content as an array of blocks
            const firstContent = claudeResponse.content[0];
            
            // Check if it's a text block with a text property
            if (firstContent && typeof firstContent === 'object' && 'type' in firstContent && firstContent.type === 'text') {
              claudeText = String(firstContent.text || '');
            }
          }
        } catch (parseError) {
          ctx.logger.error('Error parsing Claude response:', parseError);
        }
        
        // Try to parse Claude's JSON response
        let claudeEvaluation: EvaluationResult;
        try {
          // First, try to extract JSON from Claude's response if it's wrapped in other text
          let jsonString = claudeText.trim();
          
          // Look for JSON object boundaries
          const jsonStart = jsonString.indexOf('{');
          const jsonEnd = jsonString.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1) {
            jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
          }
          
          const parsedResponse = JSON.parse(jsonString);
          
          // Validate and clean the explanation to prevent JSON issues
          let explanation = String(parsedResponse.explanation || '');
          if (explanation.length > 2000) {
            explanation = explanation.substring(0, 2000) + '...';
          }
          
          claudeEvaluation = {
            clarity: Number(parsedResponse.clarity) || 0,
            structure: Number(parsedResponse.structure) || 0,
            engagement: Number(parsedResponse.engagement) || 0,
            technical: Number(parsedResponse.technical) || 0,
            overall: Number(parsedResponse.overall) || 0,
            explanation: explanation
          };
        } catch (jsonError) {
          ctx.logger.error('Error parsing Claude JSON response:', jsonError);
          ctx.logger.error('Claude raw response:', claudeText.substring(0, 500)); // Log first 500 chars
          
          // If JSON parsing fails, create a fallback evaluation with default scores
          claudeEvaluation = {
            clarity: 0,
            structure: 0,
            engagement: 0,
            technical: 0,
            overall: 0,
            explanation: `Claude evaluation could not be parsed as structured data. This usually means Claude's response contained formatting issues. Raw response preview: ${claudeText.substring(0, 200)}...`
          };
        }
        
        // Add Claude result
        modelEvaluations.push({
          name: 'Claude (Anthropic)',
          evaluation: claudeEvaluation
        });
      } catch (error) {
        ctx.logger.error('Error using Claude API:', error);
        modelEvaluations.push({
          name: 'Claude (Anthropic) - Error',
          evaluation: {
            clarity: 0,
            structure: 0,
            engagement: 0,
            technical: 0,
            overall: 0,
            explanation: 'Claude evaluation failed. This model may require API credentials to be configured.'
          } as EvaluationResult
        });
      }
    } else {
      modelEvaluations.push({
        name: 'Claude (Anthropic) - Not Available',
        evaluation: {
          clarity: 0,
          structure: 0,
          engagement: 0,
          technical: 0,
          overall: 0,
          explanation: 'Claude evaluation was skipped. This model requires API credentials to be configured.'
        } as EvaluationResult
      });
    }
    
    // Calculate average scores across available models
    const validEvaluations = modelEvaluations.filter(model => 
      !model.name.includes('Not Available') && 
      !model.name.includes('Error') && 
      model.evaluation.overall > 0
    );
    
    const totalModels = validEvaluations.length;
    const avgClarity = validEvaluations.reduce((sum, model) => sum + model.evaluation.clarity, 0) / totalModels;
    const avgStructure = validEvaluations.reduce((sum, model) => sum + model.evaluation.structure, 0) / totalModels;
    const avgEngagement = validEvaluations.reduce((sum, model) => sum + model.evaluation.engagement, 0) / totalModels;
    const avgTechnical = validEvaluations.reduce((sum, model) => sum + model.evaluation.technical, 0) / totalModels;
    
    // Calculate overall average score
    const overallScore = ((avgClarity + avgStructure + avgEngagement + avgTechnical) / 4).toFixed(1);
    
    // Start with the article itself
    let formattedResponse = `
ARTICLE TO EVALUATE
-------------------

${blogPost}

`;

    // Add the evaluation header
    formattedResponse += `
MULTI-MODEL AI JURY EVALUATION
-------------------------------

`;

    // Add topic information if provided by ContentWriter
    if (isHandoff && topic) {
      formattedResponse += `Topic: ${topic}

`;
    }

    formattedResponse += `Overall Consensus Score: ${overallScore}/10

`;

    // Add each model's evaluation with better formatting
    modelEvaluations.forEach((model, index) => {
      // Skip Claude if it's not available or errored
      if (model.name.includes('Not Available') || model.name.includes('Error')) {
        return;
      }

      formattedResponse += `
${index + 1}. ${model.name.toUpperCase()}
${'-'.repeat(model.name.length + 3)}

Scores:
  Clarity: ${model.evaluation.clarity.toFixed(1)}/10
  Structure: ${model.evaluation.structure.toFixed(1)}/10
  Engagement: ${model.evaluation.engagement.toFixed(1)}/10
  Technical: ${model.evaluation.technical.toFixed(1)}/10
  Overall: ${model.evaluation.overall.toFixed(1)}/10

${model.evaluation.explanation}

`;
    });
    
    // Add consensus scores
    formattedResponse += `
CONSENSUS SUMMARY
-----------------

  Clarity:      ${avgClarity.toFixed(1)}/10
  Structure:    ${avgStructure.toFixed(1)}/10 
  Engagement:   ${avgEngagement.toFixed(1)}/10
  Technical:    ${avgTechnical.toFixed(1)}/10
  Overall Avg:  ${overallScore}/10
`;

  
   
    
    // Return formatted text response
    return resp.text(formattedResponse);
  } catch (error) {
    ctx.logger.error('Error evaluating with multi-model jury:', error);
    return resp.text('Sorry, there was an error running the AI Jury evaluation.');
  }
}

