export interface Agent {
  id: string;
  user_id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'running' | 'error' | 'offline';
  model: string;
  tasks_completed: number;
  last_active_at: string | null;
  created_at: string;
}

export interface MemoryEntry {
  id: string;
  user_id: string;
  agent_id: string | null;
  agent_label: string;
  type: 'task' | 'reflection' | 'output';
  content: string;
  created_at: string;
}

export interface LogEntry {
  id: string;
  user_id: string | null;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
  data: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminConfig {
  agent_concurrency_limit: number;
  memory_retention_days: number;
  routing_weight_gemini: number;
  routing_weight_nvidia: number;
}

export interface HuntResult {
  business_name: string;
  category: string;
  location: string;
  rating: string;
  insight: string;
  place_id?: string;
  website_uri?: string;
  user_rating_count?: number;
  score?: number;
}

export interface WorkflowNode {
  id: string;
  type: 'llm' | 'api' | 'memory' | 'tool';
  input: string;
  output: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface WorkflowInstance {
  id: string;
  user_id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  nodes: WorkflowNode[];
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface RouterInput {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  systemInstruction?: string;
  taskType: 'reasoning' | 'fast_action' | 'planning' | 'extraction';
}

export interface RouterOutput {
  model_used: string;
  task_type: string;
  result: string;
  confidence: number;
  tokens_estimate: number;
  latency_ms: number;
}

export interface TaskPayload {
  agent_id: string;
  task_type: 'reasoning' | 'fast_action' | 'planning' | 'extraction';
  instruction: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: string;
    code?: string;
  };
}
