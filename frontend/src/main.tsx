import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import AboutPage from "./components/AboutPage";
import ProjectsPage from "./components/ProjectsPage";
import MusicPage from "./components/MusicPage";
import BlogPostPage from "./components/BlogPostPage";
import TravelsPage from "./components/TravelsPage";
import AdminLandingPage from "./components/AdminLandingPage";
import AdminTravelsPage from "./components/AdminTravelsPage";
import AdminMusicPage from "./components/AdminMusicPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/education" element={<Navigate to="/about" replace />} />
        <Route path="/experience" element={<Navigate to="/about" replace />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/music" element={<MusicPage />} />
        <Route path="/music/:slug" element={<BlogPostPage />} />
        <Route path="/travels" element={<TravelsPage />} />
        <Route path="/admin" element={<AdminLandingPage />} />
        <Route path="/admin/travels" element={<AdminTravelsPage />} />
        <Route path="/admin/music" element={<AdminMusicPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
