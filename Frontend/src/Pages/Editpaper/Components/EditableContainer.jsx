import React, { useState, useEffect } from "react";
import { X, Edit2, Grid3x3, Space, Maximize2, Move } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import {
  updateContainerGrid,
  updateContainerSpacing,
  updateContainerHeader,
  addEmptySlot,
  dropNewsIntoSlot,
  deleteContainer,
  addNestedContainer,
  deleteNestedContainer,
  updateNestedContainerGrid,
  updateNestedContainerSpacing,
  updateNestedContainerHeader,
  addEmptySlotToNested,
  dropNewsIntoNestedSlot,
  removeNewsFromNestedSlot,
  removeNewsFromSlot,
  removeSlotFromContainer,
  removeSlotFromNestedContainer,
  addSliderToContainer,
  updateSliderWidth,
  updateContainerSliderGap,
  deleteContainerSlider,
  addSlotToContainerSlider,
  removeSlotFromContainerSlider,
  addLine,
  addPollSlot,
  addVideoSlot,
  addVideoSlotToSlider
} from "../../Slice/editpaperSlice/editpaperslice";

import BigNewsContainer1 from "../Containers_/BigContainer1";
import BigNewsContainer2 from "../Containers_/BigContainer2";
import BigNewsContainer3 from "../Containers_/BigContainer3";
import BigNewsContainer4 from "../Containers_/BigContainer4";
import BigNewsContainer4A from "../Containers_/BigContainer4A";
import BigNewsContainer5 from "../Containers_/BigContainer5";

import NorContainer1 from "../Containers_/NorContainer1";
import NorContainer2 from "../Containers_/NorContainer2";
import NorContainer3 from "../Containers_/NorContainer3";
import NorContainer4 from "../Containers_/NorContainer4";
import NorContainer4A from "../Containers_/NorContainer4A";
import NorContainer4B from "../Containers_/NorContainer4B";
import NorContainer5 from "../Containers_/NorContainer5";
import UniversalNewsContainer from "../Containers_/UniversalNewsContainer";

import { EditableSlider } from "./EditableSlider";
import { EditableSlider2 } from "./EditableSlider2";
import EditableLine from "../Containers_/EditableLine";
import PollContainer from "../Containers_/PollContainer";
import VideoContainer from "../Containers_/VideoContainer";

const COMPONENT_MAP = {
  "Universal Container": UniversalNewsContainer,
  "Big Container Type 1": BigNewsContainer1,
  "Big Container Type 2": BigNewsContainer2,
  "Big Container Type 3": BigNewsContainer3,
  "Big Container Type 4": BigNewsContainer4,
  "Big Container Type 4A": BigNewsContainer4A,
  "Big Container Type 5": BigNewsContainer5,
  "Normal Container Type 1": NorContainer1,
  "Normal Container Type 2": NorContainer2,
  "Normal Container Type 3": NorContainer3,
  "Normal Container Type 4": NorContainer4,
  "Normal Container Type 4A": NorContainer4A,
  "Normal Container Type 4B": NorContainer4B,
  "Normal Container Type 5": NorContainer5,
  "Poll": PollContainer,
  "Video Container": VideoContainer,
};

const AUTO_POPULATE_CLEARABLE_TYPES = Object.keys(COMPONENT_MAP).filter(
  (type) => type !== "Poll" && type !== "Video Container"
);

const AUTO_POPULATE_BASE_CONTAINER_TYPES = AUTO_POPULATE_CLEARABLE_TYPES.filter(
  (type) => type !== "Universal Container"
);

const normalizeTag = (value) => String(value || "").trim().toLowerCase();

const getNewsTags = (news) => {
  const zonal = news?.data?.zonal;
  if (Array.isArray(zonal)) return zonal.filter(Boolean).map((item) => String(item).trim());
  if (typeof zonal === "string" && zonal.trim()) return [zonal.trim()];
  return [];
};

