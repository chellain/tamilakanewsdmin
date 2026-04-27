import React, { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo.png";
import luffy from "../assets/luffy.png";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiClock,
  FiEye,
  FiGrid,
  FiLayers,
  FiLoader,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { deleteNews, setCurrentNews } from "./Slice/newsformSlice.js";
import { deleteNews as deleteNewsApi } from "../Api/newsApi.js";
import { resolveMediaUrl } from "../utils/media.js";
import "./Newsbund.scss";

export default function Newsbund() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allNews = useSelector((state) => state.newsform.allNews || []);
  const newsLoaded = useSelector((state) => state.newsform.newsLoaded);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loadingElapsedMs, setLoadingElapsedMs] = useState(0);

  const isLoadingNews = !newsLoaded;
  const storedEstimateMs = useMemo(() => {
    if (typeof window === "undefined") return 3600;
    const raw = window.localStorage.getItem("newsbundLoadEstimateMs");
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 1200 ? parsed : 3600;
  }, []);

  useEffect(() => {
    if (!isLoadingNews) return undefined;

    const startedAt = Date.now();
    setLoadingElapsedMs(0);

    const timer = window.setInterval(() => {
      setLoadingElapsedMs(Date.now() - startedAt);
    }, 120);

    return () => window.clearInterval(timer);
  }, [isLoadingNews]);

  useEffect(() => {
    if (isLoadingNews || typeof window === "undefined") return;
    const actual = Math.max(1200, loadingElapsedMs || storedEstimateMs);
    const nextEstimate = Math.round((storedEstimateMs * 0.55) + (actual * 0.45));
    window.localStorage.setItem("newsbundLoadEstimateMs", String(nextEstimate));
  }, [isLoadingNews, loadingElapsedMs, storedEstimateMs]);

  const getThumbnail = (thumbnail) => {
    if (!thumbnail) return null;
    if (typeof thumbnail === "string") return resolveMediaUrl(thumbnail);
    if (thumbnail instanceof File) return URL.createObjectURL(thumbnail);
    return null;
  };

  const getCategoryList = (news) => {
    const zonal = news?.data?.zonal;
    if (Array.isArray(zonal)) return zonal.filter(Boolean).map((item) => String(item).trim());
    if (typeof zonal === "string" && zonal.trim()) return [zonal.trim()];
    return [];
  };

  const categoryOptions = useMemo(() => {
    const map = new Map();
    allNews.forEach((news) => {
      getCategoryList(news).forEach((item) => {
        const key = item.toLowerCase();
        if (!map.has(key)) map.set(key, item);
      });
    });

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allNews]);

  const filteredNews = useMemo(() => {
    const source = [...allNews].sort((a, b) => {
      const aTime = new Date(a?.updatedAt || a?.createdAt || a?.time || 0).getTime();
      const bTime = new Date(b?.updatedAt || b?.createdAt || b?.time || 0).getTime();
      return bTime - aTime;
    });

    if (activeCategory === "all") return source;

    return source.filter((news) =>
      getCategoryList(news).some(
        (item) => String(item).toLowerCase() === activeCategory.toLowerCase()
      )
    );
  }, [allNews, activeCategory]);

  const activeCategoryLabel =
    activeCategory === "all"
      ? "All categories"
      : categoryOptions.find((option) => option.value === activeCategory)?.label || activeCategory;

  const featuredCount = filteredNews.filter((news) => Boolean(news?.data?.thumbnail)).length;
  const visibleNews = filteredNews.slice(0, 4);
  const loadingProgress = Math.min(96, Math.round((loadingElapsedMs / storedEstimateMs) * 100));
  const estimatedRemainingMs = Math.max(0, storedEstimateMs - loadingElapsedMs);
  const loadingCards = Array.from({ length: 4 }, (_, index) => index);

  const formatRelativeTimeTamil = (value) => {
    if (!value) return "இப்போது";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "இப்போது";

    const diffMs = Date.now() - date.getTime();
    if (diffMs <= 0) return "இப்போது";

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;
    const year = 365 * day;

    if (diffMs < minute) return "சற்று முன்";

    if (diffMs < hour) {
      const minutes = Math.floor(diffMs / minute);
      return `${minutes} நிமிடங்களுக்கு முன்`;
    }

    if (diffMs < day) {
      const hours = Math.floor(diffMs / hour);
      return `${hours} மணி நேரம் முன்`;
    }

    if (diffMs < month) {
      const days = Math.floor(diffMs / day);
      return `${days} நாள் முன்`;
    }

    if (diffMs < year) {
      const months = Math.floor(diffMs / month);
      return `${months} மாதம் முன்`;
    }

    const years = Math.floor(diffMs / year);
    return `${years} ஆண்டு முன்`;
  };

  return (
    <div className="newsbund-admin-shell">
      <main className="newsbund-main">
        <section className="newsbund-hero">
          <div className="newsbund-hero-top">
            <div className="newsbund-hero-brand">
              <img src={logo} alt="Tamilaka News Admin" className="newsbund-hero-logo" />
              <span className="newsbund-kicker">
                <FiGrid />
                Raw News Library
              </span>
            </div>

            <div className="newsbund-toolbar">
              <div className="newsbund-stats">
                <div className="newsbund-stat-card">
                  <span className="newsbund-stat-label">காண்பிக்கப்படும் செய்திகள்</span>
                  <strong>{filteredNews.length}</strong>
                </div>
                <div className="newsbund-stat-card">
                  <span className="newsbund-stat-label">படத்துடன்</span>
                  <strong>{featuredCount}</strong>
                </div>
              </div>

              <div className="newsbund-filter-panel">
                <label htmlFor="newsbund-category" className="newsbund-filter-label">
                  Filter by category
                </label>
                <select
                  id="newsbund-category"
                  className="newsbund-filter-select"
                  value={activeCategory}
                  onChange={(event) => setActiveCategory(event.target.value)}
                >
                  <option value="all">All categories</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="newsbund-hero-actions">
              <Link
                className="newsbund-primary-btn"
                to="/Newsupload"
                onClick={() => dispatch(setCurrentNews(null))}
              >
                <FiPlus />
                Upload News
              </Link>
              <Link className="newsbund-secondary-btn" to="/newspage-edit">
                <FiLayers />
                Newspage Edit
              </Link>
            </div>
          </div>
        </section>

        <section className="newsbund-grid-section">
          {isLoadingNews ? (
            <div className="newsbund-loading-shell">
              <div className="newsbund-loading-card">
                <div className="newsbund-loading-copy">
                  <span className="newsbund-loading-pill">
                    <FiLoader className="newsbund-loading-spinner" />
                    Loading news from database
                  </span>
                  <h3>Fetching the latest stories for your raw news library</h3>
                  <p>
                    Estimated load time: {(storedEstimateMs / 1000).toFixed(1)}s
                    {estimatedRemainingMs > 0
                      ? ` • About ${(estimatedRemainingMs / 1000).toFixed(1)}s remaining`
                      : " • Finalizing stories..."}
                  </p>
                </div>

                <div className="newsbund-loading-meter">
                  <div
                    className="newsbund-loading-meter-fill"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>

                <div className="newsbund-loading-meta">
                  <span>
                    <FiClock />
                    {Math.max(0.2, loadingElapsedMs / 1000).toFixed(1)}s elapsed
                  </span>
                  <span>{loadingProgress}% prepared</span>
                </div>
              </div>

              <div className="newsbund-grid newsbund-grid-skeleton">
                {loadingCards.map((card) => (
                  <div key={card} className="newsbund-skeleton-card">
                    <div className="newsbund-skeleton-media" />
                    <div className="newsbund-skeleton-shell">
                      <div className="newsbund-skeleton-row newsbund-skeleton-row--sm" />
                      <div className="newsbund-skeleton-row newsbund-skeleton-row--lg" />
                      <div className="newsbund-skeleton-row newsbund-skeleton-row--md" />
                      <div className="newsbund-skeleton-actions">
                        <div className="newsbund-skeleton-btn" />
                        <div className="newsbund-skeleton-btn newsbund-skeleton-btn--small" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="newsbund-empty-state">
              <h3>{allNews.length === 0 ? "No news yet" : "No matching news found"}</h3>
              <p>
                {allNews.length === 0
                  ? 'Start by clicking "Upload News" and your stories will appear here.'
                  : `There are no stories under "${activeCategoryLabel}" right now.`}
              </p>
            </div>
          ) : (
            <div className="newsbund-grid">
              {visibleNews.map((news) => {
                const thumb = getThumbnail(news?.data?.thumbnail) || luffy;
                const categoryList = getCategoryList(news);
                const primaryTag = categoryList[0] || "General";

                return (
                  <article
                    key={news._id || news.id}
                    className="newsbund-card"
                    onClick={() => {
                      dispatch(setCurrentNews(news));
                      navigate("/Newsupload");
                    }}
                  >
                    <div className="newsbund-card-media">
                      <img src={thumb} alt={news?.data?.headline || "News thumbnail"} />
                      <div className="newsbund-card-overlay" />
                    </div>

                    <div className="newsbund-card-shell">
                      <div className="newsbund-card-topline">
                        <span className="newsbund-card-tag">{primaryTag}</span>
                        <span className="newsbund-card-time">
                          {formatRelativeTimeTamil(news?.updatedAt || news?.createdAt || news?.time)}
                        </span>
                      </div>

                      <div className="newsbund-card-copy">
                        <h3>{news?.data?.headline || "Untitled News"}</h3>
                      </div>

                      <div className="newsbund-card-actions">
                        <button
                          type="button"
                          className="newsbund-card-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/preview/${news.id}`);
                          }}
                        >
                          <FiEye />
                          Preview
                        </button>

                        <button
                          type="button"
                          className="newsbund-card-btn is-danger is-small"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (window.confirm("Are you sure you want to delete this news?")) {
                              const apiId = news._id || news.id;
                              deleteNewsApi(apiId)
                                .then(() => {
                                  dispatch(deleteNews(news.id));
                                })
                                .catch((error) => {
                                  console.error("Failed to delete news:", error);
                                  alert("Failed to delete news. Check the server and try again.");
                                });
                            }
                          }}
                        >
                          <FiTrash2 />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
