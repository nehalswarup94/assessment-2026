import { Router } from "express";
import * as inductionService from "../services/inductionService";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await inductionService.getInductions();
    res.json(result);
  } catch (error) {
    console.error("Error fetching inductions:", error);
    res.status(500).json({ error: "Failed to fetch inductions" });
  }
});

router.get("/records/all", async (_req, res) => {
  try {
    const result = await inductionService.getAllInductionRecords();
    res.json(result);
  } catch (error) {
    console.error("Error fetching all induction records:", error);
    res.status(500).json({ error: "Failed to fetch induction records" });
  }
});

router.get("/:id/records", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await inductionService.getInductionRecords(id);
    res.json(result);
  } catch (error) {
    console.error("Error fetching induction records:", error);
    res.status(500).json({ error: "Failed to fetch induction records" });
  }
});

export default router;
