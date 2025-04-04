// src/app/api/gemini/validate/route.ts
import { NextResponse } from 'next/server';

/**
 * API route to validate Gemini API key
 * This acts as a proxy to avoid exposing API keys to the client
 */
export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    console.log('Validating Gemini API key, exists:', !!apiKey);

    if (!apiKey || apiKey.trim() === '') {
      console.error('Gemini API key not found in environment variables');
      return NextResponse.json(
        { success: false, message: 'Gemini API key not found in environment variables' },
        { status: 400 }
      );
    }
    
    // Check if the API key is valid by making a request to the models endpoint
    // We specifically check for the gemini-2.0-flash model which is what we want to use
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Gemini API response status: ${response.status}`);

    if (!response.ok) {
      const error = await response.json().catch((e) => {
        console.error('Error parsing Gemini API error response:', e);
        return { error: { message: 'Unknown error' } };
      });
      console.error('Gemini API validation error:', error);
      return NextResponse.json(
        { success: false, message: error.error?.message || response.statusText },
        { status: response.status }
      );
    }
    
    const models = await response.json();

    console.log('Gemini API models response:', JSON.stringify(models).substring(0, 200) + '...');
    console.log('Available models count:', models.models?.length || 0);

    // Check if gemini-2.0-flash model is available
    const hasGemini2Flash = models.models?.some((model: any) => {
      console.log('Checking model:', model.name);
      return model.name === 'models/gemini-2.0-flash';
    });

    if (!hasGemini2Flash) {
      console.warn('Gemini API key is valid but gemini-2.0-flash model is not available');
    } else {
      console.log('gemini-2.0-flash model is available!');
    }

    return NextResponse.json({
      success: true,
      message: hasGemini2Flash
        ? 'Gemini API key is valid with gemini-2.0-flash model available'
        : 'Gemini API key is valid but gemini-2.0-flash model may not be available',
      // Optionally return a limited subset of models to avoid large payloads
      modelCount: models.models?.length || 0,
      hasGemini2Flash
    });
  } catch (error) {
    console.error('Error validating Gemini API key:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Error validating Gemini API key: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}
