import React, { useEffect, useRef, useState } from "react";
import { IoIosClose } from "react-icons/io";
import { MdEdit } from "react-icons/md";
import { FaPlay, FaUpload, FaYoutube } from "react-icons/fa";
import { fileToWebPDataUrl } from "../../../utils/imageUtils";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const uploadBtnStyle = (bg) => ({
  padding: "16px 24px",
  fontSize: "15px",
  background: bg,
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  transition: "background 0.2s",
});

const actionBtn = (bg) => ({
  padding: "10px 20px",
  fontSize: "13px",
  background: bg,
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
});

const inputStyle = {
  width: "100%",
  padding: "8px",
  border: "2px solid #ddd",
  borderRadius: "4px",
  fontSize: "13px",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontWeight: "500",
  fontSize: "13px",
  color: "#444",
};

const fileNameStyle = {
  marginTop: "6px",
  fontSize: "11px",
  color: "#666",
};

const editPopupStyle = {
  position: "absolute",
  top: "18px",
  right: "18px",
  background: "white",
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "16px",
  zIndex: 30,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  minWidth: "220px",
};

const changeFileOverlayStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.9)",
  zIndex: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const changeFileInnerStyle = {
  background: "white",
  borderRadius: "8px",
  padding: "20px",
  maxWidth: "480px",
  width: "90%",
  position: "relative",
};

const controlRailStyle = {
  position: "absolute",
  bottom: 0,
  right: "18px",
  transform: "translateY(50%)",
  display: "flex",
  flexDirection: "row",
  gap: "8px",
  zIndex: 20,
};

const controlButtonStyle = (bg, color) => ({
  background: bg,
  color,
  border: "2px solid rgba(255, 255, 255, 0.94)",
  borderRadius: "999px",
  cursor: "pointer",
  width: "30px",
  height: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 20px rgba(45, 27, 56, 0.18)",
});

