import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FileUploader } from './components/FileUploader.js';
import { Viewer } from './components/Viewer.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FileUploader />} />
        <Route path="/viewer" element={<Viewer />} />
      </Routes>
    </BrowserRouter>
  );
}
