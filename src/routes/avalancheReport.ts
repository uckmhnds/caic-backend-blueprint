import { Router, Request, Response } from "express";
import { queryAvalancheAgentEngine } from "../clients/agentClient";
import { validateAnalyzeRequest } from "../middleware/validateAnalyzeRequest";
import type { AnalyzeRequest } from "../types";

const router = Router();

router.post("/", validateAnalyzeRequest, async (req: Request, res: Response) => {
  try {
    const { user_id, transcript, images } = req.body as AnalyzeRequest;

    console.log(
      `Processing avalanche report (${transcript.length} chars) with ${images?.length ?? 0} images`
    );

    const result = await queryAvalancheAgentEngine({ user_id, transcript, images });
    const report = result.output?.actions?.state_delta?.report;

    if (!report) {
      res.status(502).json({
        success: false,
        error: "Avalanche Agent Engine returned an unexpected response structure",
      });
      return;
    }

    res.json({ success: true, report });
  } catch (err) {
    console.error("Error calling Avalanche Agent Engine:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ success: false, error: message });
  }
});

export default router;
