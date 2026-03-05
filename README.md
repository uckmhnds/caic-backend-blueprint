# CAIC Backend Blueprint

A Node.js Express service that demonstrates **service-to-service authentication** with Google Cloud Vertex AI Agent Engine. It connects to two reasoning engines:

- **CAIC Report Agent** — accepts avalanche observer transcripts (text + optional images) and returns structured inspection reports
- **Avalanche Report Agent** — accepts avalanche observer transcripts (text + optional images) and returns structured avalanche classification reports (SWAG format)

## Architecture

```
                              ┌─→ CAIC Agent Engine ──→ InspectionReport JSON
Client ──→ Express API ───────┤
                              └─→ Avalanche Agent Engine ──→ AvalancheReport JSON
```

Both Agent Engine endpoints are **private by default** — every request requires a valid GCP access token. This blueprint handles that authentication transparently using `google-auth-library`.

## Project Structure

```
src/
  index.ts                          Express app entry point
  config.ts                         Environment config + endpoint URLs
  types.ts                          TypeScript interfaces
  clients/
    agentClient.ts                  GCP auth + Agent Engine HTTP clients
  middleware/
    validateAnalyzeRequest.ts       Request validation
  routes/
    caicReport.ts                   POST /caic-report route handler
    avalancheReport.ts              POST /avalanche-report route handler
```

## Setup

### Prerequisites

- Node.js 18+
- A GCP service account key with `roles/aiplatform.user` (or `aiplatform.reasoningEngines.query` permission)

### Install

```bash
npm install
```

### Configure

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

```env
GCP_PROJECT_ID=939611441652
GCP_LOCATION=us-central1
CAIC_REASONING_ENGINE_ID=8608638384300097536
AVALANCHE_REASONING_ENGINE_ID=<your-avalanche-engine-id>
GOOGLE_APPLICATION_CREDENTIALS=./key.json
PORT=3000
```

| Variable | Description |
|---|---|
| `GCP_PROJECT_ID` | Google Cloud project ID |
| `GCP_LOCATION` | Agent Engine region |
| `CAIC_REASONING_ENGINE_ID` | Deployed CAIC report reasoning engine ID |
| `AVALANCHE_REASONING_ENGINE_ID` | Deployed avalanche report reasoning engine ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key JSON (local dev only) |
| `PORT` | Server port (default: 3000) |

On **Cloud Run / GKE / Compute Engine**, omit `GOOGLE_APPLICATION_CREDENTIALS` — the attached service account authenticates automatically via Application Default Credentials (ADC).

### Run

```bash
# Development (hot-reload)
npm run dev

# Production
npm run build
npm start
```

## API

### `GET /`

Health check.

```bash
curl http://localhost:3000/
```

```json
{ "message": "caic-backend-blueprint is running" }
```

### `POST /caic-report`

Submit an observer transcript for structured CAIC inspection analysis.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | yes | Identifier for the calling user/service |
| `transcript` | string | yes | Raw transcript text or stringified JSON array of transcript objects |
| `images` | array | no | Base64-encoded images |
| `images[].mimeType` | string | yes* | e.g. `image/jpeg` |
| `images[].data` | string | yes* | Base64-encoded image data |

**Text-only example:**

```bash
curl -X POST http://localhost:3000/caic-report \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "backend-service",
    "transcript": "00:02\nI traveled east facing terrain at 11,500 feet near Berthoud Pass.\n00:15\nWinds were moderate from the west at 20 mph. No avalanches observed."
  }'
```

**Structured transcript (from transcription service):**

```bash
curl -X POST http://localhost:3000/caic-report \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "backend-service",
    "transcript": "[{\"transcript\":[{\"text\":\"I traveled east facing terrain at 11,500 feet near Berthoud Pass.\",\"startTime\":2.04,\"endTime\":8.0},{\"text\":\"Winds moderate from the west.\",\"startTime\":8.5,\"endTime\":11.2}]}]"
  }'
```

The agent auto-detects the format: if the message is a valid JSON array of `{"transcript": [...]}` objects, it parses the segments into timestamped text and joins multiple recordings with `---` separators.

**With images:**

```bash
curl -X POST http://localhost:3000/caic-report \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "backend-service",
    "transcript": "00:02\nI traveled northeast facing terrain at 11,000 feet near Loveland Pass.",
    "images": [
      {
        "mimeType": "image/jpeg",
        "data": "<base64-encoded-image>"
      }
    ]
  }'
```

