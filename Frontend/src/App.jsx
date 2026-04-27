
import './App.css'
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './Pages/Login';
import AdminHome from './Pages/AdminHome';

import Newsbund from './Pages/Newsbund';
import Templatepage from './Pages/TemplatePage/Templatepage';
import PreviewPage from './Pages/PreviewPage/PreviewPage';
import NewsPageEdit from './Pages/NewsPageEdit/NewsPageEdit';
import NewsPaperM from './Pages/Newspaper/NewsPaperM';
import Editpaper from './Pages/Editpaper/Editpaper';
import Tryout from './Tryout';
import Adminop from "./Pages/AdminOperationPage/Adminop"
import { getAllNews } from "./Api/newsApi";
import { getLayout } from "./Api/layoutApi";
import { getAdminConfig } from "./Api/adminApi";
import { getNewsPageConfig } from "./Api/newsPageApi";
import { getUsers } from "./Api/userApi";
import { setAllNews, setNewsLoaded } from "./Pages/Slice/newsformSlice.js";
import { setLayoutHydrated, setLayoutState } from "./Pages/Slice/editpaperSlice/editpaperslice.js";
import { setAdminConfig } from "./Pages/Slice/adminSlice.js";
import { setUsers } from "./Pages/Slice/userSlice.js";
import { setNewsPageConfig } from "./Pages/Slice/newspageSlice.js";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";
import PublicRoute from "./Components/PublicRoute.jsx";
import RouteProgressTracker from "./Components/RouteProgressTracker.jsx";
import { getAuthToken } from "./utils/auth";
function App() {
  const dispatch = useDispatch();
  const [authToken, setAuthToken] = useState(getAuthToken());

  useEffect(() => {
    const handleAuthChange = () => {
      setAuthToken(getAuthToken());
    };

    window.addEventListener("authChanged", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    if (!authToken) return;

    const loadInitialData = async () => {
      dispatch(setNewsLoaded(false));
      const usersPromise = getUsers();

      const [newsRes, layoutRes, adminRes, newsPageRes, usersRes] = await Promise.allSettled([
        getAllNews(),
        getLayout(),
        getAdminConfig(),
        getNewsPageConfig(),
        usersPromise
      ]);

      if (newsRes.status === "fulfilled" && Array.isArray(newsRes.value)) {
        dispatch(setAllNews(newsRes.value));
      } else {
        dispatch(setNewsLoaded(true));
      }

      if (layoutRes.status === "fulfilled" && layoutRes.value) {
        dispatch(setLayoutState(layoutRes.value));
      }
      dispatch(setLayoutHydrated());

      if (adminRes.status === "fulfilled" && adminRes.value) {
        dispatch(setAdminConfig(adminRes.value));
      }

      if (newsPageRes.status === "fulfilled" && newsPageRes.value) {
        dispatch(setNewsPageConfig(newsPageRes.value));
      }

      if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) {
        dispatch(setUsers(usersRes.value));
      }
    };

    loadInitialData();
  }, [authToken, dispatch]);


  return (
    <>
    <BrowserRouter>
      <RouteProgressTracker />
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/AdminHome"
          element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Newsbund"
          element={
            <ProtectedRoute>
              <Newsbund />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Newsupload"
          element={
            <ProtectedRoute>
              <Templatepage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Newspaper"
          element={
            <ProtectedRoute>
              <NewsPaperM />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preview/:id"
          element={
            <ProtectedRoute>
              <PreviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/newspage-edit"
          element={
            <ProtectedRoute>
              <NewsPageEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editpaper"
          element={
            <ProtectedRoute>
              <Editpaper />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Tryout"
          element={
            <ProtectedRoute>
              <Tryout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminop"
          element={
            <ProtectedRoute>
              <Adminop />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </>
    
  )
}

export default App

