import express from "express";
import { config } from "./config";
import analyzeRoute from "./routes/analyze";

const app = express();

app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "caic-backend-blueprint is running" });
});

app.use("/analyze", analyzeRoute);

app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
});
