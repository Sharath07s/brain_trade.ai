import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GlobalProvider } from './context/GlobalContext';
import Layout from './layout/Layout';
import DisclaimerModal from './components/DisclaimerModal';

// Pages
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import News from './pages/News';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

function App() {
  return (
    <GlobalProvider>
      <DisclaimerModal />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard/TSLA" replace />} />
            <Route path="dashboard" element={<Navigate to="/dashboard/TSLA" replace />} />
            <Route path="dashboard/:symbol" element={<Dashboard />} />
            <Route path="markets" element={<Markets />} />
            <Route path="news" element={<News />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GlobalProvider>
  );
}

export default App;
