import { Route, Routes } from "react-router-dom";
import Download from "../pages/download";
import Media from "../pages/media";
import PressKit from "../pages/press-kit";
import Navbar from "../components/navbar";
import Landing2 from "../pages/landing2";
import TutorialsPage from "../pages/tutorials";
import TutorialsArticle from "../pages/tutorials/article";
import FaqIndex from "../pages/faq/index";
import FaqArticle from "../pages/faq/article";
import { NewsIndex, NewsPost } from "@storyteller/markdown-content";

export function App() {
  return (
    <div className="relative">
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing2 />} />
        <Route path="/download" element={<Download />} />
        <Route path="/media" element={<Media />} />
        <Route path="/media/:id" element={<Media />} />
        <Route path="/press-kit" element={<PressKit />} />
        <Route path="/tutorials" element={<TutorialsPage />} />
        <Route path="/tutorials/:slug" element={<TutorialsArticle />} />
        <Route path="/faq" element={<FaqIndex />} />
        <Route path="/faq/:slug" element={<FaqArticle />} />
        <Route path="/news" element={<NewsIndex basePath="/news" />} />
        <Route path="/news/:slug" element={<NewsPost basePath="/news" />} />
      </Routes>
    </div>
  );
}

export default App;
