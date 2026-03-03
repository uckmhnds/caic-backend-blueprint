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

export interface AgentEngineResponse {
  output: string;
  actions: {
    state_delta: {
      report: InspectionReport;
    };
  };
}

// --- Structured report returned by the agent ---

export interface InspectionReport {
  inspection: Inspection;
  metadata: ReportMetadata;
}

export interface Inspection {
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

export interface ReportMetadata {
  timestamp: string;
  source: string;
  version: string;
  generatedBy: string;
}
