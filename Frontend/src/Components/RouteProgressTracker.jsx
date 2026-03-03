import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { logProgress } from "../Api/progressApi";
import { isAuthenticated } from "../utils/auth";

const routeLabels = {
  "/": "Dashboard",
  "/AdminHome": "Dashboard",
  "/Newsbund": "Raw News",
  "/Newsupload": "News Upload",
  "/Newspaper": "Newspaper",
  "/preview": "Preview",
  "/newspage-edit": "News Page Edit",
  "/editpaper": "Edit Paper",
  "/Tryout": "Tryout",
  "/adminop": "Admin Operation"
};

const getRouteLabel = (pathname) => {
  if (routeLabels[pathname]) {
    return routeLabels[pathname];
  }
  if (pathname.startsWith("/preview/")) {
    return "Preview";
  }
  return "Page";
};

const RouteProgressTracker = () => {
  const location = useLocation();
  const lastPathRef = useRef("");

  useEffect(() => {
    if (!isAuthenticated()) return;
    if (location.pathname === "/login") return;

    const key = `${location.pathname}${location.search}`;
    if (lastPathRef.current === key) return;
    lastPathRef.current = key;

    const label = getRouteLabel(location.pathname);
    const details = `Visited ${label} (${location.pathname})`;

    logProgress({ action: "navigate", details }).catch(() => {});
  }, [location.pathname, location.search]);

  return null;
};

export default RouteProgressTracker;
