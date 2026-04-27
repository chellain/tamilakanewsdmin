import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit } from 'react-icons/fa';
import ImageBox from './ImageBox.jsx';
import ParagraphBox from './ParagraphBox.jsx';
import NewsVideoBox from './NewsVideoBox.jsx';   // ← NEW

const railStyle = {
  position: "absolute",
  top: 0,
  left: "18px",
  transform: "translateY(-50%)",
  display: "flex",
  flexDirection: "row",
  gap: "8px",
  zIndex: 20
};

const railButtonStyle = (background, color = "white") => ({
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  border: "2px solid rgba(255, 255, 255, 0.9)",
  background,
  color,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(45, 27, 56, 0.18)",
});

const defaultSettings = {
  columns: 1,
  gap: 0,
  padding: 0,
  boxes: []
};

export default function ContainerOverlay({
  id,
  onDelete,
  onUpdate,
  initialSettings = {},
  activeLang = "ta",
}) {
  const [settings, setSettings] = useState({
    ...defaultSettings,
    ...initialSettings,
    boxes: initialSettings.boxes || []
  });

  useEffect(() => {
    const loaded = {
      ...defaultSettings,
      ...initialSettings,
      boxes: initialSettings.boxes || []
    };
    setSettings(loaded);
  }, [id]);

  const [showSettings, setShowSettings] = useState(false);

  const handleDelete = () => {
    onDelete(id);
  };

  const handleEditClick = () => {
    setShowSettings(!showSettings);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const boxId      = e.dataTransfer.getData('boxId');
    const boxType    = e.dataTransfer.getData('boxType');
    const addBoxType = e.dataTransfer.getData('add-box-type');

    if (boxId && boxType) {
      // Existing box being re-dropped (paragraph / image move)
      const newBox = {
        id: parseInt(boxId),
        type: boxType,
        content: ''
      };
      const updatedSettings = { ...settings, boxes: [...settings.boxes, newBox] };
      setSettings(updatedSettings);
      onUpdate(id, updatedSettings);

    } else if (addBoxType) {
      // Drag from Newsform sidebar: "paragraph", "image", or "video"
      const newBox = {
        id: Date.now(),
        type: addBoxType,
        content: '',
        // video boxes carry their own sub-state; initialise with empty data
        ...(addBoxType === 'video' ? { videoData: null, dimensions: { width: 560 } } : {})
      };
      const updatedSettings = { ...settings, boxes: [...settings.boxes, newBox] };
      setSettings(updatedSettings);
      onUpdate(id, updatedSettings);
    }
  };

  const removeBoxFromContainer = (boxId) => {
    const updatedSettings = {
      ...settings,
      boxes: settings.boxes.filter(b => b.id !== boxId)
    };
    setSettings(updatedSettings);
    onUpdate(id, updatedSettings);
  };

  const updateBoxInContainer = (boxId, updates) => {
    const updatedSettings = {
      ...settings,
      boxes: settings.boxes.map(b =>
        b.id === boxId ? { ...b, ...updates } : b
      )
    };
    setSettings(updatedSettings);
    onUpdate(id, updatedSettings);
  };

  const hasBoxes = settings.boxes.length > 0;

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          border: '2px dashed #667eea',
          borderRadius: '8px',
          padding: `${settings.padding}px`,
          minHeight: hasBoxes ? '0' : '200px',
          height: 'auto',
          position: 'relative',
          background: 'rgba(102, 126, 234, 0.05)',
          overflow: 'visible'
        }}
      >
        {/* ── Top-right control buttons ──────────────────────────── */}
        <div style={railStyle}>
          <button
            onClick={handleEditClick}
            style={railButtonStyle("#f1fff5", "#17914a")}
            title="Edit container"
          >
            <FaEdit />
          </button>
          <button
            onDoubleClick={handleDelete}
            style={railButtonStyle("#fff1f4", "#d90445")}
            title="Double-click to delete"
          >
            <FaTimes />
          </button>
        </div>

        {/* ── Settings panel ─────────────────────────────────────── */}
        {showSettings && (
          <div
            style={{
              position: 'absolute',
              top: '45px',
              right: '8px',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              zIndex: 20,
              minWidth: '200px'
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                Columns:
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={settings.columns}
                onChange={(e) => {
                  const next = parseInt(e.target.value) || 1;
                  const updated = { ...settings, columns: next };
                  setSettings(updated);
                  onUpdate(id, updated);
                }}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                Gap (px):
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={settings.gap}
                onChange={(e) => {
                  const next = parseInt(e.target.value) || 0;
                  const updated = { ...settings, gap: next };
                  setSettings(updated);
                  onUpdate(id, updated);
                }}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                Padding (px):
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.padding}
                onChange={(e) => {
                  const next = parseInt(e.target.value) || 0;
                  const updated = { ...settings, padding: next };
                  setSettings(updated);
                  onUpdate(id, updated);
                }}
                style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
          </div>
        )}

        {/* ── Grid of boxes ──────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${settings.columns}, 1fr)`,
            gap: `${settings.gap}px`,
            minHeight: hasBoxes ? '0' : '150px',
            alignItems: 'start'
          }}
        >
          {settings.boxes.length === 0 ? (
            <div style={{
              gridColumn: `span ${settings.columns}`,
              textAlign: 'center',
              color: '#999',
              padding: '20px'
            }}>
              Drop paragraph, image, or video boxes here
            </div>
          ) : (
            settings.boxes.map((box) => (
              <div key={box.id} style={{ alignSelf: 'start' }}>
                {box.type === 'paragraph' && (
                  <ParagraphBox
                    id={box.id}
                    onDelete={removeBoxFromContainer}
                    onUpdate={updateBoxInContainer}
                    initialContent={activeLang === "en" && box.contentEn != null ? box.contentEn : box.content}
                    contentKey={activeLang === "en" ? "contentEn" : "content"}
                    box={{ x: 0, y: 0, width: 200, height: 150, ...box }}
                    isInContainer={true}
                  />
                )}

                {box.type === 'image' && (
                  <ImageBox
                    id={box.id}
                    onDelete={removeBoxFromContainer}
                    onUpdate={updateBoxInContainer}
                    initialContent={box.content}
                    box={{ x: 0, y: 0, width: 200, height: 150, ...box }}
                    isInContainer={true}
                  />
                )}

                {/* ── NEW: Video box inside container ──────────────── */}
                {box.type === 'video' && (
                  <NewsVideoBox
                    id={box.id}
                    onDelete={removeBoxFromContainer}
                    onUpdate={updateBoxInContainer}
                    initialData={{
                      videoData:  box.videoData  || null,
                      dimensions: box.dimensions || { width: 560 }
                    }}
                    isInContainer={true}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
