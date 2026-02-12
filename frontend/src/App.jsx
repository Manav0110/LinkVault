import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import ViewPage from './pages/ViewPage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/view/:id" element={<ViewPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
