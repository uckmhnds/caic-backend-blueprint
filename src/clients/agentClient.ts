import { GoogleAuth } from "google-auth-library";
import { config } from "../config";
import type {
  AnalyzeRequest,
  AgentEngineRequest,
  AgentEngineResponse,
  MessagePart,
} from "../types";

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

function buildMessage(
  input: AnalyzeRequest
): AgentEngineRequest["input"]["message"] {
  if (!input.images || input.images.length === 0) {
    return input.transcript;
  }

  const parts: MessagePart[] = [{ text: input.transcript }];

  for (const img of input.images) {
    parts.push({
      inline_data: { mime_type: img.mimeType, data: img.data },
    });
  }

  return { role: "user", parts };
}

function buildRequestBody(input: AnalyzeRequest): AgentEngineRequest {
  return {
    class_method: "query",
    input: {
      user_id: input.user_id,
      message: buildMessage(input),
    },
  };
}

export async function queryAgentEngine(
  input: AnalyzeRequest
): Promise<AgentEngineResponse> {
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;

  if (!token) {
    throw new Error("Failed to obtain GCP access token");
  }

  const body = buildRequestBody(input);

  const response = await fetch(config.agentEngineUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Agent Engine returned ${response.status}: ${errorText}`
    );
  }

  return (await response.json()) as AgentEngineResponse;
}
