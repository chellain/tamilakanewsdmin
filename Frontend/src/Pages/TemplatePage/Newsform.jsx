import React, { useCallback, useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { AiOutlineSlack } from "react-icons/ai";
import { FaImage, FaParagraph, FaTimes, FaVideo } from "react-icons/fa";
import { BiGridAlt } from "react-icons/bi";
import { useSelector } from "react-redux";
import { fileToWebPDataUrl } from "../../utils/imageUtils";
import { uploadThumbnail } from "../../Api/uploadApi";
import { resolveMediaUrl } from "../../utils/media";
import "../TemplatePage/TemplatePage.scss";

const emptyFormData = () => ({
  headline: "",
  oneLiner: "",
  thumbnail: null,
  zonal: [],
  author: "",
  images: [],
});

const normalizeCategories = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Newsform({
  initialData = null,
  onChange = () => {},
  onSave = () => {},
  activeLang = "ta",
  onActiveLangChange = () => {},
  paragraphBoxes = [],
  onTranslatedParagraphs = () => {},
  hiddenElements = { thumbnail: false, author: false, zonar: false },
  onHiddenElementsChange = () => {},
}) {
  const [tamilBuffer, setTamilBuffer] = useState(emptyFormData());
  const [englishBuffer, setEnglishBuffer] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const allPages = useSelector((state) => state.admin.allPages || []);
  const [categoryPage, setCategoryPage] = useState(0);
  const [districtPage, setDistrictPage] = useState(0);

  const categoryOptions = Array.from(
    new Set(
      allPages
        .filter(
          (page) =>
            page?.name?.eng &&
            page.name.eng !== "Select District" &&
            !page.districts
        )
        .map((page) => page.name.eng)
        .filter(Boolean)
    )
  );

  const districtOptions = Array.from(
    new Set(
      allPages
        .find((page) => Array.isArray(page?.districts))
        ?.districts?.map((district) => district?.eng)
        ?.filter(Boolean) || []
    )
  );

  const selectedCategories = normalizeCategories(tamilBuffer.zonal);
  const pageSize = 8;
  const totalCategoryPages = Math.max(1, Math.ceil(categoryOptions.length / pageSize));
  const totalDistrictPages = Math.max(1, Math.ceil(districtOptions.length / pageSize));
  const pagedCategories = categoryOptions.slice(
    categoryPage * pageSize,
    categoryPage * pageSize + pageSize
  );
  const pagedDistricts = districtOptions.slice(
    districtPage * pageSize,
    districtPage * pageSize + pageSize
  );

  const hasEnglishBuffer = englishBuffer !== null;
  const displayData =
    activeLang === "en"
      ? englishBuffer || {
          ...emptyFormData(),
          thumbnail: tamilBuffer.thumbnail,
          images: tamilBuffer.images,
          zonal: tamilBuffer.zonal,
        }
      : tamilBuffer;

  useEffect(() => {
    if (!initialData) return;

    const data = initialData.data || emptyFormData();
    const normalizedData = {
      ...data,
      zonal: normalizeCategories(data.zonal),
    };

    setTamilBuffer((prev) => ({ ...emptyFormData(), ...prev, ...normalizedData }));

    if (initialData.dataEn) {
      const normalizedEn = {
        ...initialData.dataEn,
        zonal: normalizeCategories(initialData.dataEn.zonal),
      };
      setEnglishBuffer((prev) => ({ ...emptyFormData(), ...prev, ...normalizedEn }));
    } else {
      setEnglishBuffer(null);
    }

    if (data.thumbnail) {
      try {
        if (typeof data.thumbnail === "string") {
          setThumbnailPreview(resolveMediaUrl(data.thumbnail));
        } else {
          setThumbnailPreview(URL.createObjectURL(data.thumbnail));
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      setThumbnailPreview(null);
    }
  }, [initialData]);

  useEffect(() => {
    if (categoryPage >= totalCategoryPages) {
      setCategoryPage(0);
    }
  }, [categoryPage, totalCategoryPages]);

  useEffect(() => {
    if (districtPage >= totalDistrictPages) {
      setDistrictPage(0);
    }
  }, [districtPage, totalDistrictPages]);

  useEffect(() => {
    if (!hasEnglishBuffer) return;
    setEnglishBuffer((prev) => {
      if (!prev) return prev;
      const sameThumb = prev.thumbnail === tamilBuffer.thumbnail;
      const sameImages = prev.images === tamilBuffer.images;
      const sameZonal = prev.zonal === tamilBuffer.zonal;
      if (sameThumb && sameImages && sameZonal) return prev;
      return {
        ...prev,
        thumbnail: tamilBuffer.thumbnail,
        images: tamilBuffer.images,
        zonal: tamilBuffer.zonal,
      };
    });
  }, [tamilBuffer.thumbnail, tamilBuffer.images, tamilBuffer.zonal, hasEnglishBuffer]);

  const notifyChange = useCallback(() => {
    onChange({
      tamil: { ...tamilBuffer },
      english: englishBuffer ? { ...englishBuffer } : null,
    });
  }, [tamilBuffer, englishBuffer, onChange]);

  useEffect(() => {
    notifyChange();
  }, [notifyChange]);

  const handleChange = async (event) => {
    const { name, value, files } = event.target;
    if (activeLang === "en" && (name === "thumbnail" || name === "zonal")) {
      return;
    }

    if (files && files[0]) {
      const file = files[0];

      try {
        let nextValue = null;

        if (name === "thumbnail" && file.type?.startsWith("image/")) {
          const response = await uploadThumbnail(file);
          nextValue = response?.publicUrl || response?.url || "";
        } else if (name === "thumbnail") {
          nextValue = await readFileAsDataUrl(file);
        } else {
          nextValue = await fileToWebPDataUrl(file, { maxWidth: 800, quality: 0.8 });
        }

        if (activeLang === "en") {
          setEnglishBuffer((prev) => ({
            ...(prev || {
              ...emptyFormData(),
              thumbnail: tamilBuffer.thumbnail,
              images: tamilBuffer.images,
              zonal: tamilBuffer.zonal,
            }),
            [name]: nextValue,
          }));
        } else {
          setTamilBuffer((prev) => ({ ...prev, [name]: nextValue }));
          if (name === "thumbnail") {
            setThumbnailPreview(
              typeof nextValue === "string" ? resolveMediaUrl(nextValue) : nextValue
            );
          }
        }
      } catch (error) {
        console.error(`Failed to process ${name}:`, error);
        alert(`Failed to upload ${name}. Please try again.`);
      }

      return;
    }

    if (activeLang === "en") {
      setEnglishBuffer((prev) => ({
        ...(prev || {
          ...emptyFormData(),
          thumbnail: tamilBuffer.thumbnail,
          images: tamilBuffer.images,
          zonal: tamilBuffer.zonal,
        }),
        [name]: value,
      }));
    } else {
      setTamilBuffer((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleCategory = (value) => {
    if (activeLang === "en") return;
    setTamilBuffer((prev) => {
      const current = normalizeCategories(prev.zonal);
      const exists = current.includes(value);
      const next = exists ? current.filter((item) => item !== value) : [...current, value];
      return { ...prev, zonal: next };
    });
  };

  const toggleVisibilityOption = (key) => {
    onHiddenElementsChange((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const switchToEnglishWithEmpty = useCallback(() => {
    const emptyEn = {
      ...emptyFormData(),
      thumbnail: tamilBuffer.thumbnail,
      images: tamilBuffer.images,
      zonal: tamilBuffer.zonal,
    };
    setEnglishBuffer(emptyEn);
    const emptyParagraphs = paragraphBoxes.map((box) => ({ id: box.id, contentEn: "" }));
    onTranslatedParagraphs(emptyParagraphs);
    onActiveLangChange("en");
  }, [
    tamilBuffer.thumbnail,
    tamilBuffer.images,
    tamilBuffer.zonal,
    paragraphBoxes,
    onTranslatedParagraphs,
    onActiveLangChange,
  ]);

  const submit = (event) => {
    event?.preventDefault();
    try {
      onSave(activeLang === "en" && englishBuffer ? englishBuffer : tamilBuffer);
    } catch (error) {
      console.error("Error in submit function:", error);
      alert(`Error saving news: ${error.message}`);
    }
  };

  const handleContainerDragStart = (event) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("container-overlay", "true");
  };

  const handleParagraphDragStart = (event) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("add-box-type", "paragraph");
  };

  const handleImageDragStart = (event) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("add-box-type", "image");
  };

  const handleVideoDragStart = (event) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("add-box-type", "video");
  };

  const renderSelectionRange = (page, total) => {
    if (total === 0) return "0 items";
    return `${Math.min(page * pageSize + 1, total)}-${Math.min((page + 1) * pageSize, total)} of ${total}`;
  };

  return (
    <div className="form-main-cont">
      {!openForm && (
        <div
          onClick={() => setOpenForm(true)}
          style={{
            position: "fixed",
            top: 20,
            left: 20,
            fontSize: "40px",
            cursor: "pointer",
            zIndex: 9999,
          }}
        >
          <AiOutlineSlack />
        </div>
      )}

      {openForm && (
        <Rnd
          default={{ x: 1000, y: 0, width: 520, height: 760 }}
          bounds="window"
          dragHandleClassName="drag-header"
          className="newsform-panel"
          style={{ zIndex: 9999 }}
        >
          <div className="drag-header">
            <span>News Form</span>
            <FaTimes style={{ cursor: "pointer", color: "red" }} onClick={() => setOpenForm(false)} />
          </div>

          <div className="newsform-con">
            <form onSubmit={submit} className="news-form">
              <div className="newsform-lang-toggle">
                <span className="newsform-lang-label">Language</span>
                <div className="newsform-lang-buttons">
                  <button
                    type="button"
                    onClick={() => onActiveLangChange("ta")}
                    className={`newsform-lang-btn${activeLang === "ta" ? " is-active" : ""}`}
                  >
                    Tamil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (englishBuffer) {
                        onActiveLangChange("en");
                      } else {
                        switchToEnglishWithEmpty();
                      }
                    }}
                    className={`newsform-lang-btn${activeLang === "en" ? " is-active" : ""}`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">News Headline</label>
                <textarea
                  name="headline"
                  value={displayData.headline || ""}
                  onChange={handleChange}
                  placeholder="Enter news headline"
                  className="form-textarea"
                  rows="2"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">News One-Liner</label>
                <textarea
                  name="oneLiner"
                  value={displayData.oneLiner || ""}
                  onChange={handleChange}
                  placeholder="Enter a short one-liner"
                  className="form-textarea"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Author</label>
                <input
                  type="text"
                  name="author"
                  value={displayData.author || ""}
                  onChange={handleChange}
                  placeholder="Enter author name"
                  className="form-textarea"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Thumbnail Image</label>
                <input
                  type="file"
                  name="thumbnail"
                  accept="image/*,video/*,.gif"
                  onChange={handleChange}
                  className={`form-file${activeLang === "en" ? " is-disabled" : ""}`}
                  disabled={activeLang === "en"}
                />
                {activeLang === "en" && (
                  <div className="newsform-note">Switch to Tamil to change the thumbnail.</div>
                )}

                {thumbnailPreview && (
                  <div className="image-preview">
                    {displayData.thumbnail &&
                    (displayData.thumbnail.type?.startsWith("video/") ||
                      (typeof displayData.thumbnail === "string" &&
                        (displayData.thumbnail.startsWith("data:video/") ||
                          displayData.thumbnail.includes(".mp4") ||
                          displayData.thumbnail.includes(".webm") ||
                          displayData.thumbnail.includes(".ogg")))) ? (
                      <video
                        src={thumbnailPreview}
                        controls
                        style={{ width: "100%", maxHeight: "200px", borderRadius: "8px" }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail Preview"
                        className="preview-img"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="form-group newsform-category-group">
                <div className="newsform-category-header">
                  <label className="form-label">Category and District</label>
                  <div className="newsform-selected-tags">
                    {selectedCategories.length === 0 && (
                      <span className="newsform-tag is-empty">No selection yet</span>
                    )}
                    {selectedCategories.map((category) => (
                      <span key={category} className="newsform-tag">
                        {category}
                        {activeLang !== "en" && (
                          <button
                            type="button"
                            className="newsform-tag-remove"
                            onClick={() => toggleCategory(category)}
                          >
                            x
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="newsform-selection-section">
                  <div className="newsform-selection-heading">Pages</div>
                  <div className={`newsform-category-grid${activeLang === "en" ? " is-disabled" : ""}`}>
                    {categoryOptions.length === 0 && (
                      <div className="newsform-empty">No categories configured.</div>
                    )}
                    {pagedCategories.map((category) => {
                      const checked = selectedCategories.includes(category);
                      return (
                        <label
                          key={category}
                          className={`newsform-category-tile${checked ? " is-checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCategory(category)}
                            disabled={activeLang === "en"}
                          />
                          <span>{category}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="newsform-category-footer">
                    <span className="newsform-category-count">
                      {renderSelectionRange(categoryPage, categoryOptions.length)}
                    </span>
                    <button
                      type="button"
                      className="newsform-category-next"
                      onClick={() => setCategoryPage((prev) => (prev + 1) % totalCategoryPages)}
                      disabled={categoryOptions.length <= pageSize}
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="newsform-selection-divider" />

                <div className="newsform-selection-section">
                  <div className="newsform-selection-heading">Districts</div>
                  <div className={`newsform-category-grid${activeLang === "en" ? " is-disabled" : ""}`}>
                    {districtOptions.length === 0 && (
                      <div className="newsform-empty">No districts configured.</div>
                    )}
                    {pagedDistricts.map((district) => {
                      const checked = selectedCategories.includes(district);
                      return (
                        <label
                          key={district}
                          className={`newsform-category-tile${checked ? " is-checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCategory(district)}
                            disabled={activeLang === "en"}
                          />
                          <span>{district}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="newsform-category-footer">
                    <span className="newsform-category-count">
                      {renderSelectionRange(districtPage, districtOptions.length)}
                    </span>
                    <button
                      type="button"
                      className="newsform-category-next"
                      onClick={() => setDistrictPage((prev) => (prev + 1) % totalDistrictPages)}
                      disabled={districtOptions.length <= pageSize}
                    >
                      Next
                    </button>
                  </div>
                </div>

                {activeLang === "en" && (
                  <div className="newsform-note">Switch to Tamil to edit categories and districts.</div>
                )}
              </div>

              <div className="form-group newsform-visibility-group">
                <label className="form-label">Visible in template</label>
                <div className="newsform-visibility-grid">
                  <label className="newsform-visibility-option">
                    <input
                      type="checkbox"
                      checked={!hiddenElements.thumbnail}
                      onChange={() => toggleVisibilityOption("thumbnail")}
                    />
                    <span>Thumbnail</span>
                  </label>
                  <label className="newsform-visibility-option">
                    <input
                      type="checkbox"
                      checked={!hiddenElements.author}
                      onChange={() => toggleVisibilityOption("author")}
                    />
                    <span>Author</span>
                  </label>
                  <label className="newsform-visibility-option">
                    <input
                      type="checkbox"
                      checked={!hiddenElements.zonar}
                      onChange={() => toggleVisibilityOption("zonar")}
                    />
                    <span>Category</span>
                  </label>
                </div>
                <div className="newsform-note">
                  Use these checkboxes to show or hide the template elements directly from the form.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Content Organization</label>
                <div
                  draggable
                  onDragStart={handleContainerDragStart}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    background: "#667eea",
                    color: "#fff",
                    borderRadius: "8px",
                    cursor: "move",
                  }}
                >
                  <BiGridAlt size={18} />
                  Drag Container Overlay
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#666",
                    marginTop: "6px",
                    lineHeight: "1.4",
                  }}
                >
                  Drag this to organize paragraphs and images in a grid layout.
                </p>
              </div>

              <div className="add-pi newsform-add-row">
                <div className="newsform-add-btn" draggable onDragStart={handleParagraphDragStart}>
                  <FaParagraph size={14} />
                  Add Paragraph
                </div>
                <div className="newsform-add-btn" draggable onDragStart={handleImageDragStart}>
                  <FaImage size={14} />
                  Add Image
                </div>
                <div
                  className="newsform-add-btn"
                  draggable
                  onDragStart={handleVideoDragStart}
                  title="Drag onto the canvas or into a Container Overlay"
                >
                  <FaVideo size={13} />
                  Add Video
                </div>
              </div>

              <button type="submit" onClick={submit} className="upload-button">
                Save news
              </button>
            </form>
          </div>
        </Rnd>
      )}
    </div>
  );
}
