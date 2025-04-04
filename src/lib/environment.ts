/**
 * Environment configuration utilities
 */

/**
 * Get environment variable with fallback
 * @param key - Environment variable name
 * @param defaultValue - Default value if not found
 * @returns The environment variable value or default
 */
export const getEnv = (key: string, defaultValue: string = ''): string => {
    // For client-side, use only NEXT_PUBLIC_ variables
    if (typeof window !== 'undefined') {
      // @ts-ignore - Access environment variables
      const value = process.env[`NEXT_PUBLIC_${key}`];
      return value || defaultValue;
    }
    
    // For server-side, can access any env var
    return process.env[key] || process.env[`NEXT_PUBLIC_${key}`] || defaultValue;
  };
  
  /**
   * Environment configuration
   */
  export const environment = {
    // N8N configuration
    n8n: {
      url: getEnv('N8N_URL', 'http://localhost:5678'),
      webhookPath: getEnv('N8N_WEBHOOK_PATH', '/webhook_env/data-engineering-agents'),
    },
    
    // Application configuration
    app: {
      name: getEnv('APP_NAME', 'Data Engineering Agent'),
      version: getEnv('APP_VERSION', '1.0.0'),
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
    },
  };
  
  /**
   * Get the full n8n webhook URL
   */
  export const getN8nWebhookUrl = (): string => {
    return `${environment.n8n.url}${environment.n8n.webhookPath}`;
  };

  // src/lib/environment.ts

/**
 * Environment configuration with descriptions and validation rules
 */
export const environmentConfig = {
  // OpenAI
  NEXT_PUBLIC_OPENAI_API_KEY: {
    description: 'OpenAI API Key',
    required: true,
    default: '',
    environmentVariable: true
  },
  
  // Ollama
  NEXT_PUBLIC_OLLAMA_API_URL: {
    description: 'URL for local Ollama instance',
    required: false,
    default: 'http://localhost:11434',
    environmentVariable: true
  },
  
  // Claude (Anthropic)
  NEXT_PUBLIC_ANTHROPIC_API_KEY: {
    description: 'Claude (Anthropic) API Key',
    required: true,
    default: '',
    environmentVariable: true
  },
  
  // Azure OpenAI
  NEXT_PUBLIC_AZURE_OPENAI_API_KEY: {
    description: 'Azure OpenAI API Key',
    required: true,
    default: '',
    environmentVariable: true
  },
  NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT: {
    description: 'Azure OpenAI Endpoint URL',
    required: true,
    default: '',
    environmentVariable: true
  },
  // Gemini
  NEXT_PUBLIC_GEMINI_API_KEY: {
    description: 'Gemini API Key',
    required: true,
    default: '',
    environmentVariable: true
  },
  
  // n8n
  NEXT_PUBLIC_AGENT_API_URL: {
    description: 'n8n API URL',
    required: false,
    default: 'http://localhost:5678',
    environmentVariable: true
  },
  NEXT_PUBLIC_AGENT_API_KEY: {
    description: 'n8n API Key',
    required: false,
    default: '',
    environmentVariable: true
  },
  
};

/**
 * Get environment variables or their default values
 */
export function getEnvironmentValue(key: keyof typeof environmentConfig): string {
  const config = environmentConfig[key];
  
  if (config.environmentVariable) {
    const value = process.env[key] || config.default;
    return value as string;
  }
  
  return config.default as string;
}

/**
 * Check if required environment variables are set
 */
export function checkRequiredEnvironmentVariables(backend: string): {
  isValid: boolean;
  missingVars: string[];
} {
  const missingVars: string[] = [];
  
  switch (backend) {
    case 'openai':
      if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        missingVars.push('NEXT_PUBLIC_OPENAI_API_KEY');
      }
      break;
      
    case 'claude':
      if (!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) {
        missingVars.push('NEXT_PUBLIC_ANTHROPIC_API_KEY');
      }
      break;

    case 'azure':
      if (!process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY) {
        missingVars.push('NEXT_PUBLIC_AZURE_OPENAI_API_KEY');
      }
      if (!process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT) {
        missingVars.push('NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT');
      }
      break;
      
    case 'gemini':
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        missingVars.push('NEXT_PUBLIC_GEMINI_API_KEY');
      }
      break;
      
    case 'n8n':
      // n8n variables are optional, but we check them anyway
      if (!process.env.NEXT_PUBLIC_AGENT_API_URL) {
        missingVars.push('NEXT_PUBLIC_AGENT_API_URL (using default)');
      }
      break;
      
    case 'ollama':
      // Ollama URL is optional as it defaults to localhost
      break;
      
    default:
      // No specific environment variables needed for demo mode
      break;
  }
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}