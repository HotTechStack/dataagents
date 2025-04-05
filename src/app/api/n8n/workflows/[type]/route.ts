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

export async function POST(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const workflowType = params.type;
    const endpoint = WORKFLOW_ENDPOINTS[workflowType] || WORKFLOW_ENDPOINTS.default;
    const url = `${N8N_BASE_URL}${endpoint}`;
    
    console.log(`Proxying n8n workflow request to: ${url}`);
    
    // Get request body
    const body = await request.json();
    
    // Forward the request to n8n
    const n8nResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    // Handle error responses
    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error(`Error from n8n (${n8nResponse.status}): ${errorText}`);
      
      return NextResponse.json(
        { error: `n8n error: ${n8nResponse.statusText}`, details: errorText },
        { status: n8nResponse.status }
      );
    }
    
    // Forward the successful response
    const responseData = await n8nResponse.json();
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error proxying request to n8n:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to communicate with n8n',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}