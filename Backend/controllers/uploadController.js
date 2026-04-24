import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, "..", "uploads");
const thumbDir = path.join(uploadsRoot, "thumbnails");

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDir(thumbDir);

const buildBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;

const optimizeThumbnail = async (thumbnailFile) => {
  const originalThumbPath = thumbnailFile.path;
  const thumbBaseName = path.parse(thumbnailFile.filename).name;
  const webpName = `${thumbBaseName}.webp`;
  const webpPath = path.join(thumbDir, webpName);

  await sharp(originalThumbPath)
    .resize({
      width: 1200,
      height: 630,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toFile(webpPath);

  if (originalThumbPath && originalThumbPath !== webpPath) {
    try {
      await fs.promises.unlink(originalThumbPath);
    } catch (err) {
      console.warn("Failed to delete original thumbnail:", err);
    }
  }

  return webpName;
};

export const uploadThumbnail = async (req, res) => {
  const thumbnailFile = req.file || req.files?.thumbnail?.[0] || null;

  if (!thumbnailFile) {
    return res.status(400).json({ message: "Thumbnail is required." });
  }

  try {
    const webpName = await optimizeThumbnail(thumbnailFile);
    const mediaPath = `/uploads/thumbnails/${webpName}`;

    return res.json({
      url: mediaPath,
      publicUrl: `${buildBaseUrl(req)}${mediaPath}`,
    });
  } catch (err) {
    console.error("Thumbnail upload failed:", err);
    return res.status(500).json({
      message: "Failed to process thumbnail.",
      error: err.message,
    });
  }
};

export const uploadVideo = async (req, res) => {
  const videoFile = req.files?.video?.[0] || null;
  const thumbnailFile = req.files?.thumbnail?.[0] || null;

  if (!videoFile || !thumbnailFile) {
    return res.status(400).json({ message: "Video and thumbnail are required." });
  }

  try {
    const webpName = await optimizeThumbnail(thumbnailFile);
    const baseUrl = buildBaseUrl(req);

    return res.json({
      videoUrl: `${baseUrl}/uploads/videos/${videoFile.filename}`,
      thumbnailUrl: `${baseUrl}/uploads/thumbnails/${webpName}`,
    });
  } catch (err) {
    console.error("Thumbnail conversion failed:", err);
    return res.status(500).json({ message: "Failed to process thumbnail.", error: err.message });
  }
};
