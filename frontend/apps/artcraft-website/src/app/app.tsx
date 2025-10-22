import { Route, Routes } from "react-router-dom";
import Download from "../pages/download";
import Media from "../pages/media";
import Navbar from "../components/navbar";
import Landing2 from "../pages/landing2";
import TutorialsPage from "../pages/tutorials";
import TutorialsArticle from "../pages/tutorials/article";
import FaqIndex from "../pages/faq/index";
import FaqArticle from "../pages/faq/article";

export function App() {
  return (
    <div className="relative">
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing2 />} />
        <Route path="/download" element={<Download />} />
        <Route path="/media" element={<Media />} />
        <Route path="/media/:id" element={<Media />} />
        <Route path="/tutorials" element={<TutorialsPage />} />
        <Route path="/tutorials/:slug" element={<TutorialsArticle />} />
        <Route path="/faq" element={<FaqIndex />} />
        <Route path="/faq/:slug" element={<FaqArticle />} />
      </Routes>
    </div>
  );
}

export default App;