const getComparableTime = (news) => {
  const source = news?.updatedAt || news?.createdAt || news?.time || 0;
  const parsed = new Date(source).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getUniversalContainerDefaults = (containerType) => {
  const defaultsMap = {
    "Big Container Type 1": { width: 800, height: 500, layout: 3 },
    "Big Container Type 2": { width: 500, height: 350, layout: 4 },
    "Big Container Type 3": { width: 400, height: 350, layout: 1 },
    "Big Container Type 4": { width: 280, height: 280, layout: 6 },
    "Big Container Type 4A": { width: 280, height: 280, layout: 6 },
    "Big Container Type 5": { width: 500, height: 300, layout: 4 },
    "Normal Container Type 1": { width: 300, height: 200, layout: 10 },
    "Normal Container Type 2": { width: 200, height: 100, layout: 8 },
    "Normal Container Type 3": { width: 300, height: 150, layout: 6 },
    "Normal Container Type 4": { width: 300, height: 200, layout: 11 },
    "Normal Container Type 4A": { width: 100, height: 100, layout: 6 },
    "Normal Container Type 4B": { width: 300, height: 80, layout: 10 },
    "Normal Container Type 5": { width: 400, height: 300, layout: 1 },
    "Universal Container": { width: 400, height: 300, layout: 1 },
  };
  return defaultsMap[containerType] || { width: 400, height: 300, layout: 1 };
};

export default function EditableContainer({ 
  id, 
  catName,
  isNested = false,
  parentContainerId = null,
}) {
  const dispatch = useDispatch();

  // â”€â”€ Select container data directly from Redux â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const containerData = useSelector(state => {
    const page = state.editpaper.pages.find(p => p.catName === catName);
    if (isNested && parentContainerId) {
      const findNested = (containers) => {
        for (const cont of containers) {
          if (cont.id === parentContainerId) {
            return cont.nestedContainers?.find(nc => nc.id === id);
          }
          if (cont.nestedContainers?.length > 0) {
            const found = findNested(cont.nestedContainers);
            if (found) return found;
          }
        }
        return null;
      };
      return findNested(page?.containers || []);
    } else {
      return page?.containers.find(c => c.id === id);
    }
  });
  const language = useSelector(state => state.newsform?.language || "ta");
  const allNews = useSelector((state) => state.newsform?.allNews || []);
  const allPages = useSelector((state) => state.admin?.allPages || []);
  const presetContainers = useSelector((state) => state.editpaper?.presetContainers || []);

  // â”€â”€ Values derived from Redux state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const grid             = containerData?.grid    || { columns: 1, gap: 0 };
  const spacing          = containerData?.spacing || { padding: 0, margin: 0 };
  // Read header directly from Redux state every render â€” source of truth
  const reduxHeaderEnabled = containerData?.header?.enabled ?? false;
  const reduxHeaderTam     = containerData?.header?.tam ?? containerData?.header?.title ?? "";
  const reduxHeaderEng     = containerData?.header?.eng ?? "";
  const nestedContainers = containerData?.nestedContainers || [];
  const items            = containerData?.items   || [];
  const sliders          = containerData?.sliders || [];
  const lines            = containerData?.lines   || [];

  // â”€â”€ Local state for settings panel controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showSettings, setShowSettings]     = useState(false);
  const [showPopulateModal, setShowPopulateModal] = useState(false);
  const [columns, setColumns]               = useState(grid.columns);
  const [gap, setGap]                       = useState(grid.gap);
  const [padding, setPadding]               = useState(spacing.padding);
  const [margin, setMargin]                 = useState(spacing.margin);
  const [gridColumnSpan, setGridColumnSpan] = useState(1);
  const [populateContainerOption, setPopulateContainerOption] = useState("");
  const [populateType, setPopulateType] = useState("infinity");
  const [populateCount, setPopulateCount] = useState("4");
  const [selectedPopulateTags, setSelectedPopulateTags] = useState([]);
  const [populateMode, setPopulateMode] = useState("recent-top");
  const [selectedManualNewsIds, setSelectedManualNewsIds] = useState([]);

  // â”€â”€ Header local state â€” mirrors Redux, re-syncs when Redux changes â”€â”€â”€â”€â”€â”€â”€
  //    This is the KEY FIX: useEffect keeps local state in sync so that
  //    changes persisted in Redux are reflected after re-mounts / refreshes.
  const [headerEnabled, setHeaderEnabled] = useState(reduxHeaderEnabled);
  const [headerTam, setHeaderTam] = useState(reduxHeaderTam);
  const [headerEng, setHeaderEng] = useState(reduxHeaderEng);

  useEffect(() => {
    setHeaderEnabled(reduxHeaderEnabled);
    setHeaderTam(reduxHeaderTam);
    setHeaderEng(reduxHeaderEng);
  }, [reduxHeaderEnabled, reduxHeaderTam, reduxHeaderEng]);

  const categoryOptions = React.useMemo(() => {
    const seen = new Set();
    return allPages
      .filter(
        (page) =>
          page?.name?.eng &&
          page.name.eng !== "Select District" &&
          !page?.districts
      )
      .map((page) => ({
        value: page.name.eng,
        label: language === "en" ? page.name.eng : page?.name?.tam || page.name.eng,
      }))
      .filter((page) => {
        const key = normalizeTag(page.value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [allPages, language]);

  const districtOptions = React.useMemo(() => {
    const seen = new Set();
    return (
      allPages
        .find((page) => Array.isArray(page?.districts))
        ?.districts?.map((district) => ({
          value: district?.eng,
          label: language === "en" ? district?.eng : district?.tam || district?.eng,
        }))
        ?.filter((district) => {
          const key = normalizeTag(district?.value);
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        }) || []
    );
  }, [allPages, language]);

  const populateContainerOptions = React.useMemo(() => {
    const presetOptions = presetContainers.map((preset) => ({
      value: `preset:${preset.id}`,
      label: preset.presetName,
      containerType: "Universal Container",
      presetId: preset.id,
    }));

    const baseOptions = AUTO_POPULATE_BASE_CONTAINER_TYPES.map((type) => ({
      value: `builtin:${type}`,
      label: type,
      containerType: type,
      presetId: undefined,
    }));

    return [...presetOptions, ...baseOptions];
  }, [presetContainers]);

  const selectedPopulateContainer = React.useMemo(
    () => populateContainerOptions.find((option) => option.value === populateContainerOption) || null,
    [populateContainerOption, populateContainerOptions]
  );

  const populateSelectionLimit =
    populateType === "custom" ? Math.max(0, parseInt(populateCount, 10) || 0) : null;

  const populateFilteredNews = React.useMemo(() => {
    const activeTags = selectedPopulateTags.map(normalizeTag);
    const filtered = [...allNews].filter((news) => {
      if (activeTags.length === 0) return true;
      const tags = getNewsTags(news).map(normalizeTag);
      return activeTags.some((tag) => tags.includes(tag));
    });

    filtered.sort((a, b) => {
      const delta = getComparableTime(b) - getComparableTime(a);
      return populateMode === "recent-bottom" ? -delta : delta;
    });

    return filtered;
  }, [allNews, populateMode, selectedPopulateTags]);

  const populatePreparedNews = React.useMemo(() => {
    if (populateMode === "pick-own") {
      const selectedSet = new Set(selectedManualNewsIds.map(Number));
      return populateFilteredNews.filter((news) => selectedSet.has(Number(news.id)));
    }

    if (populateSelectionLimit === null) return populateFilteredNews;
    return populateFilteredNews.slice(0, populateSelectionLimit);
  }, [
    populateFilteredNews,
    populateMode,
    populateSelectionLimit,
    selectedManualNewsIds,
  ]);

  useEffect(() => {
    if (!showPopulateModal) return;

    const existingItem = items.find((item) =>
      AUTO_POPULATE_CLEARABLE_TYPES.includes(item.containerType)
    );
    const matchingOption =
      populateContainerOptions.find((option) => {
        if (!existingItem) return false;
        if (option.presetId) {
          return (
            existingItem.containerType === option.containerType &&
            existingItem.presetId === option.presetId
          );
        }
        return existingItem.containerType === option.containerType;
      }) || populateContainerOptions[0];

    setPopulateContainerOption(matchingOption?.value || "");
    setPopulateType("infinity");
    setPopulateCount("4");
    setSelectedPopulateTags([]);
    setPopulateMode("recent-top");
    setSelectedManualNewsIds([]);
  }, [showPopulateModal, items, populateContainerOptions]);

  useEffect(() => {
    const availableIds = new Set(populateFilteredNews.map((news) => Number(news.id)));

    setSelectedManualNewsIds((prev) => {
      let next = prev.filter((newsId) => availableIds.has(Number(newsId)));
      if (populateSelectionLimit !== null && next.length > populateSelectionLimit) {
        next = next.slice(0, populateSelectionLimit);
      }
      return next;
    });
  }, [populateFilteredNews, populateSelectionLimit]);

  // â”€â”€ Dispatch helper for header â€” always sends both fields to Redux â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const dispatchHeader = (enabled, tam, eng) => {
    if (isNested && parentContainerId) {
      dispatch(updateNestedContainerHeader({
        catName,
        parentContainerId,
        nestedContainerId: id,
        enabled,
        tam,
        eng,
      }));
    } else {
      dispatch(updateContainerHeader({
        catName,
        containerId: id,
        enabled,
        tam,
        eng,
      }));
    }
  };

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleHeaderEnabledChange = (e) => {
    const val = e.target.checked;
    setHeaderEnabled(val);
    dispatchHeader(val, headerTam, headerEng);
  };

  const handleHeaderTamChange = (e) => {
    const val = e.target.value;
    setHeaderTam(val);
    dispatchHeader(headerEnabled, val, headerEng);
  };

  const handleHeaderEngChange = (e) => {
    const val = e.target.value;
    setHeaderEng(val);
    dispatchHeader(headerEnabled, headerTam, val);
  };

  const handleDelete = (e) => {
    if (e.detail === 2) {
      e.stopPropagation();
      if (isNested && parentContainerId) {
        dispatch(deleteNestedContainer({ catName, parentContainerId, nestedContainerId: id }));
      } else {
        dispatch(deleteContainer({ catName, containerId: id }));
      }
    }
  };

  const handlePaddingChange = (e) => {
    const val = parseInt(e.target.value) || 0;
    setPadding(val);
    if (isNested && parentContainerId) {
      dispatch(updateNestedContainerSpacing({ catName, parentContainerId, nestedContainerId: id, padding: val, margin }));
    } else {
      dispatch(updateContainerSpacing({ catName, containerId: id, padding: val, margin }));
    }
  };

  const handleMarginChange = (e) => {
    const val = parseInt(e.target.value) || 0;
    setMargin(val);
    if (isNested && parentContainerId) {
      dispatch(updateNestedContainerSpacing({ catName, parentContainerId, nestedContainerId: id, padding, margin: val }));
    } else {
      dispatch(updateContainerSpacing({ catName, containerId: id, padding, margin: val }));
    }
  };

  const handleGridChange = (type, value) => {
    const v = parseInt(value) || (type === 'columns' ? 1 : 0);
    if (type === 'columns') setColumns(v);
    else setGap(v);
    const newColumns = type === 'columns' ? v : columns;
    const newGap     = type === 'gap'     ? v : gap;
    if (isNested && parentContainerId) {
      dispatch(updateNestedContainerGrid({ catName, parentContainerId, nestedContainerId: id, columns: newColumns, gap: newGap }));
    } else {
      dispatch(updateContainerGrid({ catName, containerId: id, columns: newColumns, gap: newGap }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isContainerOverlay = e.dataTransfer.getData("containerOverlay");
    const type               = e.dataTransfer.getData("text/plain");
    const newsId             = e.dataTransfer.getData("newsId");
    const sliderType         = e.dataTransfer.getData("sliderType");
    const lineType           = e.dataTransfer.getData("lineType");
    const lineOrientation    = e.dataTransfer.getData("lineOrientation");
    const presetId           = e.dataTransfer.getData("presetId");
    const isPoll             = e.dataTransfer.getData("isPoll");
    const isVideo            = e.dataTransfer.getData("isVideo");

    if (lineType && lineOrientation) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      dispatch(addLine(catName, lineType, lineOrientation, { x, y }, id, parentContainerId));
      return;
    }
    if (sliderType) {
      dispatch(addSliderToContainer(catName, id, sliderType, isNested, parentContainerId));
      return;
    }
    if (isContainerOverlay === "true") {
      dispatch(addNestedContainer(catName, id));
      return;
    }
    if (isPoll === "true") {
      dispatch(addPollSlot(catName, id, isNested, parentContainerId));
      return;
    }
    if (isVideo === "true") {
      const slotId = `slot_${Date.now()}`;
      dispatch(addVideoSlot({ catName, containerId: id, slotId, isNested, parentContainerId }));
      return;
    }
    if (type && !newsId) {
      const slotId = `slot_${Date.now()}`;
      if (isNested && parentContainerId) {
        dispatch(addEmptySlotToNested({ catName, parentContainerId, nestedContainerId: id, containerType: type, slotId, presetId: presetId || undefined }));
      } else {
        dispatch(addEmptySlot({ catName, containerId: id, containerType: type, slotId, presetId: presetId || undefined }));
      }
      return;
    }
    if (newsId) {
      const targetSlot = items.find(item => !item.newsId);
      if (targetSlot) {
        if (isNested && parentContainerId) {
          dispatch(dropNewsIntoNestedSlot({ catName, parentContainerId, nestedContainerId: id, slotId: targetSlot.slotId, newsId: Number(newsId) }));
        } else {
          dispatch(dropNewsIntoSlot({ catName, containerId: id, slotId: targetSlot.slotId, newsId: Number(newsId) }));
        }
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const togglePopulateTag = (value) => {
    setSelectedPopulateTags((prev) => {
      const exists = prev.includes(value);
      return exists ? prev.filter((item) => item !== value) : [...prev, value];
    });
  };

  const toggleManualNewsSelection = (newsId) => {
    setSelectedManualNewsIds((prev) => {
      const normalizedId = Number(newsId);
      const exists = prev.includes(normalizedId);

      if (exists) {
        return prev.filter((item) => item !== normalizedId);
      }

      if (populateSelectionLimit !== null && prev.length >= populateSelectionLimit) {
        return prev;
      }

      return [...prev, normalizedId];
    });
  };

  const handlePopulateAutomate = () => {
    if (!selectedPopulateContainer) return;

    if (selectedPopulateTags.length === 0) {
      alert("Select at least one category or district to populate this overlay.");
      return;
    }

    if (populateType === "custom" && populateSelectionLimit === 0) {
      alert("Enter a valid custom count before populating the overlay.");
      return;
    }

    if (populateMode === "pick-own" && selectedManualNewsIds.length === 0) {
      alert("Pick at least one news item for manual population.");
      return;
    }

    const targetNewsIds = populatePreparedNews
      .map((news) => Number(news.id))
      .filter((newsId) => Number.isFinite(newsId));

    if (targetNewsIds.length === 0) {
      alert("No news matches the selected options.");
      return;
    }

    const clearableItems = items.filter((item) =>
      AUTO_POPULATE_CLEARABLE_TYPES.includes(item.containerType)
    );

    clearableItems.forEach((item) => {
      if (isNested && parentContainerId) {
        dispatch(
          removeSlotFromNestedContainer({
            catName,
            parentContainerId,
            nestedContainerId: id,
            slotId: item.slotId,
          })
        );
      } else {
        dispatch(removeSlotFromContainer({ catName, containerId: id, slotId: item.slotId }));
      }
    });

    targetNewsIds.forEach((newsId, index) => {
      const slotId = `slot_${Date.now() + index}`;

      if (isNested && parentContainerId) {
        dispatch(
          addEmptySlotToNested({
            catName,
            parentContainerId,
            nestedContainerId: id,
            containerType: selectedPopulateContainer.containerType,
            slotId,
            presetId: selectedPopulateContainer.presetId,
          })
        );
        dispatch(
          dropNewsIntoNestedSlot({
            catName,
            parentContainerId,
            nestedContainerId: id,
            slotId,
            newsId,
          })
        );
      } else {
        dispatch(
          addEmptySlot({
            catName,
            containerId: id,
            containerType: selectedPopulateContainer.containerType,
            slotId,
            presetId: selectedPopulateContainer.presetId,
          })
        );
        dispatch(
          dropNewsIntoSlot({
            catName,
            containerId: id,
            slotId,
            newsId,
          })
        );
      }
    });

    setShowPopulateModal(false);
  };

  const borderColor = isNested ? "#f57c00" : "#666";
  const bgColor     = isNested ? "rgba(255, 152, 0, 0.05)" : "transparent";
  const headerAccent = isNested ? "#f57c00" : "#e91e8c";   // magenta for root, orange for nested
  const headerDisplayText =
    language === "en"
      ? (headerEng || headerTam || "header")
      : (headerTam || "header");

  const rootZIndex = showSettings || showPopulateModal ? 500 : 1;

  return (
    <div 
      style={{ 
        border: `2px dashed ${borderColor}`, 
        background: bgColor, 
        borderRadius: "8px", 
        gridColumn: `span ${gridColumnSpan}`, 
        width: "100%", 
        minHeight: nestedContainers.length === 0 && items.length === 0 ? "250px" : "fit-content", 
        position: "relative",
        margin: `${margin}px`,
        display: "flex",
        flexDirection: "column",
        zIndex: rootZIndex,
        isolation: "isolate",
      }}
    >
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          Edit / Delete buttons  (position: absolute, outside the flex flow)
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div 
        style={{ 
          position: "absolute", 
          bottom: "-10px", 
          right: isNested ? "auto" : "8px",
          left: isNested ? "8px" : "auto",
          display: "flex", 
          gap: "8px", 
          zIndex: 20, 
          pointerEvents: "auto" 
        }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} 
          style={{ 
            background: isNested ? "orange" : "green", 
            border: "none", 
            borderRadius: "100%", 
            width: "20px",
            height: "20px",
            display: "flex", 
            justifyContent: "center",
            alignItems: "center", 
            cursor: "pointer",
          }}
        >
          <Edit2 size={10} color="white" />
        </button>
        <button 
          onClick={handleDelete} 
          title="Double click to delete" 
          style={{ 
            background: "red", 
            border: "none", 
            borderRadius: "100%",
            width: "20px",
            height: "20px",
            display: "flex", 
            justifyContent: "center",
            alignItems: "center", 
            cursor: "pointer",
          }}
        >
          <X size={10} color="white" />
        </button>
      </div>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          Settings panel (absolute, floats to the side)
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showSettings && (
        <div 
          style={{ 
            position: "absolute",
            top: isNested ? "8px" : "auto",
            bottom: isNested ? "auto" : "-120px", 
            right: "-310px", 
            background: "white", 
            border: `2px solid ${borderColor}`, 
            borderRadius: "8px", 
            padding: "15px", 
            zIndex: 200, 
            minWidth: "290px", 
            maxHeight: "min(520px, calc(100vh - 32px))", 
            overflowY: "auto",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          }}
        >
          {/* Hidden: grid column span */}
          <div style={{ marginBottom: "12px", display: "none" }}>
            <label style={{ fontSize: "12px", fontWeight: "500", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Grid3x3 size={16} /> Grid Column Span
            </label>
            <input type="number" value={gridColumnSpan} min="1" max="12"
              onChange={(e) => setGridColumnSpan(parseInt(e.target.value) || 1)}
              style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }} />
          </div>

          {/* Columns + Gap */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "500", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Grid3x3 size={14} /> Columns
              </label>
              <input type="number" value={columns} min="1" max="6"
                onChange={(e) => handleGridChange('columns', e.target.value)}
                style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "500", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Space size={14} /> Gap (px)
              </label>
              <input type="number" value={gap} min="0" max="50"
                onChange={(e) => handleGridChange('gap', e.target.value)}
                style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }} />
            </div>
          </div>

          {/* Padding + Margin */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "500", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Maximize2 size={14} /> Padding (px)
              </label>
              <input type="number" value={padding} min="0" max="100"
                onChange={handlePaddingChange}
                style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "500", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Move size={14} /> Margin (px)
              </label>
              <input type="number" value={margin} min="0" max="100"
                onChange={handleMarginChange}
                style={{ width: "100%", padding: "6px 8px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "13px" }} />
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid #eee",
              marginTop: "14px",
              paddingTop: "14px",
              paddingBottom: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => setShowPopulateModal(true)}
              style={{
                width: "100%",
                minHeight: "40px",
                border: "none",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ff9ec9 0%, #c9184a 100%)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Populate Automate
            </button>
            <p style={{ margin: 0, fontSize: "11px", lineHeight: 1.5, color: "#666" }}>
              Open a larger popup to auto-fill this container overlay with filtered news cards.
            </p>
          </div>

          {/* â”€â”€ Header section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div style={{ borderTop: "1px solid #eee", paddingTop: "12px" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 8px 0", color: headerAccent, display: "flex", alignItems: "center", gap: "6px" }}>
              <Edit2 size={13} /> Header
            </p>

            {/* Enable / disable toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <input
                type="checkbox"
                id={`hdr-enabled-${id}`}
                checked={headerEnabled}
                onChange={handleHeaderEnabledChange}
                style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: headerAccent }}
              />
              <label htmlFor={`hdr-enabled-${id}`} style={{ fontSize: "12px", cursor: "pointer", userSelect: "none" }}>
                Enable Header
              </label>
            </div>

            {/* Header name inputs — only visible when enabled */}
            {headerEnabled && (
              <div>
                <label style={{ fontSize: "11px", color: "#666", display: "block", marginBottom: "4px" }}>
                  Header (Tamil)
                </label>
                <input
                  type="text"
                  value={headerTam}
                  onChange={handleHeaderTamChange}
                  placeholder="Enter Tamil header..."
                  autoFocus
                  style={{ 
                    width: "100%", 
                    padding: "6px 8px", 
                    border: `1px solid ${headerAccent}`, 
                    borderRadius: "4px", 
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <label style={{ fontSize: "11px", color: "#666", display: "block", margin: "10px 0 4px" }}>
                  Header (English)
                </label>
                <input
                  type="text"
                  value={headerEng}
                  onChange={handleHeaderEngChange}
                  placeholder="Enter English header..."
                  style={{ 
                    width: "100%", 
                    padding: "6px 8px", 
                    border: `1px solid ${headerAccent}`, 
                    borderRadius: "4px", 
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {showPopulateModal && (
        <div
          onClick={() => setShowPopulateModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(35, 17, 34, 0.52)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 2000,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(920px, 100%)",
              maxHeight: "86vh",
              overflowY: "auto",
              borderRadius: "26px",
              background: "linear-gradient(180deg, #fff8fc 0%, #fff 100%)",
              boxShadow: "0 30px 80px rgba(33, 16, 30, 0.35)",
              border: "1px solid rgba(219, 112, 147, 0.28)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                padding: "20px 24px",
                background: "linear-gradient(135deg, #2d1b38 0%, #c9184a 100%)",
                color: "#fff",
              }}
            >
              <div>
                <div style={{ fontSize: "22px", fontWeight: "800" }}>Populate Automate</div>
                <p style={{ margin: "6px 0 0", fontSize: "13px", opacity: 0.86 }}>
                  Choose a container style, a population strategy, and the matching news pool for this overlay.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPopulateModal(false)}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  border: "none",
                  background: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "22px 24px 24px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <section
                  style={{
                    border: "1px solid #f1cade",
                    borderRadius: "20px",
                    background: "#fff",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "0.08em", textTransform: "uppercase", color: "#8f4a68" }}>
                      Container Style
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#8a6077" }}>
                      This selected container type will be repeated for every populated news item.
                    </p>
                  </div>

                  <select
                    value={populateContainerOption}
                    onChange={(event) => setPopulateContainerOption(event.target.value)}
                    style={{
                      width: "100%",
                      minHeight: "46px",
                      borderRadius: "14px",
                      border: "1px solid #efc6d9",
                      padding: "0 14px",
                      fontSize: "14px",
                      color: "#5a2941",
                      outline: "none",
                      background: "#fff8fc",
                    }}
                  >
                    {populateContainerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </section>

                <section
                  style={{
                    border: "1px solid #f1cade",
                    borderRadius: "20px",
                    background: "#fff",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "0.08em", textTransform: "uppercase", color: "#8f4a68" }}>
                      Population Type
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#8a6077" }}>
                      Infinity uses every matching story. Custom lets you cap the number of inserted containers.
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                    {[
                      { value: "infinity", label: "Infinity" },
                      { value: "custom", label: "Custom" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        style={{
                          border: populateType === option.value ? "1px solid #ff9ec9" : "1px solid #f1cade",
                          background: populateType === option.value ? "#fff1f7" : "#fff",
                          borderRadius: "16px",
                          padding: "14px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <input
                          type="radio"
                          name={`populate-type-${id}`}
                          checked={populateType === option.value}
                          onChange={() => setPopulateType(option.value)}
                        />
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "#6f3652" }}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {populateType === "custom" && (
                    <label style={{ display: "flex", flexDirection: "column", gap: "8px", color: "#7f3f5d", fontSize: "13px", fontWeight: "700" }}>
                      Custom count
                      <input
                        type="number"
                        min="1"
                        value={populateCount}
                        onChange={(event) => setPopulateCount(event.target.value)}
                        style={{
                          minHeight: "44px",
                          borderRadius: "14px",
                          border: "1px solid #efc6d9",
                          padding: "0 14px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                    </label>
                  )}
                </section>

                <section
                  style={{
                    border: "1px solid #f1cade",
                    borderRadius: "20px",
                    background: "#fff",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "0.08em", textTransform: "uppercase", color: "#8f4a68" }}>
                      Category Selection
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#8a6077" }}>
                      Choose one or more pages or districts. Only matching news will be considered for the overlay.
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "800", letterSpacing: "0.08em", textTransform: "uppercase", color: "#9a5d78" }}>
                        Categories
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {categoryOptions.map((option) => {
                          const checked = selectedPopulateTags.includes(option.value);
                          return (
                            <label
                              key={option.value}
                              style={{
                                border: checked ? "1px solid #ff9ec9" : "1px solid #efc6d9",
                                background: checked ? "#ffe8f3" : "#fff8fc",
                                borderRadius: "999px",
                                padding: "8px 14px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "13px",
                                color: "#7f3f5d",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePopulateTag(option.value)}
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "800", letterSpacing: "0.08em", textTransform: "uppercase", color: "#9a5d78" }}>
                        Districts
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {districtOptions.map((option) => {
                          const checked = selectedPopulateTags.includes(option.value);
                          return (
                            <label
                              key={option.value}
                              style={{
                                border: checked ? "1px solid #ff9ec9" : "1px solid #efc6d9",
                                background: checked ? "#ffe8f3" : "#fff8fc",
                                borderRadius: "999px",
                                padding: "8px 14px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "13px",
                                color: "#7f3f5d",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePopulateTag(option.value)}
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <section
                  style={{
                    border: "1px solid #f1cade",
                    borderRadius: "20px",
                    background: "#fff",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "0.08em", textTransform: "uppercase", color: "#8f4a68" }}>
                      News Filter
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#8a6077" }}>
                      Decide how the matching news should be ordered or selected before it gets dropped into the overlay.
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      {
                        value: "recent-top",
                        label: "Recently added on top",
                        description: "Newest stories appear first.",
                      },
                      {
                        value: "recent-bottom",
                        label: "Recently added at the bottom",
                        description: "Oldest stories appear first.",
                      },
                      {
                        value: "pick-own",
                        label: "Pick on your own",
                        description: "Choose the exact stories manually.",
                      },
                    ].map((option) => (
                      <label
                        key={option.value}
                        style={{
                          border: populateMode === option.value ? "1px solid #ff9ec9" : "1px solid #f1cade",
                          background: populateMode === option.value ? "#fff1f7" : "#fff",
                          borderRadius: "16px",
                          padding: "14px",
                          cursor: "pointer",
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                        }}
                      >
                        <input
                          type="radio"
                          name={`populate-mode-${id}`}
                          checked={populateMode === option.value}
                          onChange={() => setPopulateMode(option.value)}
                        />
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#6f3652" }}>
                            {option.label}
                          </div>
                          <div style={{ marginTop: "4px", fontSize: "12px", color: "#9b6d84" }}>
                            {option.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>

                <section
                  style={{
                    border: "1px solid #f1cade",
                    borderRadius: "20px",
                    background: "#fff",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "0.08em", textTransform: "uppercase", color: "#8f4a68" }}>
                        Ready To Populate
                      </div>
                      <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#8a6077" }}>
                        {populateMode === "pick-own"
                          ? "Pick the exact stories to be inserted into the container overlay."
                          : "Preview the stories that will be inserted based on the chosen rules."}
                      </p>
                    </div>
                    <div
                      style={{
                        minWidth: "72px",
                        padding: "10px 12px",
                        borderRadius: "14px",
                        background: "#fff1f7",
                        color: "#a4005a",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "20px", fontWeight: "800", lineHeight: 1 }}>
                        {populateMode === "pick-own" ? selectedManualNewsIds.length : populatePreparedNews.length}
                      </div>
                      <div style={{ marginTop: "4px", fontSize: "11px", fontWeight: "700" }}>
                        selected
                      </div>
                    </div>
                  </div>

                  {populateMode === "pick-own" && (
                    <div style={{ fontSize: "12px", color: "#9b6d84" }}>
                      {populateSelectionLimit === null
                        ? "Choose any number of stories."
                        : `Choose up to ${populateSelectionLimit} stories.`}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      maxHeight: "360px",
                      overflowY: "auto",
                      paddingRight: "4px",
                    }}
                  >
                    {populateFilteredNews.length === 0 && (
                      <div
                        style={{
                          border: "1px dashed #efc6d9",
                          borderRadius: "16px",
                          padding: "18px",
                          textAlign: "center",
                          color: "#9b6d84",
                          background: "#fff8fc",
                        }}
                      >
                        No stories match the selected categories yet.
                      </div>
                    )}

                    {(populateMode === "pick-own" ? populateFilteredNews : populatePreparedNews).map((news) => {
                      const newsId = Number(news.id);
                      const isSelected = selectedManualNewsIds.includes(newsId);
                      const disableSelection =
                        populateMode === "pick-own" &&
                        populateSelectionLimit !== null &&
                        selectedManualNewsIds.length >= populateSelectionLimit &&
                        !isSelected;

                      return (
                        <label
                          key={news._id || news.id}
                          style={{
                            border: isSelected ? "1px solid #ff9ec9" : "1px solid #f1cade",
                            background: isSelected ? "#fff1f7" : "#fff",
                            borderRadius: "16px",
                            padding: "14px",
                            display: "flex",
                            gap: "12px",
                            alignItems: "flex-start",
                            opacity: disableSelection ? 0.55 : 1,
                            cursor: populateMode === "pick-own" ? "pointer" : "default",
                          }}
                        >
                          {populateMode === "pick-own" && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={disableSelection}
                              onChange={() => toggleManualNewsSelection(newsId)}
                              style={{ marginTop: "4px" }}
                            />
                          )}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "15px", fontWeight: "700", color: "#5d243f", lineHeight: 1.35 }}>
                              {news?.data?.headline || news?.dataEn?.headline || "Untitled news"}
                            </div>
                            <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "12px", color: "#9b6d84" }}>
                              <span>{new Date(getComparableTime(news) || Date.now()).toLocaleString()}</span>
                              {getNewsTags(news).slice(0, 2).map((tag) => (
                                <span
                                  key={`${newsId}-${tag}`}
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "999px",
                                    background: "#fff8fc",
                                    border: "1px solid #f1cade",
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </section>

                <div
                  style={{
                    border: "1px solid #f1cade",
                    borderRadius: "20px",
                    background: "#fff",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ fontSize: "13px", color: "#8a6077", lineHeight: 1.6 }}>
                    This action replaces the current news-style slots inside this container overlay and keeps the other overlay elements intact.
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setShowPopulateModal(false)}
                      style={{
                        minHeight: "44px",
                        padding: "0 18px",
                        borderRadius: "14px",
                        border: "1px solid #efc6d9",
                        background: "#fff",
                        color: "#7f3f5d",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePopulateAutomate}
                      style={{
                        minHeight: "44px",
                        padding: "0 20px",
                        borderRadius: "14px",
                        border: "none",
                        background: "linear-gradient(135deg, #db7093 0%, #c9184a 100%)",
                        color: "#fff",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      Populate Overlay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          HEADER BAR
          Shown as its own row above the drop zone when headerEnabled = true.
          Structured as: [title text] [stretching coloured line]
          Matches the design in the reference image.
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {headerEnabled && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 12px",
            borderRadius: "6px 6px 0 0",
            flexShrink: 0,
            minHeight: "36px",
            pointerEvents: "none",   // header bar itself is non-interactive
          }}
        >
          {/* Title */}
          <span
            style={{
              fontWeight: "700",
              fontSize: "15px",
                
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {headerDisplayText}
          </span>

          {/* Decorative horizontal line â€” fills remaining space */}
          <div
            style={{
              flex: 1,
              height: "2.5px",
              background: headerAccent,
              borderRadius: "2px",
            }}
          />
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          DROP ZONE  â€” all existing drag-drop functionality is untouched
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div 
        style={{ 
          flex: 1, 
          position: "relative", 
          overflow: "visible", 
          padding: `${padding}px`, 
          minHeight:
            nestedContainers.length === 0 && items.length === 0 && sliders.length === 0
              ? "150px"
              : "fit-content",
        }} 
        onDrop={handleDrop} 
        onDragOver={handleDragOver}
      >
        {/* Empty-state label */}
        {nestedContainers.length === 0 && items.length === 0 && sliders.length === 0 && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            height: "100%", 
            color: isNested ? "#ff9800" : "#999", 
            fontSize: "14px", 
            textAlign: "center", 
            padding: "20px",
          }}>
            {isNested ? "Drop containers or news here (Nested)" : "Drop containers here"}
          </div>
        )}

        {/* Grid of items / nested containers / sliders (insertion order preserved) */}
        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: `repeat(${columns}, 1fr)`, 
            gap: `${gap}px`, 
            width: "100%",
            position: "relative",
          }}
        >
          {(() => {
            const extractTimestamp = (item) => {
              if (item.slotId) {
                const m = item.slotId.match(/slot_(\d+)/);
                return m ? parseInt(m[1]) : 0;
              }
              if (item.id) {
                const m = item.id.toString().match(/_(\d+)$/);
                return m ? parseInt(m[1]) : 0;
              }
              return 0;
            };

            const allElements = [
              ...items.map(item => ({ type: 'item',   data: item,   timestamp: extractTimestamp(item) })),
              ...nestedContainers.map(nc => ({ type: 'nested', data: nc,     timestamp: extractTimestamp(nc) })),
              ...sliders.map(sl => ({ type: 'slider', data: sl,     timestamp: extractTimestamp(sl) })),
            ];
            allElements.sort((a, b) => a.timestamp - b.timestamp);

            return allElements.map((element, index) => {
              // â”€â”€ Item (news slot) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              if (element.type === 'item') {
                const item = element.data;
                const Component = COMPONENT_MAP[item.containerType];
                if (!Component) return null;
                const defaults = getUniversalContainerDefaults(item.containerType);
                return (
                  <div key={item.slotId} style={{ pointerEvents: "auto", position: "relative" }}>
                    <Component 
                      border 
                      slotId={item.slotId} 
                      catName={catName} 
                      containerId={id}
                      isNested={isNested}
                      parentContainerId={parentContainerId}
                      defaultWidth={defaults.width}
                      defaultHeight={defaults.height}
                      defaultLayout={defaults.layout}
                      onDelete={() => {
                        if (isNested && parentContainerId) {
                          dispatch(removeSlotFromNestedContainer({ catName, parentContainerId, nestedContainerId: id, slotId: item.slotId }));
                        } else {
                          dispatch(removeSlotFromContainer({ catName, containerId: id, slotId: item.slotId }));
                        }
                      }}
                    />
                  </div>
                );
              }

              // â”€â”€ Nested container â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              if (element.type === 'nested') {
                const nested = element.data;
                return (
                  <div key={nested.id} style={{ pointerEvents: "auto", position: "relative" }}>
                    <EditableContainer
                      id={nested.id}
                      catName={catName}
                      isNested={true}
                      parentContainerId={id}
                    />
                  </div>
                );
              }

              // â”€â”€ Slider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              if (element.type === 'slider') {
                const slider = element.data;
                return (
                  <div key={slider.id} style={{ pointerEvents: "auto", position: "relative", width: "100%", height: "fit-content" }}>
                    {slider.type === "type1" ? (
                      <EditableSlider
                        id={slider.id}
                        catName={catName}
                        containerId={id}
                        isNested={isNested}
                        parentContainerId={parentContainerId}
                      />
                    ) : (
                      <EditableSlider2
                        id={slider.id}
                        catName={catName}
                        containerId={id}
                        isNested={isNested}
                        parentContainerId={parentContainerId}
                      />
                    )}
                  </div>
                );
              }

              return null;
            });
          })()}
        </div>

        {/* Lines */}
        {lines.map((line) => (
          <EditableLine
            key={line.id}
            id={line.id}
            lineType={line.lineType}
            orientation={line.orientation}
            length={line.length}
            x={line.x}
            y={line.y}
            catName={catName}
            isActive={false}
            containerId={id}
            parentContainerId={parentContainerId}
          />
        ))}
      </div>
    </div>
  );
}
