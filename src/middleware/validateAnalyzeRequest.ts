import { Request, Response, NextFunction } from "express";
import type { AnalyzeRequest } from "../types";

export function validateAnalyzeRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { user_id, transcript, images } = req.body as AnalyzeRequest;

  if (!user_id || typeof user_id !== "string") {
    res.status(400).json({
      error: "Request body must include a 'user_id' string",
    });
    return;
  }

  if (!transcript || typeof transcript !== "string") {
    res.status(400).json({
      error: "Request body must include a 'transcript' string",
    });
    return;
  }

  if (images) {
    if (!Array.isArray(images)) {
      res.status(400).json({ error: "'images' must be an array" });
      return;
    }
    for (const img of images) {
      if (!img.mimeType || !img.data) {
        res.status(400).json({
          error: "Each image must have 'mimeType' and 'data' fields",
        });
        return;
      }
    }
  }

  next();
}
