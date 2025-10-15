import { HashRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home.js';
import { ViewerPage } from './pages/ViewerPage.js';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/viewer" element={<ViewerPage />} />
      </Routes>
    </HashRouter>
  );
}
