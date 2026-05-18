import { Router } from "express";
import * as companyService from "../services/companyService";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await companyService.getCompanies();
    res.json(result);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

export default router;
