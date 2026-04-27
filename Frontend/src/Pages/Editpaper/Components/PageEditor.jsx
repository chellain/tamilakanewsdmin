import React, { useEffect, useMemo, useState } from "react";
import { Rnd } from "react-rnd";
import { X, Plus } from "lucide-react";
import { GrRevert } from "react-icons/gr";
import { useDispatch, useSelector } from "react-redux";
import {
  addLine,
  deletePresetContainer,
  setActivePage,
  updateLineArguments,
} from "../../Slice/editpaperSlice/editpaperslice";
import { selectAllPages, selectDistrictPage } from "../../Slice/adminSelectors";
import NewsFilter from "./NewsFilter";
import "./pageeditor.scss";
import norcont1 from "../../../assets/Containers/norcont1.png";
import norcont4b from "../../../assets/Containers/norcont4b.png";
import bcont1 from "../../../assets/Containers/bcont1.png";
import bcont2 from "../../../assets/Containers/bcont2.png";
import bcont3 from "../../../assets/Containers/bcont3.png";
import bcont4 from "../../../assets/Containers/bcont4.png";
import ncont1 from "../../../assets/Containers/ncont1.png";
import ncont3 from "../../../assets/Containers/ncont3.png";
import ncont4 from "../../../assets/Containers/ncont4.png";
import ncont5 from "../../../assets/Containers/ncont5.png";

const BASIC_CONTAINER_TYPES = [
  { id: 1, img: bcont1, label: "Big Container Type 1" },
  { id: 2, img: bcont2, label: "Big Container Type 2" },
  { id: 3, img: bcont3, label: "Big Container Type 3" },
  { id: 4, img: bcont4, label: "Big Container Type 4" },
  { id: 5, img: bcont4, label: "Big Container Type 4A" },
  { id: 6, img: ncont4, label: "Big Container Type 5" },
  { id: 7, img: norcont1, label: "Normal Container Type 1" },
  { id: 8, img: ncont4, label: "Normal Container Type 2" },
  { id: 9, img: ncont3, label: "Normal Container Type 3" },
  { id: 10, img: ncont5, label: "Normal Container Type 4" },
  { id: 11, img: ncont4, label: "Normal Container Type 4A" },
  { id: 12, img: ncont1, label: "Normal Container Type 5" },
  { id: 13, img: norcont4b, label: "Normal Container Type 4B" },
  { id: 14, img: bcont1, label: "Universal Container" },
];

const SLIDER_TYPES = [
  { id: 1, label: "Slider Type 1 (Carousel)", type: "type1" },
  { id: 2, label: "Slider Type 2 (Horizontal)", type: "type2" },
];

const LINE_TYPES = [
  { id: 1, type: "pink-bold", orientation: "horizontal", label: "Pink bold line" },
  { id: 2, type: "pink-bold", orientation: "vertical", label: "Pink bold vertical" },
  { id: 3, type: "light-grey", orientation: "horizontal", label: "Grey line" },
  { id: 4, type: "light-grey", orientation: "vertical", label: "Grey vertical" },
];

const OTHER_TYPES = [
  { id: 20, label: "Poll", dataKey: "isPoll" },
  { id: 21, label: "Video Container", dataKey: "isVideo" },
];

function PresetCard({ preset, onDelete }) {
  return (
    <div
      className="pageeditor-preset-card"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("presetId", preset.id);
        event.dataTransfer.setData("text/plain", "Universal Container");
        event.dataTransfer.effectAllowed = "copy";
      }}
    >
      <button
        type="button"
        className="pageeditor-preset-delete"
        onClick={() => onDelete(preset.id, preset.presetName)}
        title="Delete preset"
      >
        <X size={14} />
      </button>
      <div className="pageeditor-preset-name">{preset.presetName}</div>
      <div className="pageeditor-preset-meta">
        <span>
          Container {preset.dimensions.containerWidth} x {preset.dimensions.containerHeight}
        </span>
        <span>
          Image {preset.dimensions.imgWidth} x {preset.dimensions.imgHeight}
        </span>
      </div>
    </div>
  );
}

