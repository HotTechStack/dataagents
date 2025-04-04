// src/app/api/n8n/workflows/[type]/validate/route.ts
import { NextResponse } from 'next/server';

/**
 * API route to validate specific n8n workflow types
 * This acts as a proxy to avoid CORS issues and to centralize the validation logic
 */
export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  const workflowType = params.type;
  
  try {
    const n8nUrl = process.env.NEXT_PUBLIC_AGENT_API_URL || 'http://localhost:5678';
    
    // First check if n8n is running
    const n8nResponse = await fetch(`${n8nUrl}/api/v1/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!n8nResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: `n8n connection failed: ${n8nResponse.status} ${n8nResponse.statusText}` 
        }, 
        { status: n8nResponse.status }
      );
    }
    
    // Now validate the specific workflow type
    let validationResult = {
      success: true,
      message: `Connected to n8n ${workflowType} workflow`
    };
    
    switch (workflowType) {
      case 'openai':
        // Check OpenAI API key
        if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
          validationResult = {
            success: true, // Still allow connection to n8n
            message: `n8n connected, but openai warning: OpenAI API key not found in environment variables`
          };
        }
        break;
        
      case 'ollama':
        // Check if Ollama is running
        try {
          const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_API_URL || 'http://localhost:11434';
          const ollamaResponse = await fetch(`${ollamaUrl}/api/tags`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            cache: 'no-store',
            // Short timeout since Ollama is expected to be local
            signal: AbortSignal.timeout(2000)
          });
          
          if (!ollamaResponse.ok) {
            validationResult = {
              success: true, // Still allow connection to n8n
              message: `n8n connected, but ollama warning: Ollama connection failed`
            };
          }
        } catch (error) {
          validationResult = {
            success: true, // Still allow connection to n8n
            message: `n8n connected, but ollama warning: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
        break;
        
      case 'claude':
        // Check Claude API key
        if (!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) {
          validationResult = {
            success: true, // Still allow connection to n8n
            message: `n8n connected, but claude warning: Claude API key not found in environment variables`
          };
        }
        break;

      case 'gemini':
        // Check Gemini API key
        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
          validationResult = {
            success: true, // Still allow connection to n8n
            message: `n8n connected, but gemini warning: Gemini API key not found in environment variables`
          };
        }
        break;

      case 'demo':
        // No validation needed for demo
        validationResult = {
          success: true,
          message: 'Demo mode active'
        };
        break;
        
      default:
        // Default n8n workflow
        validationResult = {
          success: true,
          message: 'Connected to n8n workflow engine'
        };
    }
    
    return NextResponse.json(validationResult);
  } catch (error) {
    console.error(`Error validating n8n ${workflowType} workflow:`, error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error validating n8n ${workflowType} workflow: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, 
      { status: 500 }
    );
  }
}