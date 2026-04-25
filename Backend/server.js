import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import newsRoutes from "./routes/newsRoutes.js";
import layoutRoutes from "./routes/layoutRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import newsPageConfigRoutes from "./routes/newsPageConfigRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import News from "./models/News.js";
import { resolvePublicOrigin } from "./utils/publicOrigin.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("trust proxy", true);

const trimToWords = (text, maxWords = 8) => {
  if (!text) return "";
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (!maxWords || maxWords <= 0) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
};

const stripDiacritics = (text) => {
  if (!text) return "";
  return String(text).normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
};

const toSlug = (text, maxWords = 8) => {
  const trimmed = trimToWords(text, maxWords);
  const normalized = stripDiacritics(trimmed);
  const slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9\u0B80-\u0BFF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || "news";
};

const toSectionSlug = (name) => {
  if (!name) return "";
  const normalized = stripDiacritics(String(name).trim());
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9\u0B80-\u0BFF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
};

const normalizeCategory = (category) => {
  if (Array.isArray(category)) {
    const first = category.find((item) => item && String(item).trim().length > 0);
    return first || "";
  }
  return category || "";
};

const uniqueNonEmpty = (...values) =>
  Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );

const getNewsHeadlineCandidates = (news) =>
  uniqueNonEmpty(news?.dataEn?.headline, news?.data?.headline, news?.title);

const getNewsCategoryCandidates = (news) => {
  const fromData = normalizeCategory(
    news?.data?.zonal ?? news?.data?.category ?? news?.data?.section ?? news?.category
  );
  const fromDataEn = normalizeCategory(
    news?.dataEn?.zonal ?? news?.dataEn?.category ?? news?.dataEn?.section
  );

  return uniqueNonEmpty(fromDataEn, fromData);
};

const matchesNewsPath = (news, categorySlug, slug) => {
  if (!news) return false;

  const headlineSlugs = getNewsHeadlineCandidates(news).map((headline) => toSlug(headline));
  if (slug && !headlineSlugs.includes(slug)) {
    return false;
  }

  if (!categorySlug) {
    return true;
  }

  const categorySlugs = getNewsCategoryCandidates(news)
    .map((category) => toSectionSlug(category))
    .filter(Boolean);

  return categorySlugs.length === 0 || categorySlugs.includes(categorySlug);
};

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const resolveShareImage = (rawImage, backendOrigin) => {
  if (typeof rawImage !== "string") return "";

  const image = rawImage.trim();
  if (!image || image.startsWith("data:")) return "";
  if (/^https?:\/\//i.test(image)) {
    try {
      const url = new URL(image);
      if (url.pathname.startsWith("/uploads/")) {
        return `${backendOrigin}${url.pathname}${url.search}${url.hash}`;
      }
      return image;
    } catch (error) {
      return image;
    }
  }
  if (image.startsWith("/")) return `${backendOrigin}${image}`;

  return `${backendOrigin}/${image.replace(/^\/+/, "")}`;
};

const parseImageDataUrl = (rawImage) => {
  if (typeof rawImage !== "string") return null;
  const match = rawImage.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  try {
    return {
      mimeType: match[1],
      buffer: Buffer.from(match[2], "base64"),
    };
  } catch (error) {
    return null;
  }
};

const parseNewsPath = (rawPath) => {
  const newsPath =
    typeof rawPath === "string" && rawPath.trim()
      ? rawPath.trim().startsWith("/")
        ? rawPath.trim()
        : `/${rawPath.trim()}`
      : "/";
  const segments = newsPath.split("/").filter(Boolean);

  return {
    newsPath,
    slug: segments[segments.length - 1] || "",
    categorySlug: segments.length > 1 ? segments[segments.length - 2] || "" : "",
    headlineApprox: (segments[segments.length - 1] || "").replace(/-/g, " ").trim(),
  };
};

