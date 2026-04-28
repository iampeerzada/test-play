import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { useAuth } from './utils/AuthContext';

function AdminRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
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
      <Route path="/admin" element={
         <AdminRoute>
            <Admin />
         </AdminRoute>
      } />
    </Routes>
  );
}
