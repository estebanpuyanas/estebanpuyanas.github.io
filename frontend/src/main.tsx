import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import EducationPage from './pages/EducationPage.tsx'
import ExperiencePage from './pages/ExperiencePage.tsx'
import ProjectsPage from './pages/ProjectsPage.tsx'
import MusicPage from './pages/MusicPage.tsx'
import BlogPostPage from './pages/BlogPostPage.tsx'
import AboutPage from './pages/AboutPage.tsx'
import TravelsPage from './pages/TravelsPage.tsx'

createRoot(document.getElementById('root')!).render(
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
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