const findNewsByPath = async (rawPath) => {
  const { slug, categorySlug, headlineApprox } = parseNewsPath(rawPath);
  if (!headlineApprox) return null;

  const pattern = escapeRegex(headlineApprox).replace(/\s+/g, ".*");
  const headlineRegex = new RegExp(pattern, "i");

  const candidates = await News.find({
    $or: [
      { "data.headline": { $regex: headlineRegex } },
      { "dataEn.headline": { $regex: headlineRegex } },
      { title: { $regex: headlineRegex } },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();

  return (
    candidates.find((item) => matchesNewsPath(item, categorySlug, slug)) ||
    candidates[0] ||
    null
  );
};

const buildOgImageUrl = (backendOrigin, newsPath) => {
  const url = new URL("/api/og-image", backendOrigin);
  url.searchParams.set("path", newsPath);
  return url.toString();
};

const ogPreviewHandler = async (req, res) => {
  const { newsPath } = parseNewsPath(req.query.path);
  const userSiteOrigin = (process.env.USER_SITE_ORIGIN || "https://tamilakanews.com").replace(/\/$/, "");
  const backendOrigin = resolvePublicOrigin(req);
  const pageUrl = `${userSiteOrigin}${newsPath}`;

  try {
    const news = await findNewsByPath(newsPath);

    const title =
      news?.data?.headline || news?.dataEn?.headline || news?.title || "Tamilaka News";
    const description =
      news?.data?.oneLiner ||
      news?.dataEn?.oneLiner ||
      "Latest trending news from Tamil Nadu.";
    const rawImage = news?.data?.thumbnail || news?.dataEn?.thumbnail || "";
    const publishedRaw = news?.time || news?.createdAt || news?.updatedAt || "";
    const publishedIso = publishedRaw ? new Date(publishedRaw).toISOString() : "";
    const legacyImage = parseImageDataUrl(rawImage);
    const image = legacyImage
      ? buildOgImageUrl(backendOrigin, newsPath)
      : resolveShareImage(rawImage, backendOrigin);

    return res
      .type("html")
      .send(`<!DOCTYPE html>
<html lang="ta">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)} | Tamilaka News</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Tamilaka News" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    ${publishedIso ? `<meta property="article:published_time" content="${escapeHtml(publishedIso)}" />` : ""}
    ${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ""}
    <meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ""}
    <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}" />
  </head>
  <body></body>
</html>`);
  } catch (err) {
    console.error("[OG] error:", err.message);
    return res.redirect(pageUrl);
  }
};

const ogImageHandler = async (req, res) => {
  const { newsPath } = parseNewsPath(req.query.path);
  const backendOrigin = resolvePublicOrigin(req);

  try {
    const news = await findNewsByPath(newsPath);
    const rawImage = news?.data?.thumbnail || news?.dataEn?.thumbnail || "";
    const parsedImage = parseImageDataUrl(rawImage);

    if (parsedImage) {
      return res
        .set("Content-Type", parsedImage.mimeType)
        .set("Cache-Control", "public, max-age=300")
        .send(parsedImage.buffer);
    }

    const directImage = resolveShareImage(rawImage, backendOrigin);
    if (directImage) {
      return res.redirect(directImage);
    }

    return res.status(404).end();
  } catch (err) {
    console.error("[OG image] error:", err.message);
    return res.status(500).end();
  }
};

// Core middleware
app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/news", newsRoutes);
app.use("/api/layout", layoutRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/newspage", newsPageConfigRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/progress", progressRoutes);

app.get("/", (req, res) => {
  res.send("Tamilaka News API is running");
});

app.get("/og", ogPreviewHandler);
app.get("/api/og", ogPreviewHandler);
app.get("/og-image", ogImageHandler);
app.get("/api/og-image", ogImageHandler);

const PORT = Number(process.env.PORT || 5000);
const PUBLIC_PORT = Number(process.env.PUBLIC_PORT || 0);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    if (PUBLIC_PORT && PUBLIC_PORT !== PORT) {
      app.listen(PUBLIC_PORT, () => {
        console.log(`Server also listening on port ${PUBLIC_PORT}`);
      });
    }
  } catch (error) {
    console.error("Server startup failed:", error.stack || error.message || error);
    process.exit(1);
  }
};

startServer();
