import React, { useEffect, useRef, useState } from "react";
import { FaEdit, FaTimes } from "react-icons/fa";
import { Rnd } from "react-rnd";
import { fileToWebPDataUrl } from "../../../utils/imageUtils";

const buildControlRailStyle = (side = "right", vertical = "bottom") => ({
  position: "absolute",
  [vertical]: 0,
  [side]: "18px",
  transform: `translateY(${vertical === "bottom" ? "50%" : "-50%"})`,
  display: "flex",
  flexDirection: "row",
  gap: "8px",
  zIndex: 20,
});

const buildControlButtonStyle = (background, color) => ({
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  border: "2px solid rgba(255, 255, 255, 0.94)",
  background,
  color,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(45, 27, 56, 0.18)",
});

export default function ImageBox({
  id,
  onDelete,
  onUpdate,
  initialContent,
  box,
  isInContainer = false,
}) {
  const [image, setImage] = useState(initialContent || null);
  const [editing, setEditing] = useState(!initialContent);
  const containerRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);
  const lastSizeRef = useRef({ width: box?.width || 0, height: box?.height || 0 });

  useEffect(() => {
    lastSizeRef.current = {
      width: box?.width || lastSizeRef.current.width || 0,
      height: box?.height || lastSizeRef.current.height || 0,
    };
  }, [box?.height, box?.width]);

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await fileToWebPDataUrl(file, { maxWidth: 800, quality: 0.8 });
    setImage(dataUrl);
    setEditing(false);
    onUpdate(id, { content: dataUrl });
  };

  useEffect(() => {
    isResizingRef.current = isResizing;
  }, [isResizing]);

  useEffect(() => {
    if (!isResizing) return;
    const stopResizing = () => setIsResizing(false);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);
    return () => {
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
    };
  }, [isResizing]);

  useEffect(() => {
    if (!isInContainer || !containerRef.current) return;
    const element = containerRef.current;
    let frameId = null;

    const observer = new ResizeObserver((entries) => {
      if (!isResizingRef.current) return;
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = Math.round(entry.contentRect.width);
      const nextHeight = Math.round(entry.contentRect.height);
      if (nextWidth <= 0 || nextHeight <= 0) return;
      const last = lastSizeRef.current;
      if (nextWidth === last.width && nextHeight === last.height) return;
      lastSizeRef.current = { width: nextWidth, height: nextHeight };
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        onUpdate(id, { width: nextWidth, height: nextHeight });
      });
    });

    observer.observe(element);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [id, isInContainer, onUpdate]);

  const rail = (
    <div style={buildControlRailStyle("right", "bottom")}>
      {!editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={buildControlButtonStyle("#fff7ed", "#d97706")}
          title="Edit image"
        >
          <FaEdit />
        </button>
      )}

      <button
        type="button"
        onDoubleClick={() => onDelete(id)}
        style={buildControlButtonStyle("#fff1f4", "#d90445")}
        title="Double-click to delete"
      >
        <FaTimes />
      </button>
    </div>
  );

  if (isInContainer) {
    return (
      <div
        style={{
          position: "relative",
          display: "inline-block",
          width: box?.width ? `${box.width}px` : "100%",
          minHeight: "100px",
          overflow: "visible",
        }}
      >
        {rail}

        <div
          ref={containerRef}
          onPointerDown={(event) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const nearRight = rect.right - event.clientX <= 18;
            const nearBottom = rect.bottom - event.clientY <= 18;
            if (nearRight && nearBottom) {
              setIsResizing(true);
            }
          }}
          onPointerUp={() => setIsResizing(false)}
          onPointerLeave={() => {
            if (isResizingRef.current) setIsResizing(false);
          }}
          style={{
            border: "2px dashed #555",
            background: "#fdfdfd",
            borderRadius: "8px",
            padding: "8px",
            paddingBottom: "44px",
            position: "relative",
            width: "100%",
            height: box?.height ? `${box.height}px` : "auto",
            minHeight: "100px",
            resize: "both",
            overflow: "auto",
          }}
        >
          {editing ? (
            <input type="file" accept="image/*" onChange={handleImageChange} />
          ) : (
            <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: "8px" }}>
              <img
                src={image}
                alt="uploaded"
                style={{ width: "100%", height: "100%", borderRadius: "8px", objectFit: "cover" }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Rnd
      bounds="parent"
      position={{ x: box.x, y: box.y }}
      size={{ width: box.width, height: box.height }}
      minWidth={150}
      minHeight={100}
      onDrag={(event, data) => {
        onUpdate(id, { x: data.x, y: data.y, dragging: true });
      }}
      onDragStop={(event, data) => {
        onUpdate(id, { x: data.x, y: data.y, dragging: false });
      }}
      onResizeStop={(event, direction, ref, delta, position) => {
        onUpdate(id, {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
          x: position.x,
          y: position.y,
        });
      }}
      style={{
        border: "2px dashed #555",
        background: "#fdfdfd",
        borderRadius: "8px",
        padding: "8px",
        paddingBottom: "44px",
        position: "absolute",
        overflow: "visible",
      }}
    >
      {rail}

      {editing ? (
        <input type="file" accept="image/*" onChange={handleImageChange} />
      ) : (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: "8px" }}>
          <img
            src={image}
            alt="uploaded"
            style={{ width: "100%", height: "100%", borderRadius: "8px", objectFit: "cover" }}
          />
        </div>
      )}
    </Rnd>
  );
}
