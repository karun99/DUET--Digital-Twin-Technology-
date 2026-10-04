
export enum AgentRole {
  PRIMARY = 'PRIMARY', // Executive, Action-Oriented (Internal Thought)
  META = 'META',       // Reflective, Philosophical (Internal Thought)
  CLONE = 'CLONE',     // The synthesized persona (Final Response)
  USER = 'USER'        // The actual user
}

export interface InternalThought {
  role: AgentRole;
  content: string;
}

export interface Attachment {
  mimeType: string;
  data: string; // base64
  name?: string;
}

export type ContextNodeType = 'link' | 'file' | 'text';

export interface ContextNode {
  id: string;
  type: ContextNodeType;
  title: string;
  content: string; 
  mimeType?: string;
  timestamp: number;
  status?: 'idle' | 'fetching' | 'ready' | 'error';
}

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string; 
  timestamp: number;
  internalThoughts?: InternalThought[]; 
  attachments?: Attachment[];
  isTyping?: boolean; 
}

export interface CognitiveProfile {
  signature: string;
  biases: string;
  blindspots: string;
  values: string[];
  epistemology: string;
}

export interface UserProfile {
  name: string;
  bio: string;
  links?: string; 
  source: 'manual' | 'search';
  topic?: string; 
  avatarUrl?: string; 
  cognitiveProfile?: CognitiveProfile;
}

export interface ThemeSettings {
  accentColor: string;
  glowIntensity: number;
  bgStyle: 'noise' | 'grid' | 'minimal';
  borderRadius: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SearchResult {
  bio: string;
  sources: GroundingSource[];
}
