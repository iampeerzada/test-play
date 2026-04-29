import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { buildApiUrl } from '../utils/api';
import { Tv } from 'lucide-react';

export function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    let deviceId = localStorage.getItem('ifastx_device_id');
    if (!deviceId) {
       deviceId = window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2);
       localStorage.setItem('ifastx_device_id', deviceId);
    }
    try {
      const res = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, deviceId })
      });
      const data = await res.json();
      if (data.success) {
        login(data.user);
        if (data.user.role === 'admin') navigate('/admin');
        else navigate('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <Link to="/" className="flex items-center gap-2 mb-8 tv-focus rounded p-2 focus:ring-2 focus:ring-red-500">
        <Tv className="w-10 h-10 text-white" />
        <span className="text-3xl font-bold text-white tracking-wide">
          iFastX <span className="text-red-500">IPTV</span>
        </span>
      </Link>
      <div className="bg-[#0f1014] p-8 rounded-lg shadow-xl w-full max-w-sm border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Login</h2>
        {error && <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4 text-sm text-center">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-red-500 tv-focus focus:ring-2 focus:ring-red-500" 
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-red-500 tv-focus focus:ring-2 focus:ring-red-500" 
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors tv-focus focus:ring-2 focus:ring-white disabled:opacity-50 mt-4"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have an account? <Link to="/register" className="text-red-500 hover:text-red-400 tv-focus rounded px-1">Register</Link>
        </div>
      </div>
    </div>
  );
}
