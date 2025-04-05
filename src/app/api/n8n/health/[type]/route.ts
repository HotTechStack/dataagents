import { NextRequest, NextResponse } from 'next/server';

// Environment variables with fallbacks
const N8N_BASE_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:5678';

// Workflow endpoints from environment variables with fallbacks
const DEFAULT_WORKFLOW_ENDPOINT = process.env.NEXT_PUBLIC_N8N_DEFAULT_WORKFLOW || '/webhook/dataengineering-common';
const OPENAI_WORKFLOW_ENDPOINT = process.env.NEXT_PUBLIC_N8N_OPENAI_WORKFLOW || '/webhook/dataengineering-common';
const OLLAMA_WORKFLOW_ENDPOINT = process.env.NEXT_PUBLIC_N8N_OLLAMA_WORKFLOW || '/webhook/dataengineering-common';
const CLAUDE_WORKFLOW_ENDPOINT = process.env.NEXT_PUBLIC_N8N_CLAUDE_WORKFLOW || '/webhook/dataengineering-common';
const GEMINI_WORKFLOW_ENDPOINT = process.env.NEXT_PUBLIC_N8N_GEMINI_WORKFLOW || '/webhook/dataengineering-common';

// Define workflow endpoints mapping
const WORKFLOW_ENDPOINTS: Record<string, string> = {
  'default': DEFAULT_WORKFLOW_ENDPOINT,
  'openai': OPENAI_WORKFLOW_ENDPOINT,
  'ollama': OLLAMA_WORKFLOW_ENDPOINT,
  'claude': CLAUDE_WORKFLOW_ENDPOINT,
  'gemini': GEMINI_WORKFLOW_ENDPOINT,
  'demo': DEFAULT_WORKFLOW_ENDPOINT // Fallback for demo mode
};

/**
 * API route to check the health of a specific n8n workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const workflowType = params.type || 'default';
  
  try {
    console.log(`Checking n8n health for ${workflowType} workflow`);
    console.log(`N8N_BASE_URL: ${N8N_BASE_URL}`);
    
    // First check n8n's health
    // Important: Use /healthz for health checking, not the webhook endpoint
    const healthCheckUrl = `${N8N_BASE_URL}/healthz`;
    
    console.log(`Checking n8n health at ${healthCheckUrl}`);

    // Try to ping the health check endpoint with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(healthCheckUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      console.log(`N8n health check response: ${response.status}`);
      
      // Check if n8n endpoint is available
      const n8nAvailable = response.ok;
      
      if (!n8nAvailable) {
        console.log(`N8n health check failed: ${response.status} ${response.statusText}`);
        return NextResponse.json({
          n8nAvailable: false,
          modelAvailable: false,
          message: `N8n health check failed: ${response.status} ${response.statusText}`,
          workflow: workflowType
        });
      }
      
      // Now also check if the specific model API is available based on workflow type
      let modelCheckResult = {
        available: true,
        message: ""
      };
      
      if (workflowType !== 'default' && workflowType !== 'demo') {
        console.log(`Checking model availability for ${workflowType}`);
        // Check corresponding model API
        switch (workflowType) {
          case 'openai':
            modelCheckResult = await checkOpenAIAvailability();
            break;
          case 'ollama':
            modelCheckResult = await checkOllamaAvailability();
            break;
          case 'claude':
            modelCheckResult = await checkClaudeAvailability();
            break;
          case 'gemini':
            modelCheckResult = await checkGeminiAvailability();
            break;
        }
        console.log(`Model check result for ${workflowType}:`, modelCheckResult);
      }
      
      return NextResponse.json({
        n8nAvailable: true,
        modelAvailable: modelCheckResult.available,
        message: modelCheckResult.message,
        workflow: workflowType
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      console.error(`Error fetching n8n health:`, fetchError);
      
      // If we couldn't connect at all, the service is unavailable
      return NextResponse.json(
        {
          n8nAvailable: false,
          modelAvailable: false,
          workflow: workflowType,
          message: fetchError instanceof Error ? 
            `Error connecting to n8n: ${fetchError.message}` : 
            'Unknown error connecting to n8n'
        }
      );
    }
  } catch (error) {
    console.error(`Error checking n8n health for workflow type ${workflowType}:`, error);
    
    return NextResponse.json(
      {
        n8nAvailable: false,
        modelAvailable: false,
        workflow: workflowType,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    );
  }
}

/**
 * Helper function to check OpenAI API availability
 */
async function checkOpenAIAvailability() {
  const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!openaiKey || openaiKey.trim() === '') {
    return { 
      available: false, 
      message: 'OpenAI API key not found in environment variables'
    };
  }
  
  try {
    // Use OpenAI API to check if the key is valid
    // We make a simple models list request which is lightweight
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return {
        available: true,
        message: 'OpenAI API key is valid'
      };
    } else {
      const error = await response.json();
      return {
        available: false,
        message: `OpenAI API key is invalid: ${error.error?.message || response.statusText}`
      };
    }
  } catch (error) {
    return {
      available: false,
      message: `Error validating OpenAI API key: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Helper function to check Ollama availability
 */
async function checkOllamaAvailability() {
  const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_API_URL;
  
  if (!ollamaUrl) {
    return {
      available: false,
      message: 'Ollama URL not configured in environment variables'
    };
  }
  
  console.log(`Checking Ollama availability at ${ollamaUrl}`);
  
  try {
    // Try to get the list of models from Ollama
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return {
        available: true,
        message: 'Ollama is running and accessible'
      };
    } else {
      return {
        available: false,
        message: `Ollama is not available: ${response.statusText}`
      };
    }
  } catch (error) {
    console.error('Error connecting to Ollama:', error);
    return {
      available: false,
      message: `Error connecting to Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Helper function to check Claude API availability
 */
async function checkClaudeAvailability() {
  const claudeKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  
  if (!claudeKey || claudeKey.trim() === '') {
    return { 
      available: false, 
      message: 'Claude/Anthropic API key not found in environment variables'
    };
  }
  
  try {
    // Check if Claude API key is valid by making a simple request
    // We don't actually complete the request to avoid charges, just check if API key is valid
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return {
        available: true,
        message: 'Claude/Anthropic API key is valid'
      };
    } else {
      const error = await response.json();
      return {
        available: false,
        message: `Claude/Anthropic API key is invalid: ${error.error?.message || response.statusText}`
      };
    }
  } catch (error) {
    return {
      available: false,
      message: `Error validating Claude/Anthropic API key: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Helper function to check Gemini API availability
 */
async function checkGeminiAvailability() {
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!geminiKey || geminiKey.trim() === '') {
    return {
      available: false,
      message: 'Gemini API key not found in environment variables'
    };
  }

  try {
    console.log('Checking Gemini API key validity');
    // Check if Gemini API key is valid by making a simple request to the models endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${geminiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Gemini API response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('Gemini models available:', data.models?.length || 0);
      return {
        available: true,
        message: 'Gemini API key is valid'
      };
    } else {
      const error = await response.json().catch(e => {
        console.error('Error parsing Gemini API response:', e);
        return { error: { message: 'Unknown error parsing response' } };
      });
      console.error('Gemini API error:', error);
      return {
        available: false,
        message: `Gemini API key is invalid: ${error.error?.message || response.statusText}`
      };
    }
  } catch (error) {
    console.error('Exception in checkGeminiAvailability:', error);
    return {
      available: false,
      message: `Error validating Gemini API key: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}