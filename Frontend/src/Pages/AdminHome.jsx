import React, { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
import {
  FiCalendar,
  FiEdit3,
  FiFileText,
  FiHome,
  FiLayers,
  FiLogOut,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";
import { getProgress } from "../Api/progressApi";
import { resolveMediaUrl } from "../utils/media";
import { getStoredUser } from "../utils/auth";
import "./Adminhome.scss";

const getDisplayName = (user) =>
  user?.name || user?.username || user?.fullName || user?.email || "User";

const getDisplayMeta = (user) =>
  user?.email || user?.username || user?.role || "Logged in";

export default function AdminHome() {
  const [progressItems, setProgressItems] = useState([]);
  const [progressError, setProgressError] = useState("");
  const storedUser = useMemo(() => getStoredUser(), []);

  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      try {
        const data = await getProgress(60);
        if (!isMounted) return;
        setProgressItems(Array.isArray(data) ? data : []);
        setProgressError("");
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load progress:", error);
        setProgressError("Unable to load progress updates.");
      }
    };

    loadProgress();
    const refreshTimer = window.setInterval(loadProgress, 20000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const formatTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  };

  const formatAction = (item) => {
    switch (item.action) {
      case "news_create":
        return "Uploaded";
      case "news_update":
        return "Updated";
      default:
        return item.details || "News activity";
    }
  };

  const uploadProgressItems = useMemo(() => {
    return progressItems
      .filter(
        (item) =>
          item?.action === "news_create" ||
          item?.action === "news_update" ||
          item?.newsTitle ||
          item?.newsImage
      )
      .sort((a, b) => {
        const aTime = new Date(a?.createdAt || 0).getTime();
        const bTime = new Date(b?.createdAt || 0).getTime();
        return bTime - aTime;
      });
  }, [progressItems]);

  const progressTitle = useMemo(() => {
    return `Upload Progress (${uploadProgressItems.length})`;
  }, [uploadProgressItems.length]);

  return (
    <div className="admin-home">
      <div className="admin-sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="Tamilaka News Admin" />
          <span>Tamilaka Admin</span>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            <li className="nav-item active">
              <Link to="/admin-overview" className="nav-link">
                <FiHome className="nav-icon" />
                <span>Dashboard</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/Newsbund" className="nav-link">
                <FiFileText className="nav-icon" />
                <span>Raw News</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/editpaper" className="nav-link">
                <FiEdit3 className="nav-icon" />
                <span>Edit Paper</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/Newspaper" className="nav-link">
                <FiLayers className="nav-icon" />
                <span>Newspaper</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/adminop" className="nav-link">
                <FiTrendingUp className="nav-icon" />
                <span>Admin Operation</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="sidebar-profile">
          <div className="profile-info">
            <div className="profile-avatar">
              <FiUser />
            </div>

            <div className="profile-details">
              <div className="profile-name">{getDisplayName(storedUser)}</div>
              <div className="profile-role">{getDisplayMeta(storedUser)}</div>
            </div>
          </div>

          <div className="profile-actions">
            <Link to="/logout" className="profile-action logout">
              <FiLogOut />
            </Link>
          </div>
        </div>
      </div>

      <div className="admin-main">
        <div className="dashboard-content">
          <div className="quick-actions">
            <h2>Quick Actions</h2>

            <div className="actions-grid">
              <Link to="/Newsbund" className="action-card">
                <div className="action-icon">
                  <FiFileText />
                </div>
                <h3>Manage News</h3>
                <p>Add, edit, and organize news articles</p>
              </Link>

              <Link to="/editpaper" className="action-card">
                <div className="action-icon">
                  <FiEdit3 />
                </div>
                <h3>Edit Paper</h3>
                <p>Design and layout newspaper pages</p>
              </Link>

              <Link to="/Newspaper" className="action-card">
                <div className="action-icon">
                  <FiLayers />
                </div>
                <h3>View Newspaper</h3>
                <p>Preview and publish newspaper</p>
              </Link>
            </div>
          </div>

          <div className="progress-section">
            <h2>{progressTitle}</h2>

            {progressError && <div className="progress-empty">{progressError}</div>}

            {!progressError && uploadProgressItems.length === 0 && (
              <div className="progress-empty">No news upload progress yet.</div>
            )}

            {!progressError && uploadProgressItems.length > 0 && (
              <div className="progress-matrix">
                {uploadProgressItems.map((item) => (
                  <div key={item._id || item.id} className="progress-card">
                    <div className="progress-card-top">
                      <div>
                        <div className="progress-user">{item.userName || "Unknown"}</div>
                        <div className="progress-action">{formatAction(item)}</div>
                      </div>
                      <div className="progress-time">{formatTime(item.createdAt)}</div>
                    </div>

                    <div className="progress-news">
                      {item.newsImage ? (
                        <img
                          src={resolveMediaUrl(item.newsImage)}
                          alt={item.newsTitle || "news"}
                          className="progress-news-img"
                        />
                      ) : (
                        <div className="progress-news-img progress-news-img--placeholder">
                          <FiFileText />
                        </div>
                      )}

                      <div className="progress-news-copy">
                        <div className="progress-news-title">
                          {item.newsTitle || "Untitled news"}
                        </div>
                        <div className="progress-news-subtitle">
                          Uploaded by {item.userName || "Unknown"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="recent-activity">
            <h2>Recent Activity</h2>

            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">
                  <FiEdit3 />
                </div>
                <div className="activity-content">
                  <div className="activity-title">New article published</div>
                  <div className="activity-time">2 hours ago</div>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon">
                  <FiUser />
                </div>
                <div className="activity-content">
                  <div className="activity-title">New user registered</div>
                  <div className="activity-time">5 hours ago</div>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon">
                  <FiCalendar />
                </div>
                <div className="activity-content">
                  <div className="activity-title">Publication scheduled</div>
                  <div className="activity-time">1 day ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
