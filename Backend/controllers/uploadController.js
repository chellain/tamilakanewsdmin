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

export const uploadVideo = async (req, res) => {
  const videoFile = req.files?.video?.[0] || null;
  const thumbnailFile = req.files?.thumbnail?.[0] || null;

  if (!videoFile || !thumbnailFile) {
    return res.status(400).json({ message: "Video and thumbnail are required." });
  }

  try {
    // Convert thumbnail to optimized WebP
    const originalThumbPath = thumbnailFile.path;
    const thumbBaseName = path.parse(thumbnailFile.filename).name;
    const webpName = `${thumbBaseName}.webp`;
    const webpPath = path.join(thumbDir, webpName);

    await sharp(originalThumbPath)
      .resize(800)
      .webp({ quality: 80 })
      .toFile(webpPath);

    // Clean up original uploaded file
    if (originalThumbPath && originalThumbPath !== webpPath) {
      try {
        await fs.promises.unlink(originalThumbPath);
      } catch (err) {
        // If deletion fails, we still proceed, but log for debugging
        console.warn("Failed to delete original thumbnail:", err);
      }
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    return res.json({
      videoUrl: `${baseUrl}/uploads/videos/${videoFile.filename}`,
      thumbnailUrl: `${baseUrl}/uploads/thumbnails/${webpName}`,
    });
  } catch (err) {
    console.error("Thumbnail conversion failed:", err);
    return res.status(500).json({ message: "Failed to process thumbnail.", error: err.message });
  }
};
