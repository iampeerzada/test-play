import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiBaseUrl } from './api';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'customer';
}

interface AuthContextType {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
       try {
          setUser(JSON.parse(saved));
       } catch (e) {}
    }
  }, []);

  const login = (newUser: User) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
