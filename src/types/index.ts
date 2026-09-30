export type LeadStatus = 'New' | 'Interested' | 'Waiting' | 'Converted' | 'Not Interested' | 'Human Required';

export type IntentType = 
  | 'website_request'
  | 'ecommerce_request'
  | 'domain_request'
  | 'pricing_question'
  | 'portfolio_request'
  | 'support_request'
  | 'general_question'
  | 'human_agent_request'
  | 'other';

export interface Customer {
  id: string;
  instagram_username: string;
  instagram_user_id?: string;
  name?: string;
  phone?: string;
  requested_service?: string;
  last_message?: string;
  last_response?: string;
  first_contact_at: string;
  last_contact_at: string;
  lead_status: LeadStatus;
  lead_score: number; // 0 to 100
  notes?: string;
  human_required: boolean;
  tags?: string[];
  unread_messages?: number;
}

export interface Conversation {
  id: string;
  customer_id: string;
  channel: 'instagram' | 'whatsapp' | 'web';
  status: 'active' | 'human_handoff' | 'closed';
  created_at: string;
  updated_at: string;
  last_message_preview?: string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  customer_id: string;
  sender: 'customer' | 'ai' | 'human_agent';
  message: string;
  timestamp: string;
  message_type: 'text' | 'image' | 'quick_reply';
  is_ai: boolean;
  status: 'received' | 'sent' | 'failed' | 'simulated';
  instagram_mid?: string;
  metadata?: {
    intent?: IntentType;
    lead_score?: number;
    response_time_ms?: number;
    error_message?: string;
    human_handoff_triggered?: boolean;
    raw_response?: string;
  };
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Pricing {
  id: string;
  service_id: string;
  service_name: string;
  title: string;
  starting_price: number;
  currency: string;
  details: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface AISettings {
  id: string;
  personality: string;
  tone: string;
  language: string;
  dialect: string;
  response_length: 'concise' | 'balanced' | 'detailed';
  greeting: string;
  business_name: string;
  business_description: string;
  rules: string[];
  forbidden_information: string[];
  human_handoff_keywords: string[];
  human_handoff_message: string;
  is_ai_enabled: boolean;
  max_questions_per_reply: number;
  updated_at: string;
}

export interface SystemSettings {
  id: string;
  brand_name: string;
  instagram_verify_token: string;
  instagram_page_id?: string;
  instagram_access_token?: string; // Masked on client
  instagram_access_token_configured: boolean;
  instagram_mode: 'live' | 'sandbox';
  webhook_url?: string;
  supabase_configured: boolean;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  event_type: 'webhook_received' | 'duplicate_skipped' | 'ai_intent' | 'ai_response' | 'instagram_sent' | 'human_handoff' | 'guardrail_blocked' | 'error';
  status: 'success' | 'warning' | 'error';
  customer_id?: string;
  instagram_username?: string;
  message_snippet?: string;
  intent?: IntentType;
  lead_score?: number;
  response_time_ms?: number;
  details?: Record<string, any>;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  event_id: string;
  payload: any;
  received_at: string;
  status: 'processed' | 'duplicate' | 'failed';
}

export interface AIAnalysisResult {
  intent: IntentType;
  service: string | null;
  lead_score: number;
  lead_status: LeadStatus;
  needs_human_handoff: boolean;
  missing_info: string[];
  suggested_response: string;
  confidence: number;
  reasoning: string;
}

export interface DashboardStats {
  total_customers: number;
  new_customers: number;
  interested_customers: number;
  converted_customers: number;
  waiting_customers: number;
  human_required_count: number;
  total_conversations: number;
  total_messages: number;
  ai_responded_messages: number;
  human_handoff_count: number;
  ai_automation_enabled: boolean;
  instagram_connected: boolean;
}

export interface TestResultItem {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  status: 'passed' | 'failed' | 'running' | 'skipped';
  duration_ms: number;
  error?: string;
  details?: any;
}
