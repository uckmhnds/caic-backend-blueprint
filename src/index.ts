import express from "express";
import { config } from "./config";
import caicReportRoute from "./routes/caicReport";
import avalancheReportRoute from "./routes/avalancheReport";

const app = express();

app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "caic-backend-blueprint is running" });
});

app.use("/caic-report", caicReportRoute);
app.use("/avalanche-report", avalancheReportRoute);

app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
});
