import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

// Custom error class for validation errors
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Custom error class for business logic errors
class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export default async function handler(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext,
) {
  try {
    // Get the request data
    const data = request.json();
    const { action, userId, amount } = data;

    // Validate required fields
    if (!action) {
      throw new ValidationError('Action is required');
    }

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Process based on action
    switch (action) {
      case 'withdraw': {
        // Validate amount for withdrawal
        if (!amount || typeof amount !== 'number') {
          throw new ValidationError('Amount must be a valid number');
        }

        if (amount <= 0) {
          throw new ValidationError('Amount must be greater than zero');
        }

        // Simulate a business logic error (insufficient funds)
        if (amount > 1000) {
          throw new BusinessError('Insufficient funds');
        }

        // Process successful withdrawal
        return response.json({
          success: true,
          message: `Successfully withdrew $${amount}`,
          transactionId: `txn-${Date.now()}`
        });
      }
      case 'deposit': {
        // Validate amount for deposit
        if (!amount || typeof amount !== 'number') {
          throw new ValidationError('Amount must be a valid number');
        }

        if (amount <= 0) {
          throw new ValidationError('Amount must be greater than zero');
        }

        // Process successful deposit
        return response.json({
          success: true,
          message: `Successfully deposited $${amount}`,
          transactionId: `txn-${Date.now()}`
        });
      }
      default:
        throw new ValidationError(`Unsupported action: ${action}`);
    }
  } catch (error) {
    // Log the error
    context.logger.error('Error processing request', error);

    // Handle different types of errors
    if (error instanceof ValidationError) {
      return response.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }

    if (error instanceof BusinessError) {
      return response.status(403).json({
        success: false,
        error: 'Business Rule Violation',
        message: error.message
      });
    }

    // Handle unexpected errors
    return response.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
}
