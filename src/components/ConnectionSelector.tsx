"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Activity, 
  RotateCcw, 
  Bot,
  BrainCircuit, 
  MessageSquare,
  SquareCode,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useStore, useSelectedStrategy } from '@/store';
import { connectionValidator } from '@/services/connectionValidator';
import { useToast } from '@/hooks/use-toast';
import { ConnectionStatusTooltip } from './ConnectionStatusTooltip';
import { StoreState, ApiSettings } from '@/types';

type BackendType = 'demo' | 'n8n-openai' | 'n8n-ollama' | 'n8n-claude' | 'n8n-gemini' | 'n8n-default';

interface ConnectionOption {
  id: BackendType;
  name: string;
  icon: React.ReactNode;
  description: string;
  workflowType: string;
  envCheck?: () => boolean; // Function to check if required env vars are present
}

interface ConnectionSelectorProps {
  onBackendChange?: (backend: BackendType, workflowType: string) => void;
  onReset?: () => void;
  className?: string;
}

export function ConnectionSelector({ 
  onBackendChange, 
  onReset,
  className 
}: ConnectionSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [connectionWarning, setConnectionWarning] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get store values and actions
  const apiSettings = useStore((state: StoreState) => state.apiSettings);
  const updateApiSettings = useStore((state: StoreState) => state.updateApiSettings);
  const currentTurn = useStore((state: StoreState) => state.currentTurn);
  const resetConversation = useStore((state: StoreState) => state.resetConversation);
  const currentStrategy = useSelectedStrategy();
  
  // Log environment variables on component mount
  useEffect(() => {
    console.error("=== Environment Variables Diagnostics ===");
    console.error("NEXT_PUBLIC_OPENAI_API_KEY exists:", !!process.env.NEXT_PUBLIC_OPENAI_API_KEY);
    console.debug("NEXT_PUBLIC_OLLAMA_API_URL exists:", !!process.env.NEXT_PUBLIC_OLLAMA_API_URL);
    console.debug("NEXT_PUBLIC_OLLAMA_API_URL value:", process.env.NEXT_PUBLIC_OLLAMA_API_URL);
    console.debug("NEXT_PUBLIC_ANTHROPIC_API_KEY exists:", !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY);
    console.debug("NEXT_PUBLIC_GEMINI_API_KEY exists:", !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    console.debug("NEXT_PUBLIC_AGENT_API_URL:", process.env.NEXT_PUBLIC_AGENT_API_URL);
    console.debug("NEXT_PUBLIC_N8N_DEFAULT_WORKFLOW:", process.env.NEXT_PUBLIC_N8N_DEFAULT_WORKFLOW);
    console.debug("All NEXT_PUBLIC env variables:", Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')));
    console.debug("=======================================");
  }, []);
  
  // Environment variable existence checks
  const hasOpenAIKey = (): boolean => {
    const hasKey = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    console.debug("OpenAI Key check:", hasKey);
    return hasKey;
  };
  
  const hasOllamaUrl = (): boolean => {
    const hasUrl = !!process.env.NEXT_PUBLIC_OLLAMA_API_URL;
    console.debug("Ollama URL check:", hasUrl, process.env.NEXT_PUBLIC_OLLAMA_API_URL);
    return hasUrl;
  };
  
  const hasClaudeKey = (): boolean => {
    const hasKey = !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    console.debug("Claude Key check:", hasKey);
    return hasKey;
  };

  const hasGeminiKey = (): boolean => {
    const hasKey = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    console.debug("Gemini Key check:", hasKey);
    if (!hasKey) {
      console.error("NEXT_PUBLIC_GEMINI_API_KEY is missing or empty");
    } else {
      // Log a masked version of the key for debugging
      const maskedKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.substring(0, 4) + '...' +
        process.env.NEXT_PUBLIC_GEMINI_API_KEY?.substring(process.env.NEXT_PUBLIC_GEMINI_API_KEY.length - 4);
      console.debug("Gemini Key (masked):", maskedKey);
    }
    return hasKey;
  };

  // Define connection options
  const backendOptions: ConnectionOption[] = [
    { 
      id: 'demo', 
      name: 'Demo Mode', 
      icon: <Bot className="h-4 w-4" />,
      description: 'Use pre-scripted agent responses',
      workflowType: 'demo'
    },
    { 
      id: 'n8n-default', 
      name: 'n8n Default', 
      icon: <Activity className="h-4 w-4" />,
      description: 'Connect to Default n8n workflow engine',
      workflowType: 'default'
    },
    { 
      id: 'n8n-openai', 
      name: 'n8n OpenAI', 
      icon: <MessageSquare className="h-4 w-4" />,
      description: 'Connect to OpenAI via n8n workflow',
      workflowType: 'openai',
      envCheck: hasOpenAIKey
    },
    { 
      id: 'n8n-ollama', 
      name: 'n8n Ollama', 
      icon: <BrainCircuit className="h-4 w-4" />,
      description: 'Connect to Ollama via n8n workflow',
      workflowType: 'ollama',
      envCheck: hasOllamaUrl
    },
    { 
      id: 'n8n-claude', 
      name: 'n8n Claude', 
      icon: <SquareCode className="h-4 w-4" />,
      description: 'Connect to Claude via n8n workflow',
      workflowType: 'claude',
      envCheck: hasClaudeKey
    },
    {
      id: 'n8n-gemini',
      name: 'n8n Gemini',
      icon: <MessageSquare className="h-4 w-4" />,
      description: 'Connect to Gemini via n8n workflow',
      workflowType: 'gemini',
      envCheck: hasGeminiKey
    }
  ];
  
  // Log available options
  useEffect(() => {
    // Force show all options for debugging
    const allOptions = backendOptions.map(option => ({
      ...option,
      available: !option.envCheck || option.envCheck()
    }));
    console.log("Backend options availability:", allOptions.map(o => `${o.id}: ${o.available}`));
  }, []);
  
  // Filter out options that are missing required env vars
  const availableBackendOptions = backendOptions.filter(option => {
    // Always show demo and default options
    if (option.id === 'demo' || option.id === 'n8n-default') return true;
    
    // Check if required env vars exist
    const available = !option.envCheck || option.envCheck();
    console.debug(`Option ${option.id} availability check:`, available);
    return available;
  });
  
  // Map store values to component state
  const selectedBackendId = getSelectedBackendId();
  const connectionStatus = apiSettings.connectionStatus === 'connected' || 
                          apiSettings.n8nConnectionStatus === 'connected';
  const connectionError = apiSettings.connectionError;
  
  function getSelectedBackendId(): BackendType {
    if (apiSettings.useDemoMode) return 'demo';
    
    if (apiSettings.backendType === 'n8n') {
      const workflowType = apiSettings.n8nWorkflowType || 'default';
      
      // Map workflow type to backend ID
      switch (workflowType) {
        case 'openai': return 'n8n-openai';
        case 'ollama': return 'n8n-ollama';
        case 'claude': return 'n8n-claude';
        case 'gemini': return 'n8n-gemini';
        default: return 'n8n-default';
      }
    }
    
    // Fallback
    return 'n8n-default';
  }

  // Validate connection when component mounts or when API settings change
  useEffect(() => {
    validateCurrentConnection();
  }, [apiSettings.backendType, apiSettings.n8nWorkflowType, apiSettings.useDemoMode]);

  const validateCurrentConnection = async (): Promise<void> => {
    const backendOption = availableBackendOptions.find(option => option.id === selectedBackendId);
    console.log("Validating connection for:", selectedBackendId, backendOption);
    if (backendOption) {
      await validateConnection(backendOption);
    }
  };

  // Determine the connection status for the tooltip
  const getConnectionStatus = (): 'connected' | 'disconnected' | 'warning' | 'validating' => {
    if (isValidating) return 'validating';
    if (connectionWarning) return 'warning';
    if (connectionStatus) return 'connected';
    return 'disconnected';
  };

  // Get the appropriate message for the tooltip
  const getStatusMessage = (): string => {
    if (isValidating) return 'Validating connection...';
    if (connectionWarning) return connectionWarning;
    if (connectionError) return connectionError;
    if (connectionStatus) return 'Successfully connected';
    return 'Not connected to backend';
  };

  const validateConnection = async (option: ConnectionOption): Promise<void> => {
    setIsValidating(true);
    setConnectionWarning(null);
    
    try {
      console.log(`Validating connection for ${option.id} (${option.workflowType})`);
      
      // For demo mode, no validation needed
      if (option.id === 'demo') {
        console.log("Demo mode selected, skipping validation");
        updateApiSettings({ 
          connectionStatus: 'connected',
          connectionError: null 
        });
        setIsValidating(false);
        return;
      }
      
      // Validate the connection with workflow type
      console.log(`Calling connectionValidator for 'n8n', demo=false, workflow=${option.workflowType}`);
      const result = await connectionValidator.validateConnection(
        'n8n', 
        false,
        option.workflowType
      );
      
      console.log("Validation result:", result);
      
      // Update store with result
      updateApiSettings({
        connectionStatus: result.success ? 'connected' : 'disconnected',
        connectionError: result.success ? null : result.message,
        n8nConnectionStatus: result.success ? 'connected' : 'disconnected'
      });
      
      // Check if there's a warning in the message (n8n connected but model has issues)
      if (result.success && result.message.includes('warning')) {
        setConnectionWarning(result.message);
      } else {
        setConnectionWarning(null);
      }
      
      if (!result.success) {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Validation error:", error);
      updateApiSettings({
        connectionStatus: 'disconnected',
        connectionError: error instanceof Error ? error.message : 'Unknown connection error'
      });
      
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleBackendChange = async (option: ConnectionOption): Promise<void> => {
    setIsValidating(true);
    
    try {
      console.log(`Changing backend to ${option.id} (${option.workflowType})`);
      const useDemoMode = option.id === 'demo';
      
      // Update API settings first
      updateApiSettings({ 
        useDemoMode,
        backendType: useDemoMode ? 'demo' : 'n8n', // Set backend type based on demo mode
        n8nWorkflowType: option.workflowType as any, // Set the workflow type
        connectionStatus: 'disconnected', // Reset connection status
        connectionError: null
      });
      
      // Then validate connection
      await validateConnection(option);
      
      toast({
        title: "Backend Changed",
        description: `Switched to ${option.name}`,
      });
      
      if (onBackendChange) {
        onBackendChange(option.id, option.workflowType);
      }
    } catch (error) {
      console.error('Error changing backend:', error);
      
      toast({
        title: "Error Changing Backend",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
      setIsDropdownOpen(false);
    }
  };

  const handleReset = (): void => {
    resetConversation();
    if (onReset) {
      onReset();
    }
    
    toast({
      title: "Conversation Reset",
      description: "All messages have been cleared",
    });
  };

  const getSelectedOption = (): ConnectionOption => {
    return availableBackendOptions.find(option => option.id === selectedBackendId) || availableBackendOptions[0];
  };

  // Log current connection settings
  useEffect(() => {
    console.log("Current connection settings:", {
      selectedBackend: selectedBackendId,
      apiSettings,
      availableOptions: availableBackendOptions.map(o => o.id),
      connectionStatus,
      connectionError,
      connectionWarning
    });
  }, [selectedBackendId, apiSettings, connectionWarning]);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Use the enhanced connection status tooltip */}
      <ConnectionStatusTooltip 
        status={getConnectionStatus()} 
        message={getStatusMessage()} 
      />
      
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="h-7 gap-1.5 text-xs px-2.5 bg-background"
            disabled={isValidating}
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" /> 
            ) : (
              getSelectedOption().icon
            )}
            <span>{getSelectedOption().name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px]">
          {/* Temporarily show all options for debugging */}
          {backendOptions.map((option) => (
            <DropdownMenuItem 
              key={option.id}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                selectedBackendId === option.id && "bg-primary/10",
                (!option.envCheck || option.envCheck()) ? "" : "opacity-50"
              )}
              onClick={() => handleBackendChange(option)}
              disabled={isValidating || (option.envCheck && !option.envCheck())}
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="bg-muted p-1 rounded-md">
                  {option.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{option.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                    {option.envCheck && !option.envCheck() && " (missing env)"}
                  </span>
                </div>
              </div>
              {selectedBackendId === option.id && (
                <Badge variant="secondary" className="ml-auto h-5 px-1.5">Active</Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="h-7 px-2.5 gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              <span>Turn {currentTurn}/{currentStrategy?.maxTurns || '?'}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Current conversation turn</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={handleReset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset conversation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}