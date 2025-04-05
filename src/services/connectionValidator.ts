// src/services/connectionValidator.ts
import { ApiSettings } from '@/types';

type ConnectionResult = {
  success: boolean;
  message: string;
  hasGemini2Flash?: boolean; // Optional property for Gemini validation
};

/**
 * Service to validate connections to different AI backends
 */
export const connectionValidator = {
  /**
   * Validate basic n8n connection using our API proxy
   */
  async validateN8nBase(): Promise<ConnectionResult> {
    try {
      // Use our own Next.js API route as a proxy to avoid CORS issues
      const response = await fetch('/api/n8n/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { 
          success: false, 
          message: error.message || `n8n connection Base failed: ${response.status} ${response.statusText}` 
        };
      }
      
      const result = await response.json();
      
      if (!result.n8nAvailable) {
        return {
          success: false,
          message: 'Cannot connect to n8n validateN8nBase webhook. Please ensure n8n is running and accessible.'
        };
      }
      
      return { 
        success: true, 
        message: 'Connected to n8n webhook successfully' 
      };
    } catch (error) {
      console.error('n8n validation error:', error);
      return { 
        success: false, 
        message: `n8n connection error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },
  
  /**
   * Validate OpenAI connection
   */
  async validateOpenAI(): Promise<ConnectionResult> {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey || apiKey.trim() === '') {
      return { 
        success: false, 
        message: 'OpenAI API key not found in environment variables' 
      };
    }
    
    try {
      // We should also handle this through a proxy API route to avoid exposing API keys
      const response = await fetch('/api/openai/validate', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        return { 
          success: false, 
          message: `OpenAI API key is invalid: ${error.message || response.statusText}` 
        };
      }
      
      return { success: true, message: 'OpenAI API key is valid' };
    } catch (error) {
      console.error('OpenAI validation error:', error);
      return { 
        success: false, 
        message: `OpenAI validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },
  
  /**
   * Validate Ollama connection
   */
  async validateOllama(): Promise<ConnectionResult> {
    try {
      // Use a proxy API route for Ollama validation too
      const response = await fetch('/api/ollama/validate', {
        method: 'GET'
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { 
          success: false, 
          message: `Ollama connection failed: ${error.message || response.statusText}` 
        };
      }
      
      return { success: true, message: 'Ollama is running locally' };
    } catch (error) {
      console.error('Ollama validation error:', error);
      return { 
        success: false, 
        message: `Ollama validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },
  
  /**
   * Validate Claude/Anthropic connection
   */
  async validateClaude(): Promise<ConnectionResult> {
    const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    
    if (!apiKey || apiKey.trim() === '') {
      return { 
        success: false, 
        message: 'Claude/Anthropic API key not found in environment variables' 
      };
    }
    
    try {
      // Use a proxy API route for Claude validation
      const response = await fetch('/api/claude/validate', {
        method: 'GET'
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { 
          success: false, 
          message: `Claude/Anthropic API key is invalid: ${error.message || response.statusText}` 
        };
      }
      
      return { success: true, message: 'Claude/Anthropic API key is valid' };
    } catch (error) {
      console.error('Claude validation error:', error);
      return { 
        success: false, 
        message: `Claude/Anthropic validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },

  /**
   * Validate Gemini connection
   */
  async validateGemini(): Promise<ConnectionResult> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    console.log('Validating Gemini API key in connectionValidator service');
    console.log('Gemini API key exists:', !!apiKey);

    if (!apiKey || apiKey.trim() === '') {
      console.error('Gemini API key not found in environment variables');
      return {
        success: false,
        message: 'Gemini API key not found in environment variables'
      };
    }

    try {
      console.log('Calling Gemini validation API endpoint');
      // Use a proxy API route for Gemini validation
      const response = await fetch('/api/gemini/validate', {
        method: 'GET'
      });

      console.log(`Gemini validation API response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.json().catch(e => {
          console.error('Error parsing Gemini validation error response:', e);
          return { message: 'Unknown error' };
        });
        console.error('Gemini validation API error:', error);
        return {
          success: false,
          message: `Gemini API key is invalid: ${error.message || response.statusText}`
        };
      }

      const result = await response.json();
      console.log('Gemini validation API success response:', result);

      return {
        success: true,
        message: result.message || 'Gemini API key is valid',
        hasGemini2Flash: result.hasGemini2Flash
      };
    } catch (error) {
      console.error('Gemini validation error:', error);
      return {
        success: false,
        message: `Gemini validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Validate n8n workflow with specific model type
   */
  async validateN8nWorkflow(workflowType: string): Promise<ConnectionResult> {
    try {
      // Check if specific n8n workflow is available and model API is valid
      const response = await fetch(`/api/n8n/health/${workflowType}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        return { 
          success: false, 
          message: `n8n workflow validateN8nWorkflow FAILED: ${response.status} ${response.statusText}` 
        };
      }
      
      const result = await response.json();
      
      // If n8n is not available, fail fast
      if (!result.n8nAvailable) {
        return {
          success: false,
          message: 'Cannot connect to n8n validateN8nWorkflow webhook. Please ensure n8n is running and accessible.'
        };
      }
      
      // For demo and default, we only need n8n to be available
      if (workflowType === 'demo' || workflowType === 'default') {
        return {
          success: true,
          message: `Connected to n8n ${workflowType} workflow`
        };
      }
      
      // For other workflow types, check if the corresponding model API is available
      if (!result.modelAvailable) {
        return {
          success: true, // Still consider connected since n8n is available
          message: `n8n connected, but ${workflowType} warning: ${result.message || 'Model API is not available'}`
        };
      }
      
      // All good - both n8n and model API are available
      return {
        success: true,
        message: `Connected to n8n ${workflowType} workflow with valid API key`
      };
    } catch (error) {
      console.error(`Error validating n8n ${workflowType} workflow:`, error);
      return { 
        success: false, 
        message: `Error validating n8n ${workflowType} workflow: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },
  
  /**
   * Validate the currently selected backend
   */
  async validateConnection(backendType: string, useDemoMode: boolean, workflowType?: string): Promise<ConnectionResult> {
    console.log('Validating connection:', backendType, useDemoMode, workflowType);
    // If demo mode is enabled, we don't actually connect to any API
    if (useDemoMode) {
      return { success: true, message: 'Connected to Demo Mode' };
    }
    
    // For n8n with a specific workflow type
    if (backendType === 'n8n' && workflowType) {
      return this.validateN8nWorkflow(workflowType);
    }
    
    // For basic n8n
    if (backendType === 'n8n') {
      return this.validateN8nBase();
    }
    
    // For direct connections to other backends
    switch (backendType) {
      case 'openai':
        return this.validateOpenAI();
      case 'ollama':
        return this.validateOllama();
      case 'claude':
        return this.validateClaude();
      case 'gemini':
        return this.validateGemini();
      default:
        return { success: false, message: `Unknown backend type: ${backendType}` };
    }
  }
};