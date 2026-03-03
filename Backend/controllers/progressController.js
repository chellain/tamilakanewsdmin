import Progress from "../models/Progress.js";

export const getProgress = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const items = await Progress.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch progress", error: error.message });
  }
};

export const logProgress = async (req, res) => {
  try {
    const { action, details, newsId, newsTitle, newsImage } = req.body || {};

    if (!action || typeof action !== "string" || !action.trim()) {
      return res.status(400).json({ message: "Action is required" });
    }

    const payload = {
      userId: req.user?._id,
      userName: req.user?.name || "Unknown",
      action: action.trim(),
      details: typeof details === "string" ? details.trim().slice(0, 500) : ""
    };

    if (typeof newsId !== "undefined") {
      payload.newsId = newsId;
    }
    if (typeof newsTitle === "string") {
      payload.newsTitle = newsTitle.trim().slice(0, 200);
    }
    if (typeof newsImage === "string") {
      payload.newsImage = newsImage;
    }

    const created = await Progress.create(payload);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: "Failed to log progress", error: error.message });
  }
};