**Success response (200):**

```json
{
  "success": true,
  "report": {
    "inspection": {
      "elevationRangeInFeet": "11,500 feet",
      "aspects": ["E"],
      "locations": ["Berthoud Pass"],
      "date": "2024-05-16",
      "routeDescription": "I traveled east facing terrain at 11,500 feet near Berthoud Pass.",
      "areaDescription": "East facing terrain at 11,500 feet near Berthoud Pass.",
      "observationSummary": "No avalanches observed. Winds were moderate from the west at 20 mph.",
      "weatherObservationSummary": "Winds moderate from the west at 20 mph.",
      "cracking": { "severity": "None", "details": "N/A" },
      "collapsing": { "severity": "None", "details": "N/A" },
      "snowpackDescription": "The snowpack showed no visible signs of instability.",
      "avalancheObservationType": "None",
      "avalancheNarrative": "N/A",
      "latitude": null,
      "longitude": null,
      "numberOfAvalanchesObserved": null
    },
    "metadata": {
      "timestamp": "2024-05-16T18:30:00Z",
      "source": "CAIC Field Report",
      "version": "2.0",
      "generatedBy": "CAIC Report Agent"
    }
  }
}
```

### `POST /avalanche-report`

Submit an observer transcript for structured avalanche classification analysis (SWAG format).

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | yes | Identifier for the calling user/service |
| `transcript` | string | yes | Raw transcript text or stringified JSON array of transcript objects |
| `images` | array | no | Base64-encoded images |
| `images[].mimeType` | string | yes* | e.g. `image/jpeg` |
| `images[].data` | string | yes* | Base64-encoded image data |

**Example:**

```bash
curl -X POST http://localhost:3000/avalanche-report \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "backend-service",
    "transcript": "00:02\nI observed a storm slab avalanche on east facing terrain at 11,500 feet near Berthoud Pass.\n00:15\nIt appeared to be skier triggered, roughly 18 inches deep and 100 feet wide."
  }'
```

**Success response (200):**

```json
{
  "success": true,
  "report": {
    "avalanches": [
      {
        "elevationCategory": ">TL",
        "aspect": "E",
        "avalancheProblemType": "Storm Slab - Storm Slab Avalanche Problem",
        "type": "SS",
        "trigger": "AS",
        "secondaryTrigger": "u",
        "rSize": "R2",
        "dSize": "D2",
        "incident": false,
        "date": "2024-05-16",
        "estimatedKnown": "Estimated",
        "time": "U",
        "slopeAngle": 38,
        "avgDepth": "18 inches",
        "avgWidth": "100 feet",
        "avgVerticalRun": "500 feet",
        "maxVerticalRun": "600 feet",
        "layerType": "Layer",
        "grainType": "Storm Slab",
        "slidingSurface": "S",
        "elevation": "11,500 feet",
        "terminus": "MP",
        "roadStatus": "Unknown",
        "centerlineDepth": "18 inches",
        "centerlineWidth": "100 feet",
        "areaDescription": "East facing terrain near Berthoud Pass",
        "avalancheComments": "Storm slab observed on east-facing terrain."
      }
    ],
    "metadata": {
      "timestamp": "2024-05-16T18:30:00Z",
      "source": "CAIC Field Report",
      "version": "1.0",
      "generatedBy": "Avalanche Report Agent"
    }
  }
}
```

### Error Responses

**Validation error (400):**

```json
{ "error": "Request body must include a 'transcript' string" }
```

**Upstream error (502):**

```json
{ "success": false, "error": "CAIC Agent Engine returned 401: ..." }
```

## Authentication Flow

1. **`google-auth-library`** creates a `GoogleAuth` instance with `cloud-platform` scope
2. On each request, it obtains an access token (cached and auto-refreshed)
3. The token is sent as `Authorization: Bearer <token>` to the Agent Engine REST endpoint
4. No manual token management or refresh logic needed

**Local development:** Set `GOOGLE_APPLICATION_CREDENTIALS` to a service account key file.

**GCP-hosted:** Application Default Credentials (ADC) use the attached service account automatically.

## IAM Requirements

| Who | Role | Why |
|---|---|---|
| Calling service account | `roles/aiplatform.user` or custom role with `aiplatform.reasoningEngines.query` | Invoke the agents |

