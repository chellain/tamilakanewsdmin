import express from "express";
import { getProgress, logProgress } from "../controllers/progressController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getProgress);
router.post("/", protect, logProgress);

export default router;
