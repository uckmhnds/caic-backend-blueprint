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

// --- CAIC Agent Engine response ---

export interface CaicAgentEngineResponse {
  output: {
    actions: {
      state_delta: {
        report: CaicInspectionReport;
      };
    };
  };
}

// --- Structured report returned by the CAIC agent ---

export interface CaicInspectionReport {
  inspection: CaicInspection;
  metadata: CaicReportMetadata;
}

export interface CaicInspection {
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

export interface CaicReportMetadata {
  timestamp: string;
  source: string;
  version: string;
  generatedBy: string;
}

// --- Avalanche Report Agent types ---

export type ElevationCategory = "All" | ">TL" | "TL" | "<TL" | "U";

export type AvalancheAspect = "All" | "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | "U";

export type AvalancheProblemType =
  | "Loose Dry - Loose Dry Avalanche Problem"
  | "Storm Slab - Storm Slab Avalanche Problem"
  | "Wind Slab - Wind Slab Avalanche Problem"
  | "Persistent Slab - Persistent Slab Avalanche Problem"
  | "Loose Wet - Loose Wet Avalanche Problem"
  | "Wet Slab - Wet Slab Avalanche Problem"
  | "Cornice - Cornice Fall Avalanche Problem"
  | "Glide - Glide Avalanche Problem"
  | "Deep Persistent - Deep Persistent Slab Avalanche Problem"
  | "Unknown - Unknown Avalanche Problem";

export type AvalancheType = "L" | "WL" | "SS" | "HS" | "WS" | "G" | "|" | "SF" | "C" | "R" | "U";

export type Trigger =
  | "N" | "AS" | "AR" | "Al" | "AF" | "AC" | "AM" | "AN" | "AK"
  | "AV" | "AA" | "AE" | "AL" | "AB" | "AX" | "AH" | "AP" | "AW"
  | "AU" | "AO" | "U" | "A";

export type SecondaryTrigger = "u" | "c" | "r" | "y" | "U";

export type RSize = "R1" | "R2" | "R3" | "R4" | "R5" | "U";

export type DSize = "D1" | "D2" | "D3" | "D4" | "D5" | "U";

export type EstimatedKnown = "Estimated" | "Known";

export type LayerType = "Layer" | "Interface" | "Unknown";

export type GrainType =
  | "Precipitation Particles"
  | "Machine Made"
  | "Decomposing or Fragmented"
  | "Rounded Grains"
  | "Faceted Crystals"
  | "Near Surface Facets"
  | "Depth Hoar"
  | "Surface Hoar"
  | "Melt Form"
  | "Ice Mass"
  | "Crust"
  | "Unknown";

export type SlidingSurface = "S" | "|" | "0" | "G" | "U";

export type Terminus = "TP" | "MP" | "BP" | "U";

export type RoadStatus = "Closed" | "Open" | "Unknown";

export interface Avalanche {
  elevationCategory: ElevationCategory;
  aspect: AvalancheAspect;
  avalancheProblemType: AvalancheProblemType;
  type: AvalancheType;
  trigger: Trigger;
  secondaryTrigger: SecondaryTrigger;
  rSize: RSize;
  dSize: DSize;
  incident: boolean;
  date: string;
  estimatedKnown: EstimatedKnown;
  time: string;
  slopeAngle: number | null;
  avgDepth: string;
  avgWidth: string;
  avgVerticalRun: string;
  maxVerticalRun: string;
  layerType: LayerType;
  grainType: GrainType;
  slidingSurface: SlidingSurface;
  elevation: string;
  terminus: Terminus;
  roadStatus: RoadStatus;
  centerlineDepth: string;
  centerlineWidth: string;
  areaDescription: string;
  avalancheComments: string;
}

export interface AvalancheReportMetadata {
  timestamp: string;
  source: string;
  version: string;
  generatedBy: string;
}

export interface AvalancheReport {
  avalanches: Avalanche[];
  metadata: AvalancheReportMetadata;
}

export interface AvalancheAgentEngineResponse {
  output: {
    actions: {
      state_delta: {
        report: AvalancheReport;
      };
    };
  };
}