### Least privilege custom role

```bash
gcloud iam roles create agentCaller \
  --project=PROJECT_ID \
  --title="Agent Engine Caller" \
  --permissions="aiplatform.reasoningEngines.query,aiplatform.reasoningEngines.get"
```

## InspectionReport Schema (CAIC Agent)

The report has two top-level keys: `inspection` and `metadata`.

### `inspection`

| Field | Type | Description |
|---|---|---|
| `elevationRangeInFeet` | string | e.g. "10,000-12,000 feet" |
| `aspects` | string[] | Compass directions: N, NE, E, SE, S, SW, W, NW |
| `locations` | string[] | Location names from transcript |
| `date` | string | YYYY-MM-DD |
| `routeDescription` | string | Travel/route details |
| `areaDescription` | string | Physical terrain description |
| `observationSummary` | string | Hazard assessment, wind loading |
| `weatherObservationSummary` | string | Temps, wind, sky, precipitation |
| `cracking` | `{ severity, details }` | None / Minor / Moderate / Shooting / Unknown |
| `collapsing` | `{ severity, details }` | None / Minor / Moderate / Rumbling / Unknown |
| `snowpackDescription` | string | Max 1 sentence |
| `avalancheObservationType` | string | None, I saw an avalanche, Someone triggered..., etc. |
| `avalancheNarrative` | string | Details or "N/A" |
| `latitude` | number \| null | Only from explicit coordinates |
| `longitude` | number \| null | Only from explicit coordinates |
| `numberOfAvalanchesObserved` | number \| null | Count or null |

### `metadata`

| Field | Type | Description |
|---|---|---|
| `timestamp` | string | ISO 8601 UTC timestamp |
| `source` | string | Always "CAIC Field Report" |
| `version` | string | Always "2.0" |
| `generatedBy` | string | Always "CAIC Report Agent" |

## AvalancheReport Schema (Avalanche Agent)

The report has two top-level keys: `avalanches` and `metadata`.

### `avalanches[]`

Each entry has 27 fields following the SWAG classification:

| Field | Type | Values |
|---|---|---|
| `elevationCategory` | string | All, >TL, TL, <TL, U |
| `aspect` | string | All, N, NE, E, SE, S, SW, W, NW, U |
| `avalancheProblemType` | string | Loose Dry, Storm Slab, Wind Slab, Persistent Slab, Loose Wet, Wet Slab, Cornice, Glide, Deep Persistent, Unknown |
| `type` | string | L, WL, SS, HS, WS, G, \|, SF, C, R, U |
| `trigger` | string | N, AS, AR, Al, AF, AC, AM, AN, AK, AV, AA, AE, AL, AB, AX, AH, AP, AW, AU, AO, U, A |
| `secondaryTrigger` | string | u, c, r, y, U |
| `rSize` | string | R1–R5, U |
| `dSize` | string | D1–D5, U |
| `incident` | boolean | Whether an incident was involved |
| `date` | string | Date of the avalanche |
| `estimatedKnown` | string | Estimated, Known |
| `time` | string | Time of the avalanche |
| `slopeAngle` | number \| null | Slope angle in degrees |
| `avgDepth` | string | Average depth |
| `avgWidth` | string | Average width |
| `avgVerticalRun` | string | Average vertical run |
| `maxVerticalRun` | string | Maximum vertical run |
| `layerType` | string | Layer, Interface, Unknown |
| `grainType` | string | Precipitation Particles, Machine Made, Decomposing or Fragmented, Rounded Grains, Faceted Crystals, Near Surface Facets, Depth Hoar, Surface Hoar, Melt Form, Ice Mass, Crust, Unknown |
| `slidingSurface` | string | S, \|, 0, G, U |
| `elevation` | string | Elevation value |
| `terminus` | string | TP, MP, BP, U |
| `roadStatus` | string | Closed, Open, Unknown |
| `centerlineDepth` | string | Centerline depth |
| `centerlineWidth` | string | Centerline width |
| `areaDescription` | string | Description of the avalanche area |
| `avalancheComments` | string | Comments on the avalanche |

### Avalanche `metadata`

| Field | Type | Description |
|---|---|---|
| `timestamp` | string | ISO 8601 UTC timestamp |
| `source` | string | Source of the inspection data |
| `version` | string | Report version |
| `generatedBy` | string | Identifier of the generating entity |
