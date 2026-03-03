# CAIC Backend Blueprint

A Node.js Express service that demonstrates **service-to-service authentication** with Google Cloud Vertex AI Agent Engine. It accepts avalanche observer transcripts (text + optional images) and returns structured inspection reports.

## Architecture

```
Client --> Express API (POST /analyze) --> Vertex AI Agent Engine (private, GCP auth)
                                               |
                                          InspectionReport JSON
```

The Agent Engine endpoint is **private by default** — every request requires a valid GCP access token. This blueprint handles that authentication transparently using `google-auth-library`.

## Project Structure

```
src/
  index.ts                          Express app entry point
  config.ts                         Environment config + endpoint URL
  types.ts                          TypeScript interfaces
  clients/
    agentClient.ts                  GCP auth + Agent Engine HTTP client
  middleware/
    validateAnalyzeRequest.ts       Request validation
  routes/
    analyze.ts                      POST /analyze route handler
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
REASONING_ENGINE_ID=8608638384300097536
GOOGLE_APPLICATION_CREDENTIALS=./key.json
PORT=3000
```

| Variable | Description |
|---|---|
| `GCP_PROJECT_ID` | Google Cloud project ID |
| `GCP_LOCATION` | Agent Engine region |
| `REASONING_ENGINE_ID` | Deployed reasoning engine ID |
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

### `POST /analyze`

Submit an observer transcript for structured analysis.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | yes | Identifier for the calling user/service |
| `transcript` | string | yes | Raw observer radio transcript |
| `images` | array | no | Base64-encoded images |
| `images[].mimeType` | string | yes* | e.g. `image/jpeg` |
| `images[].data` | string | yes* | Base64-encoded image data |

**Text-only example:**

```bash
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "backend-service",
    "transcript": "00:02\nI traveled east facing terrain at 11,500 feet near Berthoud Pass.\n00:15\nWinds were moderate from the west at 20 mph. No avalanches observed."
  }'
```

**With images:**

```bash
curl -X POST http://localhost:3000/analyze \
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
  }
}
```

**Validation error (400):**

```json
{ "error": "Request body must include a 'transcript' string" }
```

**Upstream error (502):**

```json
{ "success": false, "error": "Agent Engine returned 401: ..." }
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
| Calling service account | `roles/aiplatform.user` or custom role with `aiplatform.reasoningEngines.query` | Invoke the agent |

### Least privilege custom role

```bash
gcloud iam roles create agentCaller \
  --project=PROJECT_ID \
  --title="Agent Engine Caller" \
  --permissions="aiplatform.reasoningEngines.query,aiplatform.reasoningEngines.get"
```

## InspectionReport Schema

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
| `cracking` | `{ severity, details }` | None / Minor / Moderate / Shooting/Rumbling / Unknown |
| `collapsing` | `{ severity, details }` | Same severity scale |
| `snowpackDescription` | string | Max 1 sentence |
| `avalancheObservationType` | string | None, I saw an avalanche, Someone triggered..., etc. |
| `avalancheNarrative` | string | Details or "N/A" |
| `latitude` | number \| null | Only from explicit coordinates |
| `longitude` | number \| null | Only from explicit coordinates |
| `numberOfAvalanchesObserved` | number \| null | Count or null |
