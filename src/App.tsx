import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Subscription } from './pages/Subscription';
import { useAuth } from './utils/AuthContext';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !['admin', 'reseller'].includes(user.role)) {
     return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/subscription" element={<Subscription />} />
      <Route path="/admin" element={
         <AdminRoute>
            <Admin />
         </AdminRoute>
      } />
    </Routes>
  );
}
