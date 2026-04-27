import React, { useEffect, useRef, useState } from "react";
import { FaCheck, FaEdit, FaTimes } from "react-icons/fa";

const buildControlRailStyle = (side = "right", vertical = "bottom") => ({
  position: "absolute",
  [vertical]: 0,
  [side]: "18px",
  transform: `translateY(${vertical === "bottom" ? "50%" : "-50%"})`,
  display: "flex",
  flexDirection: "row",
  gap: "8px",
  zIndex: 10,
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

const shellStyle = {
  border: "2px dashed #555",
  background: "#fff",
  borderRadius: "8px",
  padding: "8px",
  paddingBottom: "44px",
  position: "relative",
  width: "100%",
  overflow: "visible",
};

export default function ParagraphBox({
  id,
  onDelete,
  onUpdate,
  initialContent,
  isInContainer = false,
  contentKey = "content",
}) {
  const [text, setText] = useState(initialContent || "");
  const [editing, setEditing] = useState(true);
  const lastDeleteClickRef = useRef(0);

  useEffect(() => {
    setText(initialContent || "");
  }, [initialContent, contentKey]);

  useEffect(() => {
    onUpdate(id, { [contentKey]: text });
  }, [contentKey, id, onUpdate, text]);

  const handleDeleteAttempt = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();
    if (now - lastDeleteClickRef.current <= 350) {
      onDelete(id);
      lastDeleteClickRef.current = 0;
      return;
    }

    lastDeleteClickRef.current = now;
  };

  const minHeight = isInContainer ? "100px" : "150px";
  const textareaHeight = isInContainer ? "100px" : "200px";

  return (
    <div style={{ ...shellStyle, minHeight }}>
      <div style={buildControlRailStyle("right", "bottom")}>
        {editing ? (
          <button
            type="button"
            onClick={() => setEditing(false)}
            style={buildControlButtonStyle("#eff8ff", "#2563eb")}
            title="Save text"
          >
            <FaCheck />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={buildControlButtonStyle("#eff8ff", "#2563eb")}
            title="Edit text"
          >
            <FaEdit />
          </button>
        )}

        <button
          type="button"
          onClick={handleDeleteAttempt}
          onDoubleClick={handleDeleteAttempt}
          style={buildControlButtonStyle("#fff1f4", "#d90445")}
          title="Double-click to delete"
        >
          <FaTimes />
        </button>
      </div>

      {editing ? (
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Enter text..."
          style={{ width: "100%", height: textareaHeight, resize: "vertical" }}
        />
      ) : (
        <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{text}</p>
      )}
    </div>
  );
}
