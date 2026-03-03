// --- Incoming request to our API ---

export interface AnalyzeRequest {
  user_id: string;
  transcript: string;
  images?: Array<{
    mimeType: string;
    data: string; // base64-encoded
  }>;
}

// --- Payload sent to Vertex AI Agent Engine ---

export type MessagePart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export interface AgentEngineRequest {
  class_method: string;
  input: {
    user_id: string;
    message:
      | string
      | {
          role: "user";
          parts: MessagePart[];
        };
  };
}

// --- Response from Agent Engine (QueryReasoningEngineResponse) ---
// The REST API wraps everything in an `output` field (google.protobuf.Value).

export interface AgentEngineResponse {
  output: AgentEngineOutput;
}

export interface AgentEngineOutput {
  usage_metadata: UsageMetadata;
  id: string;
  finish_reason: string;
  content: {
    parts: Array<{ text: string }>;
    role: string;
  };
  author: string;
  model_version: string;
  avg_logprobs: number;
  actions: {
    requested_tool_confirmations: Record<string, unknown>;
    state_delta: {
      report: InspectionReport;
    };
    artifact_delta: Record<string, unknown>;
    requested_auth_configs: Record<string, unknown>;
  };
  invocation_id: string;
  timestamp: number;
}

export interface UsageMetadata {
  total_token_count: number;
  prompt_token_count: number;
  traffic_type: string;
  prompt_tokens_details: Array<{ token_count: number; modality: string }>;
  thoughts_token_count: number;
  candidates_token_count: number;
  candidates_tokens_details: Array<{ token_count: number; modality: string }>;
}

export interface InspectionReport {
  elevationRangeInFeet: string;
  aspects: string[];
  locations: string[];
  date: string;
  routeDescription: string;
  areaDescription: string;
  observationSummary: string;
  weatherObservationSummary: string;
  cracking: { severity: string; details: string };
  collapsing: { severity: string; details: string };
  snowpackDescription: string;
  avalancheObservationType: string;
  avalancheNarrative: string;
  latitude: number | null;
  longitude: number | null;
  numberOfAvalanchesObserved: number | null;
}
