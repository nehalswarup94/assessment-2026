import { Router } from "express";
import * as inductionService from "../services/inductionService";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : "default-user";
    const preferences = await inductionService.getUserPreferences(userId);
    res.json(preferences ?? {
      sortBy: "created_at",
      sortOrder: "desc",
      status: "all",
      search: "",
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({ error: "Failed to fetch user preferences" });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : "default-user";
    const preferences = req.body;

    if (!preferences || typeof preferences !== "object") {
      return res.status(400).json({ error: "Invalid preferences payload" });
    }

    const saved = await inductionService.saveUserPreferences(userId, preferences);
    res.json(saved);
  } catch (error) {
    console.error("Error saving user preferences:", error);
    res.status(500).json({ error: "Failed to save user preferences" });
  }
});

export default router;
