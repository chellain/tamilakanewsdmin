import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedFont } from "../../Slice/adminSlice.js";
import {
  ensureTamilFontFaces,
  getTamilFontFamily,
  getTamilLegacyPreviewFamily,
  normalizeTamilFontId,
  TAMIL_FONT_OPTIONS,
} from "../../../utils/tamilFonts.js";
import "./changefont.scss";

const tamilPreview =
  "\u0ba4\u0bae\u0bbf\u0bb4\u0b95 \u0ba8\u0bbf\u0baf\u0bc2\u0bb8\u0bcd - \u0b89\u0ba3\u0bcd\u0bae\u0bc8, \u0ba4\u0bc6\u0bb3\u0bbf\u0bb5\u0bc1, \u0ba8\u0b9f\u0bc1\u0ba8\u0bbf\u0bb2\u0bc8. \u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0ba8\u0bbe\u0bb3\u0bc8\u0baf \u0b9a\u0bc6\u0baf\u0bcd\u0ba4\u0bbf \u0b87\u0ba9\u0bcd\u0bb1\u0bc1 \u0b87\u0b99\u0bcd\u0b95\u0bc7.";
const legacyGlyphPreview =
  "mfuKjy; nra;jp khjpup Kd;NdhL;L - fUj;Jf;fs; nrhy;Yk; nray;fs;";
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
                style={{
                  "--font-option-preview-family": getTamilLegacyPreviewFamily(
                    font.id
                  ),
                }}
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
                  {font.id !== "default" && (
                    <span className="font-option-glyph-preview">
                      {legacyGlyphPreview}
                    </span>
                  )}
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
          {selectedFont !== "default" && (
            <div
              className="font-preview-legacy-sample"
              style={{ fontFamily: getTamilLegacyPreviewFamily(selectedFont) }}
            >
              <div className="legacy-sample-label">Actual font file preview</div>
              <p>{legacyGlyphPreview}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
