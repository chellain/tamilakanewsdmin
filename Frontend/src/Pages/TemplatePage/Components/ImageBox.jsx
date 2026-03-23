import React, { useEffect, useRef, useState } from 'react'
import { FaCheck, FaEdit, FaTimes } from "react-icons/fa";
import { Rnd } from "react-rnd";
import { fileToWebPDataUrl } from "../../../utils/imageUtils";

export default function ImageBox({ id, onDelete, onUpdate, initialContent, box, isInContainer = false }) {
  const [image, setImage] = useState(initialContent || null);
  const [editing, setEditing] = useState(!initialContent);
  const containerRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);
  const lastSizeRef = useRef({ width: box?.width || 0, height: box?.height || 0 });

  useEffect(() => {
    lastSizeRef.current = {
      width: box?.width || lastSizeRef.current.width || 0,
      height: box?.height || lastSizeRef.current.height || 0
    };
  }, [box?.width, box?.height]);
  
  // const handleDragStart = (e) => {
  //   e.dataTransfer.effectAllowed = "move";
  //   e.dataTransfer.setData("boxId", id.toString());
  //   e.dataTransfer.setData("boxType", "image");
  // };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const dataUrl = await fileToWebPDataUrl(file, { maxWidth: 800, quality: 0.8 });
      setImage(dataUrl);
      setEditing(false);
      onUpdate(id, { content: dataUrl });
    }
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

  if (isInContainer) {
    return (
      <div
        ref={containerRef}
        onPointerDown={(e) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const nearRight = rect.right - e.clientX <= 18;
          const nearBottom = rect.bottom - e.clientY <= 18;
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
          position: "relative",
          width: box?.width ? `${box.width}px` : "100%",
          height: box?.height ? `${box.height}px` : "auto",
          minHeight: "100px",
          resize: "both",
          overflow: "auto"
        }}
      >
        <FaTimes
          color="red"
          style={{
            position: "absolute",
            top: "auto",
            bottom: 5,
            left: 5,
            background: "rgba(255, 235, 235, 1)",
            padding: "4px",
            borderRadius: "100%",
            cursor: "pointer",
            boxShadow: "0 0 8px rgba(0,0,0,0.2)",
            fontSize: "23px",
            zIndex: 99
          }}
          onDoubleClick={() => onDelete(id)}
        />

        {editing ? (
          <input type="file" accept="image/*" onChange={handleImageChange} />
        ) : (
          <div style={{ position: "relative" }}>
            <img
              src={image}
              alt="uploaded"
              style={{ width: "100%", height: "100%", borderRadius: "8px", objectFit: "cover" }}
            />
            <FaEdit
              style={{
                position: "absolute",
                cursor: "pointer",
                top: "auto",
                bottom: 5,
                left: 30,
                background: "rgba(238, 255, 232, 1)",
                padding: "4px",
                borderRadius: "100%",
                boxShadow: "0 0 8px rgba(0,0,0,0.2)",
                fontSize: "23px",
                color: "green",
                zIndex: 10
              }}
              onClick={() => setEditing(true)}
            />
          </div>
        )}
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
      onDrag={(e, data) => {
        onUpdate(id, { x: data.x, y: data.y, dragging: true });
      }}
      onDragStop={(e, data) => {
        onUpdate(id, { x: data.x, y: data.y, dragging: false });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate(id, {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
          x: position.x,
          y: position.y
        });
      }}
      style={{
        border: "2px dashed #555",
        background: "#fdfdfd",
        borderRadius: "8px",
        padding: "8px",
        position: "absolute"
      }}
    >
      <FaTimes
        color="red"
        style={{
          position: "absolute",
          top: "auto",
          bottom: 5,
          left: 5,
          background: "rgba(255, 235, 235, 1)",
          padding: "4px",
          borderRadius: "100%",
          cursor: "pointer",
          boxShadow: "0 0 8px rgba(0,0,0,0.2)",
          fontSize: "23px",
          zIndex: 99
        }}
        onDoubleClick={() => onDelete(id)}
      />

      {editing ? (
        <input type="file" accept="image/*" onChange={handleImageChange} />
      ) : (
        <div style={{ position: "relative" }}>
          <img
            src={image}
            alt="uploaded"
            style={{ width: "100%", height: "100%", borderRadius: "8px", objectFit: "cover" }}
          />
          <FaEdit
            style={{
              position: "absolute",
              cursor: "pointer",
              top: "auto",
              bottom: 5,
              left: 30,
              background: "rgba(238, 255, 232, 1)",
              padding: "4px",
              borderRadius: "100%",
              boxShadow: "0 0 8px rgba(0,0,0,0.2)",
              fontSize: "23px",
              color: "green"
            }}
            onClick={() => setEditing(true)}
          />
        </div>
      )}
    </Rnd>
  );
}
