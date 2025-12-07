import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ToastContainer, useToast as useToastHook } from './components';
import BookManagementPage from './pages/BookManagementPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import LoanManagementPage from './pages/LoanManagementPage';
import HistoryPage from './pages/HistoryPage';

const AppContent: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<BookManagementPage />} />
        <Route path="/employees" element={<EmployeeManagementPage />} />
        <Route path="/loans" element={<LoanManagementPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  const { toasts, removeToast } = useToastHook();

  return (
    <Router>
      <AppContent />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Router>
  );
};

export default App;
