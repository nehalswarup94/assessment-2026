import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8551;

app.use(cors({ origin: /^http:\/\/localhost(:\d+)?$/ }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway-service" });
});

app.listen(PORT, () => {
  console.log(`Gateway service running on port ${PORT}`);
});
