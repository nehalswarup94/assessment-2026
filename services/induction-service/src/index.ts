import express from "express";
import inductionRouter from "./routers/inductionRouter";

const app = express();
const PORT = process.env.PORT || 8552;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "induction-service" });
});

app.use("/induction", inductionRouter);

app.listen(PORT, () => {
  console.log(`Induction service running on port ${PORT}`);
});
