import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SelectRole from './pages/SelectRole';
import './styles.css';
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<SelectRole/>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