export default function PageEditor({ open = false, onClose = () => {} }) {
  const dispatch = useDispatch();
  const activePage = useSelector((state) => state.editpaper.activePage);
  const activeLineId = useSelector((state) => state.editpaper.activeLineId);
  const presetContainers = useSelector((state) => state.editpaper.presetContainers || []);
  const pages = useSelector((state) => state.editpaper.pages || []);
  const allPages = useSelector(selectAllPages);
  const districtPage = useSelector(selectDistrictPage);

  const regularPages = useMemo(
    () => allPages.filter((page) => !page?.districts),
    [allPages]
  );
  const districts = useMemo(() => districtPage?.districts || [], [districtPage]);
  const activeLine = useMemo(() => {
    const page = pages.find((item) => item.catName === activePage);
    return page?.lines?.find((line) => line.id === activeLineId) || null;
  }, [pages, activePage, activeLineId]);

  const [editorSection, setEditorSection] = useState("page-sections");
  const [activeToolTab, setActiveToolTab] = useState("containers");
  const [lineArguments, setLineArguments] = useState("");
  const [switchPosition, setSwitchPosition] = useState([1020, 14]);

  useEffect(() => {
    if (activeLine) {
      setLineArguments(`${activeLine.length}-${activeLine.x}-${activeLine.y}`);
    } else {
      setLineArguments("");
    }
  }, [activeLine]);

  if (!open) return null;

  const getEnglishName = (tamilName) => {
    if (tamilName === "main") return "main";
    const regularPage = regularPages.find((page) => page.name.tam === tamilName);
    if (regularPage) return regularPage.name.eng.toLowerCase();
    const district = districts.find((item) => item.tam === tamilName);
    if (district) return district.eng.toLowerCase();
    return tamilName.toLowerCase();
  };

  const getTamilNameFromActivePage = () => {
    if (activePage === "main") return "main";
    const page = regularPages.find((item) => item.name.eng.toLowerCase() === activePage);
    if (page) return page.name.tam;
    const district = districts.find((item) => item.eng.toLowerCase() === activePage);
    return district?.tam || "";
  };

  const activeTamilName = getTamilNameFromActivePage();

  const handlePageClick = (tamilName) => {
    dispatch(setActivePage(getEnglishName(tamilName)));
  };

  const handleLineArgumentsChange = (event) => {
    const value = event.target.value;
    setLineArguments(value);
    const parts = value.split("-");

    if (parts.length === 3 && activeLineId) {
      const length = parseInt(parts[0], 10);
      const x = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);

      if (!Number.isNaN(length) && !Number.isNaN(x) && !Number.isNaN(y)) {
        dispatch(
          updateLineArguments({
            catName: activePage,
            lineId: activeLineId,
            length,
            x,
            y,
          })
        );
      }
    }
  };

  const handleDeletePreset = (presetId, presetName) => {
    if (window.confirm(`Are you sure you want to delete preset "${presetName}"?`)) {
      dispatch(deletePresetContainer({ presetId }));
    }
  };

  const renderContainerPalette = () => (
    <div className="pageeditor-palette-body">
      <div
        className="pageeditor-common-drop"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("containerOverlay", "true");
          event.dataTransfer.effectAllowed = "copy";
        }}
      >
        <Plus size={18} />
        Container Overlay
      </div>

      <div className="pageeditor-palette-section">
        <div className="pageeditor-palette-heading">Custom Containers</div>
        {presetContainers.length === 0 ? (
          <div className="pageeditor-empty-note">
            Save a Universal Container as a preset and it will appear here first.
          </div>
        ) : (
          <div className="pageeditor-preset-list">
            {presetContainers.map((preset) => (
              <PresetCard key={preset.id} preset={preset} onDelete={handleDeletePreset} />
            ))}
          </div>
        )}
      </div>

      <div className="pageeditor-divider" />

      <div className="pageeditor-palette-section">
        <div className="pageeditor-palette-heading">Basic Containers</div>
        <div className="pageeditor-card-grid">
          {BASIC_CONTAINER_TYPES.map((item) => (
            <div
              key={item.id}
              className="pageeditor-card"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", item.label);
                event.dataTransfer.effectAllowed = "copy";
              }}
            >
              <img src={item.img} alt={item.label} className="pageeditor-card-image" />
              <div className="pageeditor-card-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSliderPalette = () => (
    <div className="pageeditor-simple-list">
      {SLIDER_TYPES.map((slider) => (
        <div
          key={slider.id}
          className="pageeditor-action-card"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("sliderType", slider.type);
            event.dataTransfer.effectAllowed = "copy";
          }}
        >
          <Plus size={16} />
          <span>{slider.label}</span>
        </div>
      ))}
    </div>
  );

  const renderLinePalette = () => (
    <div className="pageeditor-lines-layout">
      <div className="pageeditor-line-grid">
        {LINE_TYPES.map((line) => (
          <div
            key={line.id}
            className="pageeditor-line-card"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("lineType", line.type);
              event.dataTransfer.setData("lineOrientation", line.orientation);
              event.dataTransfer.effectAllowed = "copy";
            }}
          >
            <div
              className={`pageeditor-line-preview ${
                line.orientation === "vertical" ? "is-vertical" : ""
              } ${line.type === "pink-bold" ? "is-pink" : "is-grey"}`}
            />
            <span>{line.label}</span>
          </div>
        ))}
      </div>

      <div className="pageeditor-line-editor">
        <label htmlFor="line-args">
          Line arguments
          <span>(length-x-y)</span>
        </label>
        <input
          id="line-args"
          type="text"
          value={lineArguments}
          onChange={handleLineArgumentsChange}
          placeholder="500-0-0"
          disabled={!activeLineId}
        />
        {!activeLineId && <p>Click a line in the canvas to edit its position and length.</p>}
      </div>
    </div>
  );

  const renderOtherPalette = () => (
    <div className="pageeditor-simple-list">
      {OTHER_TYPES.map((item) => (
        <div
          key={item.id}
          className="pageeditor-action-card"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData(item.dataKey, "true");
            event.dataTransfer.effectAllowed = "copy";
          }}
        >
          <Plus size={16} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );

  const renderPageSectionsSection = () => (
    <div className="pageeditor-switcher">
      <div className="pageeditor-switch-block">
        <div className="pageeditor-block-title">Main Page</div>
        <div className="pageeditor-chip-row">
          <button
            type="button"
            onClick={() => handlePageClick("main")}
            className={`pageeditor-chip${activePage === "main" ? " is-active" : ""}`}
          >
            main
          </button>
        </div>
      </div>

      <div className="pageeditor-switch-block">
        <div className="pageeditor-block-title">Pages</div>
        <div className="pageeditor-chip-row">
          {regularPages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => handlePageClick(page.name.tam)}
              className={`pageeditor-chip${activeTamilName === page.name.tam ? " is-active" : ""}`}
            >
              {page.name.tam.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="pageeditor-switch-block">
        <div className="pageeditor-block-title">Districts</div>
        <div className="pageeditor-chip-row">
          {districts.map((district, index) => (
            <button
              key={`${district.eng}-${index}`}
              type="button"
              onClick={() => handlePageClick(district.tam)}
              className={`pageeditor-chip${activeTamilName === district.tam ? " is-active" : ""}`}
            >
              {district.tam.toLowerCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPageEditorSection = () => (
    <>
      <div className="pageeditor-tool-tabs">
        {["containers", "sliders", "lines", "others"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveToolTab(tab)}
            className={`pageeditor-tool-tab${activeToolTab === tab ? " is-active" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="pageeditor-palette">
        {activeToolTab === "containers" && renderContainerPalette()}
        {activeToolTab === "sliders" && renderSliderPalette()}
        {activeToolTab === "lines" && renderLinePalette()}
        {activeToolTab === "others" && renderOtherPalette()}
      </div>
    </>
  );

  return (
    <div className="pageeditor-overlay">
      <Rnd
        position={{ x: switchPosition[0], y: switchPosition[1] }}
        onDragStop={(event, data) => setSwitchPosition([data.x, data.y])}
        bounds="parent"
        dragHandleClassName="page-editor-header"
        enableResizing={false}
        style={{ zIndex: 999999, pointerEvents: "auto" }}
      >
        <div className="page-editor-container">
          <div className="page-editor-header">
            <div className="page-editor-title">Page Editor</div>

            <div className="pageeditor-header-actions">
              <button
                type="button"
                className="pageeditor-reverse-btn"
                onClick={() =>
                  setSwitchPosition((position) => (position[0] === 1020 ? [14, 14] : [1020, 14]))
                }
              >
                <GrRevert />
              </button>

              <button type="button" className="page-editor-close-btn" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="pageeditor-section-tabs">
            <button
              type="button"
              onClick={() => setEditorSection("page-sections")}
              className={`pageeditor-section-tab${editorSection === "page-sections" ? " is-active" : ""}`}
            >
              Page Sections
            </button>
            <button
              type="button"
              onClick={() => setEditorSection("page-editor")}
              className={`pageeditor-section-tab${editorSection === "page-editor" ? " is-active" : ""}`}
            >
              Page Editor
            </button>
            <button
              type="button"
              onClick={() => setEditorSection("news-filter")}
              className={`pageeditor-section-tab${editorSection === "news-filter" ? " is-active" : ""}`}
            >
              News Filter
            </button>
          </div>

          <div className="page-editor-content">
            {editorSection === "page-sections" && renderPageSectionsSection()}
            {editorSection === "page-editor" && renderPageEditorSection()}
            {editorSection === "news-filter" && <NewsFilter embedded />}
          </div>
        </div>
      </Rnd>
    </div>
  );
}
