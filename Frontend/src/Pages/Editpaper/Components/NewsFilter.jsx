import React, { useMemo, useState } from "react";
import { Rnd } from "react-rnd";
import { IoClose } from "react-icons/io5";
import { useSelector } from "react-redux";
import { resolveMediaUrl } from "../../../utils/media";
import "./newsfilter.scss";

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

export default function NewsFilter({
  open = true,
  onClose = () => {},
  embedded = false,
}) {
  const allNews = useSelector((state) => state.newsform.allNews || []);
  const allPages = useSelector((state) => state.admin.allPages || []);

  const categoryOptions = useMemo(
    () =>
      Array.from(
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
      ),
    [allPages]
  );

  const districtOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allPages
            .find((page) => Array.isArray(page?.districts))
            ?.districts?.map((district) => district?.eng)
            ?.filter(Boolean) || []
        )
      ),
    [allPages]
  );

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const filteredNews = useMemo(() => {
    return [...allNews]
      .sort((a, b) => getComparableTime(b) - getComparableTime(a))
      .filter((news) => {
        const tags = getNewsTags(news).map((item) => item.toLowerCase());
        const categoryMatch =
          !selectedCategory || tags.includes(selectedCategory.toLowerCase());
        const districtMatch =
          !selectedDistrict || tags.includes(selectedDistrict.toLowerCase());
        return categoryMatch && districtMatch;
      });
  }, [allNews, selectedCategory, selectedDistrict]);

  const getThumbnail = (thumbnail) => {
    if (!thumbnail) return null;
    if (typeof thumbnail === "string") return resolveMediaUrl(thumbnail);
    if (thumbnail instanceof File) return URL.createObjectURL(thumbnail);
    return null;
  };

  const content = (
    <div className={`newsfilter-panel${embedded ? " is-embedded" : ""}`}>
      {!embedded && (
        <div className="newsfilter-header drag-handle-filter">
          <div className="newsfilter-title">News Filter</div>
          <button type="button" className="newsfilter-close" onClick={onClose}>
            <IoClose />
          </button>
        </div>
      )}

      {embedded && (
        <div className="newsfilter-embedded-header">
          <div className="newsfilter-title">News Filter</div>
          <p>Recently uploaded stories appear by default. Narrow them by category or district.</p>
        </div>
      )}

      <div className="newsfilter-controls">
        <label className="newsfilter-control">
          <span>Category</span>
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="newsfilter-control">
          <span>District</span>
          <select
            value={selectedDistrict}
            onChange={(event) => setSelectedDistrict(event.target.value)}
          >
            <option value="">All districts</option>
            {districtOptions.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="newsfilter-result-meta">
        <strong>{filteredNews.length}</strong>
        <span>stories ready to drag into the page</span>
      </div>

      <div className="newsfilter-news-list">
        {filteredNews.length === 0 && (
          <div className="newsfilter-empty">
            No news matches the current filters.
          </div>
        )}

        {filteredNews.map((news, index) => {
          const thumb = getThumbnail(news?.data?.thumbnail);
          const tags = getNewsTags(news);

          return (
            <div
              key={news._id || news.id || index}
              className="newsfilter-news-card"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("newsId", news.id);
                event.dataTransfer.effectAllowed = "copy";
              }}
            >
              <div className="newsfilter-news-thumb">
                {thumb ? <img src={thumb} alt="news" /> : <div className="newsfilter-thumb-fallback">News</div>}
              </div>

              <div className="newsfilter-news-copy">
                <div className="newsfilter-news-headline">
                  {news?.data?.headline || "Untitled"}
                </div>
                <div className="newsfilter-news-meta">
                  <span>{news?.time || news?.createdAt || "Recent"}</span>
                  {tags[0] && <span>{tags[0]}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (embedded) return content;
  if (!open) return null;

  return (
    <div className="newsfilter-overlay">
      <Rnd
        default={{ x: 100, y: 100, width: 420, height: 620 }}
        bounds="parent"
        dragHandleClassName="drag-handle-filter"
        style={{ zIndex: 9998, pointerEvents: "auto" }}
      >
        {content}
      </Rnd>
    </div>
  );
}
