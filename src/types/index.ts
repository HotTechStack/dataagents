/**
 * Global type definitions for the application
 */


export type AgentRole = 
  | 'architect' 
  | 'engineer' 
  | 'analyst' 
  | 'scientist' 
  | 'governance';

  export interface Strategy {
    id: string;
    name: string;
    description: string;
    icon: string;
    color?: string;
    capabilities?: string[];
    recommendedAgents?: string[];
    maxAgents?: number; // Add this property
    maxTurns?: number;
    turnsBeforeFinalAnswer?: number;
  }


export interface StrategyCardProps {
  strategy: Strategy;
  isSelected: boolean;
  onSelect: () => void;
}

  
  // Make sure your Agent interface also includes category property if needed
  export interface Agent {
    id: string;
    name: string;
    description: string;
    avatar: string;
    role?: AgentRole;
    systemPrompt?: string;
    color?: string;
    category?: string; // Add this property if you're using it
  }

export type StrategyType = 
  | 'infrastructure' 
  | 'pipeline' 
  | 'analysis' 
  | 'quality' 
  | 'governance'
  | 'sequential'
  | 'collaborative'
  | 'debate';

export interface Chat {
  id: string;
  title: string;
  strategyId: string;
  agents: Agent[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// UI types
export interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  active?: boolean;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface StreamToken {
  type: 'token';
  content: string;
  agent?: {
    id: string;
    name: string;
  };
}

// Form input types
export interface ChatInput {
  content: string;
}

export interface AgentSelectionInput {
  agentIds: string[];
  strategyId: string;
}

// Settings types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  chatBubbleStyle: 'modern' | 'classic';
  streamResponses: boolean;
  maxHistoryItems: number;
}

export type N8nWorkflowType = 'default' | 'openai' | 'ollama' | 'claude' | 'gemini' | 'demo';

// Then in your ApiSettings interface, update the n8nWorkflowType property to use this type:
export interface ApiSettings {
  apiUrl: string;
  apiKey: string;
  backendType: string;
  n8nConnectionStatus: 'connected' | 'disconnected' | 'checking';
  n8nWorkflowType: N8nWorkflowType; // Use the type here
  useDemoMode: boolean;
  
  // Connection validation fields
  connectionStatus: 'connected' | 'disconnected';
  connectionError: string | null;
}

// Conversation interface
export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  agentIds: string[];
  strategyId: string;
}

// Message type definition
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'summary';
  agentId?: string;
  agentName?: string; 
  agentAvatar?: string;
  agentColor?: string;
  isCoordinator?: boolean;
  createdAt: Date;
  // Update the type property to include all needed values:
  type?: 'message' | 'thinking' | 'error' | 'summary' | 'welcome' | 'coordinator';
  turnNumber?: number;
  summary?: string;
  timestamp?: Date;
  originalAgentId?: string;
}
export interface DatabaseSettings {
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastBackup?: Date;
}

// Store state types
export interface AppState {
  strategies: Strategy[];
  agents: Agent[];
  selectedStrategyId: string | null;
  selectedAgentIds: string[];
  currentChat: Chat | null;
  chats: Chat[];
  settings: UserSettings;
  apiSettings: ApiSettings;
}

// And update StoreState to include new properties and typed functions
export interface StoreState {
  // Agents state
  agents: Agent[];
  selectedAgentIds: string[];
  selectAgent: (agentId: string) => void;
  unselectAgent: (agentId: string) => void;
  
  // Strategies state
  strategies: Strategy[];
  selectedStrategy: string;
  setSelectedStrategy: (strategyId: string) => void;
  
  // Conversations state
  conversations: Conversation[];
  currentConversation: string | null;
  messages: Message[];
  addMessage: (message: Message) => void;
  addMessages: (messages: Message[]) => void;
  setCurrentConversation: (conversationId: string | null) => void;
  
  // UI state
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  
  // Mobile sidebar state (added for useMobile hook)
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  
  // Processing state
  isProcessing: boolean;
  conversationStatus: 'idle' | 'active' | 'complete' | 'error';
  currentTurn: number;
  setConversationStatus: (status: 'idle' | 'active' | 'complete' | 'error') => void;
  resetConversation: () => void;
  
  // API Settings
  apiSettings: ApiSettings;
  updateApiSettings: (settings: Partial<ApiSettings>) => void;
  
  // Connection validation functions
  validateConnection: () => Promise<boolean>;
  setBackendType: (backendType: string, workflowType?: N8nWorkflowType, useDemoMode?: boolean) => Promise<boolean>;
  
  // Query submission
  submitQuery: (query: string) => Promise<void>;
}

// Environment variables
export interface EnvVariables {
  NEXT_PUBLIC_AGENT_API_URL: string;
  NEXT_PUBLIC_AGENT_API_KEY: string;
  NEXT_PUBLIC_OPENAI_API_KEY: string;
  NEXT_PUBLIC_OLLAMA_API_URL: string;
  NEXT_PUBLIC_ANTHROPIC_API_KEY: string;
  NEXT_PUBLIC_AZURE_OPENAI_API_KEY: string;
  NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT: string;
  NEXT_PUBLIC_GEMINI_API_KEY: string;
}

// Data engineering specific types
export interface DataPipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  schedule?: string;
  status: 'active' | 'inactive' | 'error';
  lastRun?: Date;
  nextRun?: Date;
}

export interface PipelineStep {
  id: string;
  name: string;
  type: 'extract' | 'transform' | 'load' | 'validate';
  config: Record<string, any>;
  dependencies: string[];
}

export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'stream';
  config: Record<string, any>;
  schema?: Record<string, any>;
}

export interface DataTarget {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'dashboard';
  config: Record<string, any>;
}

export interface DataQualityRule {
  id: string;
  name: string;
  description: string;
  ruleType: 'completeness' | 'accuracy' | 'consistency' | 'validity' | 'timeliness';
  severity: 'low' | 'medium' | 'high' | 'critical';
  query: string;
  threshold: number;
}

export interface InfrastructureComponent {
  id: string;
  name: string;
  type: 'compute' | 'storage' | 'network' | 'security';
  provider: 'aws' | 'gcp' | 'azure' | 'local';
  config: Record<string, any>;
  status: 'running' | 'stopped' | 'error';
}

// Navigation helpers
export type ActiveView = 'conversation' | 'execution' | 'history' | 'settings';

interface AgentSelectorProps {
  mode: "all" | "selected";
  searchQuery?: string;
  categoryFilter?: string;
}