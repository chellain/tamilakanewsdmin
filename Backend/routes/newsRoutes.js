import express from "express";
import {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  addComment
} from "../controllers/newsController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllNews);
router.post("/", protect, adminOnly, createNews);
router.get("/:id", getNewsById);
router.post("/:id/comments", addComment);
router.put("/:id", protect, adminOnly, updateNews);
router.delete("/:id", protect, adminOnly, deleteNews);

export default router;
