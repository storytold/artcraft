import { Route, Routes } from "react-router-dom";
import Download from "../pages/download";
import Navbar from "../components/navbar";
import Landing2 from "../pages/landing2";
import TutorialsPage from "../pages/tutorials";

export function App() {
  return (
    <div className="relative">
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing2 />} />
        <Route path="/download" element={<Download />} />
        <Route path="/tutorials" element={<TutorialsPage />} />
      </Routes>
    </div>
  );
}

export default App;
