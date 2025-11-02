import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientAnalytics from './pages/ClientAnalytics';
import Financial from './pages/Financial';
import Software from './pages/Software';
import Sales from './pages/Sales';
import AIInsights from './pages/AIInsights';
import Reports from './pages/Reports';
import Login from './pages/Login';
import AddClient from './pages/AddClient';
import Register from './pages/Register';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/analytics" element={<ClientAnalytics />} />
          <Route path="financial" element={<Financial />} />
          <Route path="software" element={<Software />} />
          <Route path="sales" element={<Sales />} />
          <Route path="clients/add" element={<AddClient />} />
          <Route path="ai-insights" element={<AIInsights />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;