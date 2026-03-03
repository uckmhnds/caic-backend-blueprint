import dotenv from "dotenv";
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  gcpProjectId: requireEnv("GCP_PROJECT_ID"),
  gcpLocation: requireEnv("GCP_LOCATION"),
  reasoningEngineId: requireEnv("REASONING_ENGINE_ID"),

  get agentEngineUrl(): string {
    return `https://${this.gcpLocation}-aiplatform.googleapis.com/v1/projects/${this.gcpProjectId}/locations/${this.gcpLocation}/reasoningEngines/${this.reasoningEngineId}:query`;
  },
};
