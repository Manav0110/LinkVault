import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import ViewPage from './pages/ViewPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/view/:id" element={<ViewPage />} />
      </Routes>
    </Router>
  );
}

export default App;