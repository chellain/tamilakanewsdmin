import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedFont } from "../../Slice/adminSlice.js";
import {
  ensureTamilFontFaces,
  getTamilFontFamily,
  normalizeTamilFontId,
  TAMIL_FONT_OPTIONS,
} from "../../../utils/tamilFonts.js";
import "./changefont.scss";

const tamilPreview =
  "தமிழக நியூஸ் - உண்மை, தெளிவு, நடுநிலை. உங்கள் நாளைய செய்தி இன்று இங்கே.";
const englishPreview =
  "English preview stays in the normal website font while Tamil changes.";

export default function ChangeFont() {
  const dispatch = useDispatch();
  const selectedFont = useSelector((state) =>
    normalizeTamilFontId(state.admin?.selectedFont)
  );
  const selectedOption =
    TAMIL_FONT_OPTIONS.find((font) => font.id === selectedFont) ||
    TAMIL_FONT_OPTIONS[0];

  useEffect(() => {
    ensureTamilFontFaces();
  }, []);

  const handleSelectFont = (fontId) => {
    dispatch(setSelectedFont(fontId));
  };

  return (
    <section className="change-font-page">
      <header className="change-font-header">
        <div>
          <p className="change-font-eyebrow">Website typography</p>
          <h1>Change Font</h1>
        </div>
        <p>
          Choose the Tamil font used on the public Newspaper and Preview pages.
          English text is intentionally kept on the normal font stack.
        </p>
      </header>

      <div className="change-font-grid">
        <div className="font-options-card">
          <div className="font-card-title">Available Fonts</div>
          <div className="font-option-list">
            {TAMIL_FONT_OPTIONS.map((font) => (
              <label
                key={font.id}
                className={`font-option ${
                  selectedFont === font.id ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="selectedFont"
                  value={font.id}
                  checked={selectedFont === font.id}
                  onChange={() => handleSelectFont(font.id)}
                />
                <span className="font-option-copy">
                  <span className="font-option-name">{font.label}</span>
                  <span className="font-option-description">
                    {font.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <div className="font-save-note">
            Changes are saved automatically with the admin configuration.
          </div>
        </div>

        <div className="font-preview-card">
          <div className="font-card-title">Live Preview</div>
          <div className="font-preview-meta">
            Selected: <strong>{selectedOption.label}</strong>
          </div>
          <div
            className="font-preview-sample"
            style={{ fontFamily: getTamilFontFamily(selectedFont) }}
          >
            <h2>{tamilPreview}</h2>
            <p>{tamilPreview}</p>
            <span>{englishPreview}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
