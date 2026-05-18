import express from "express";
import companyRouter from "./routers/companyRouter";

const app = express();
const PORT = process.env.PORT || 8553;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "company-service" });
});

app.use("/company", companyRouter);

app.listen(PORT, () => {
  console.log(`Company service running on port ${PORT}`);
});
