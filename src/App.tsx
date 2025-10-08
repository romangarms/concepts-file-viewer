import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home.js';
import { ViewerPage } from './pages/ViewerPage.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/viewer" element={<ViewerPage />} />
      </Routes>
    </BrowserRouter>
  );
}
