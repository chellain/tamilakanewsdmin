import News from "../models/News.js";
import Progress from "../models/Progress.js";

const buildBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;

const absolutizeUploadUrl = (value, req) => {
  if (typeof value !== "string") return value;

  const raw = value.trim();
  if (
    !raw ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:") ||
    /^https?:\/\//i.test(raw)
  ) {
    return raw;
  }

  const baseUrl = buildBaseUrl(req);

  if (raw.startsWith("/uploads/")) {
    return `${baseUrl}${raw}`;
  }

  if (raw.startsWith("uploads/")) {
    return `${baseUrl}/${raw}`;
  }

  return raw;
};

const normalizeVideoDataMedia = (videoData, req) => {
  if (!videoData || typeof videoData !== "object") return videoData;

  return {
    ...videoData,
    thumbnail: absolutizeUploadUrl(videoData.thumbnail, req),
    videoUrl: absolutizeUploadUrl(videoData.videoUrl, req),
  };
};

const normalizeBoxMedia = (box, req) => {
  if (!box || typeof box !== "object" || box.type !== "video") return box;

  return {
    ...box,
    videoData: normalizeVideoDataMedia(box.videoData, req),
  };
};

const normalizeContainerMedia = (container, req) => {
  if (!container?.settings?.boxes || !Array.isArray(container.settings.boxes)) {
    return container;
  }

  return {
    ...container,
    settings: {
      ...container.settings,
      boxes: container.settings.boxes.map((box) => normalizeBoxMedia(box, req)),
    },
  };
};

const serializeNewsMedia = (news, req) => {
  if (!news) return news;

  const plainNews =
    typeof news.toObject === "function" ? news.toObject() : { ...news };

  return {
    ...plainNews,
    data: plainNews.data
      ? {
          ...plainNews.data,
          thumbnail: absolutizeUploadUrl(plainNews.data.thumbnail, req),
        }
      : plainNews.data,
    dataEn: plainNews.dataEn
      ? {
          ...plainNews.dataEn,
          thumbnail: absolutizeUploadUrl(plainNews.dataEn.thumbnail, req),
        }
      : plainNews.dataEn,
    fullContent: Array.isArray(plainNews.fullContent)
      ? plainNews.fullContent.map((box) => normalizeBoxMedia(box, req))
      : plainNews.fullContent,
    containerOverlays: Array.isArray(plainNews.containerOverlays)
      ? plainNews.containerOverlays.map((container) =>
          normalizeContainerMedia(container, req)
        )
      : plainNews.containerOverlays,
  };
};

const isObjectId = (value) =>
  typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value.trim());

const buildNewsQuery = (idParam) => {
  if (isObjectId(idParam)) {
    return { _id: idParam };
  }

  const asNumber = Number(idParam);
  return Number.isNaN(asNumber) ? { id: idParam } : { id: asNumber };
};

export const getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news.map((item) => serializeNewsMedia(item, req)));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch news", error: error.message });
  }
};

export const getNewsById = async (req, res) => {
  try {
    const news = await News.findOne(buildNewsQuery(req.params.id));
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }
    res.json(serializeNewsMedia(news, req));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch news", error: error.message });
  }
};

export const createNews = async (req, res) => {
  try {
    const created = await News.create(req.body);

    if (req.user) {
      try {
        const thumb = created?.data?.thumbnail;
        await Progress.create({
          userId: req.user._id,
          userName: req.user.name || "Unknown",
          action: "news_create",
          details: "Created news",
          newsId: created._id || created.id,
          newsTitle:
            created?.data?.headline ||
            created?.title ||
            created?.data?.oneLiner ||
            "News",
          newsImage: typeof thumb === "string" ? thumb : "",
        });
      } catch (logError) {
        console.error("Failed to log progress for news create:", logError.message);
      }
    }

    res.status(201).json(serializeNewsMedia(created, req));
  } catch (error) {
    res.status(400).json({ message: "Failed to create news", error: error.message });
  }
};

export const updateNews = async (req, res) => {
  try {
    const updated = await News.findOneAndUpdate(
      buildNewsQuery(req.params.id),
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "News not found" });
    }

    if (req.user) {
      try {
        const thumb = updated?.data?.thumbnail;
        await Progress.create({
          userId: req.user._id,
          userName: req.user.name || "Unknown",
          action: "news_update",
          details: "Updated news",
          newsId: updated._id || updated.id,
          newsTitle:
            updated?.data?.headline ||
            updated?.title ||
            updated?.data?.oneLiner ||
            "News",
          newsImage: typeof thumb === "string" ? thumb : "",
        });
      } catch (logError) {
        console.error("Failed to log progress for news update:", logError.message);
      }
    }

    res.json(serializeNewsMedia(updated, req));
  } catch (error) {
    res.status(400).json({ message: "Failed to update news", error: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { comment } = req.body || {};

    if (!comment || !comment.name || !comment.text) {
      return res.status(400).json({ message: "Comment name and text are required" });
    }

    const prepared = {
      id: comment.id ?? Date.now(),
      name: String(comment.name),
      text: String(comment.text),
      timestamp: comment.timestamp || new Date().toLocaleString(),
    };

    const updated = await News.findOneAndUpdate(
      buildNewsQuery(req.params.id),
      { $push: { comments: prepared } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "News not found" });
    }

    res.json({ comments: updated.comments || [] });
  } catch (error) {
    res.status(500).json({ message: "Failed to add comment", error: error.message });
  }
};

export const deleteNews = async (req, res) => {
  try {
    const deleted = await News.findOneAndDelete(buildNewsQuery(req.params.id));

    if (!deleted) {
      return res.status(404).json({ message: "News not found" });
    }

    res.json({ message: "News deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete news", error: error.message });
  }
};