const NewsVideoBox = ({
  id,
  onDelete,
  onUpdate,
  initialData = {},
  isInContainer = false,
}) => {
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const videoRef = useRef(null);

  const [videoData, setVideoData] = useState(initialData.videoData || null);
  const [dimensions, setDimensions] = useState({ width: 800, ...(initialData.dimensions || {}) });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showChangeFile, setShowChangeFile] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedThumb, setSelectedThumb] = useState(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
  const [tempWidth, setTempWidth] = useState(dimensions.width);

  useEffect(() => {
    setVideoData(initialData.videoData || null);
    setDimensions({ width: 800, ...(initialData.dimensions || {}) });
    setTempWidth(initialData.dimensions?.width || 800);
  }, [id, initialData.dimensions, initialData.videoData]);

  useEffect(() => {
    if (!selectedVideo) return;
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      setVideoAspectRatio(video.videoWidth / video.videoHeight);
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(selectedVideo);
  }, [selectedVideo]);

  useEffect(() => {
    if (!videoData) return;
    if (videoData.type === "youtube") {
      setVideoAspectRatio(16 / 9);
      return;
    }

    if (videoData.type === "device" && videoData.videoUrl) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        setVideoAspectRatio(video.videoWidth / video.videoHeight);
        URL.revokeObjectURL(video.src);
      };
      video.src = videoData.videoUrl;
    }
  }, [videoData]);

  const propagate = (nextVideoData, nextDimensions) => {
    onUpdate?.(id, { videoData: nextVideoData, dimensions: nextDimensions });
  };

  const extractYouTubeId = (url) => {
    const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getPaddingBottom = () =>
    videoAspectRatio < 1 ? `${(1 / videoAspectRatio) * 100}%` : "56.25%";

  const handleYouTubeUpload = () => {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      alert("Please enter a valid YouTube URL");
      return;
    }

    const nextVideoData = {
      type: "youtube",
      videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };

    setVideoData(nextVideoData);
    propagate(nextVideoData, dimensions);
    setYoutubeUrl("");
    setUploadType(null);
    setShowChangeFile(false);
    setShowEditPopup(false);
  };

  const handleDeviceUpload = async () => {
    if (!selectedVideo || !selectedThumb) {
      alert("Please select both a video file and a thumbnail image");
      return;
    }

    const videoUrl = await readFileAsDataUrl(selectedVideo);
    const thumbnailUrl = await fileToWebPDataUrl(selectedThumb, {
      maxWidth: 800,
      quality: 0.8,
    });

    const nextVideoData = {
      type: "device",
      videoUrl,
      thumbnail: thumbnailUrl,
    };

    setVideoData(nextVideoData);
    propagate(nextVideoData, dimensions);
    setSelectedVideo(null);
    setSelectedThumb(null);
    setUploadType(null);
    setShowChangeFile(false);
    setShowEditPopup(false);
  };

  const handleWidthChange = (event) => {
    const width = parseInt(event.target.value, 10) || 800;
    setTempWidth(width);
    const nextDimensions = { ...dimensions, width };
    setDimensions(nextDimensions);
    propagate(videoData, nextDimensions);
  };

  const handleChangeFile = () => {
    setUploadType(videoData?.type || null);
    setYoutubeUrl("");
    setSelectedVideo(null);
    setSelectedThumb(null);
    setShowChangeFile(true);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    onDelete?.(id);
  };

  const renderUploadUI = () => {
    if (!uploadType) {
      return (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <h3 style={{ marginBottom: "30px", color: "#333", fontSize: "16px" }}>
            Choose Upload Method
          </h3>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setUploadType("youtube")}
              style={uploadBtnStyle("#ff0000")}
              onMouseEnter={(event) => (event.currentTarget.style.background = "#cc0000")}
              onMouseLeave={(event) => (event.currentTarget.style.background = "#ff0000")}
            >
              <FaYoutube size={22} /> YouTube
            </button>
            <button
              onClick={() => setUploadType("device")}
              style={uploadBtnStyle("#2196F3")}
              onMouseEnter={(event) => (event.currentTarget.style.background = "#1976D2")}
              onMouseLeave={(event) => (event.currentTarget.style.background = "#2196F3")}
            >
              <FaUpload size={20} /> Device
            </button>
          </div>
        </div>
      );
    }

    if (uploadType === "youtube") {
      return (
        <div style={{ padding: "30px" }}>
          <h3 style={{ marginBottom: "16px", color: "#333", fontSize: "15px" }}>
            YouTube Video URL
          </h3>
          <input
            type="text"
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="Paste YouTube URL here..."
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button onClick={handleYouTubeUpload} style={actionBtn("#ff0000")}>
              Upload
            </button>
            <button
              onClick={() => {
                setUploadType(null);
                setYoutubeUrl("");
              }}
              style={actionBtn("#999")}
            >
              Back
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: "30px" }}>
        <h3 style={{ marginBottom: "16px", color: "#333", fontSize: "15px" }}>
          Upload from Device
        </h3>
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Video File</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={(event) => setSelectedVideo(event.target.files?.[0] || null)}
            style={inputStyle}
          />
          {selectedVideo && <p style={fileNameStyle}>{selectedVideo.name}</p>}
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Thumbnail Image</label>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={(event) => setSelectedThumb(event.target.files?.[0] || null)}
            style={inputStyle}
          />
          {selectedThumb && <p style={fileNameStyle}>{selectedThumb.name}</p>}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleDeviceUpload}
            disabled={!selectedVideo || !selectedThumb}
            style={actionBtn(selectedVideo && selectedThumb ? "#2196F3" : "#ccc")}
          >
            Upload
          </button>
          <button
            onClick={() => {
              setUploadType(null);
              setSelectedVideo(null);
              setSelectedThumb(null);
            }}
            style={actionBtn("#999")}
          >
            Back
          </button>
        </div>
      </div>
    );
  };

  const containerWidth = dimensions.width;
  const displayWidth =
    videoAspectRatio < 1 ? Math.min(containerWidth * 0.6, 600) : containerWidth;

  const controlRail = (
    <div style={controlRailStyle}>
      {videoData && (
        <button
          onClick={() => setShowEditPopup((value) => !value)}
          title="Edit settings"
          style={controlButtonStyle("#f3e8ff", "#7c3aed")}
        >
          <MdEdit style={{ fontSize: "16px" }} />
        </button>
      )}
      <button
        onDoubleClick={handleDelete}
        title="Double-click to delete"
        style={controlButtonStyle("#fff1f4", "#d90445")}
      >
        <IoIosClose style={{ fontSize: "22px" }} />
      </button>
    </div>
  );

  if (!videoData) {
    return (
      <div
        style={{
          width: `${containerWidth}px`,
          margin: "0 auto",
          border: isInContainer ? "1px solid #ddd" : "2px solid #ddd",
          borderRadius: "8px",
          background: "#f5f5f5",
          minHeight: "300px",
          position: "relative",
          overflow: "visible",
          paddingBottom: "44px",
        }}
      >
        {controlRail}
        {renderUploadUI()}
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${displayWidth}px`,
        margin: "0 auto",
        position: "relative",
        borderRadius: "8px",
        overflow: "visible",
      }}
    >
      {controlRail}

      <div
        style={{
          position: "relative",
          borderRadius: "8px",
          overflow: "hidden",
          background: "#000",
          border: isInContainer ? "1px solid #444" : "2px solid #444",
          paddingBottom: "44px",
        }}
      >
        {showEditPopup && (
          <div style={editPopupStyle}>
            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Container Width (px)</label>
              <input
                type="number"
                value={tempWidth}
                onChange={handleWidthChange}
                min="200"
                max="1200"
                style={{ ...inputStyle, marginTop: "4px" }}
              />
            </div>
            <button
              onClick={handleChangeFile}
              style={{ ...actionBtn("#2196F3"), marginBottom: "8px", width: "100%" }}
            >
              Change Video
            </button>
            <button
              onClick={() => setShowEditPopup(false)}
              style={{ ...actionBtn("#999"), width: "100%" }}
            >
              Close
            </button>
          </div>
        )}

        {showChangeFile && (
          <div style={changeFileOverlayStyle}>
            <div style={changeFileInnerStyle}>
              <button
                onClick={() => {
                  setShowChangeFile(false);
                  setUploadType(null);
                }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "22px",
                  color: "#999",
                }}
              >
                <IoIosClose />
              </button>
              {renderUploadUI()}
            </div>
          </div>
        )}

        {!isPlaying && (
          <div
            style={{
              position: "relative",
              width: "100%",
              paddingBottom: getPaddingBottom(),
              background: "#000",
            }}
          >
            <img
              src={videoData.thumbnail}
              alt="Video thumbnail"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <button
              onClick={() => setIsPlaying(true)}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgba(255,255,255,0.9)",
                border: "none",
                borderRadius: "50%",
                width: "72px",
                height: "72px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "26px",
                color: "#333",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform = "translate(-50%, -50%) scale(1.1)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
              }}
            >
              <FaPlay style={{ marginLeft: "4px" }} />
            </button>
          </div>
        )}

        {isPlaying && (
          <div style={{ position: "relative", width: "100%", paddingBottom: getPaddingBottom() }}>
            {videoData.type === "youtube" ? (
              <iframe
                ref={videoRef}
                src={`https://www.youtube.com/embed/${videoData.videoId}?autoplay=1`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                src={videoData.videoUrl}
                controls
                autoPlay
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                onEnded={() => setIsPlaying(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsVideoBox;
