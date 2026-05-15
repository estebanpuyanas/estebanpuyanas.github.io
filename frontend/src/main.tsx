import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import EducationPage from "./components/EducationPage";
import ExperiencePage from "./components/ExperiencePage";
import ProjectsPage from "./components/ProjectsPage";
import MusicPage from "./components/MusicPage";
import BlogPostPage from "./components/BlogPostPage";
import AboutPage from "./components/AboutPage";
import TravelsPage from "./components/TravelsPage";
import AdminPage from "./components/AdminPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/education" element={<EducationPage />} />
        <Route path="/experience" element={<ExperiencePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/music" element={<MusicPage />} />
        <Route path="/music/:slug" element={<BlogPostPage />} />
        <Route path="/travels" element={<TravelsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
