'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  is_seller: boolean;
  rating?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: (redirect?: boolean) => void;
  becomeSeller: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true
    const init = async () => {
      // Restore session from Supabase (persistSession true)
      let accessToken: string | null = null
      if (supabase) {
        try {
          const { data } = await supabase.auth.getSession()
          accessToken = data.session?.access_token || null
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[Auth] Supabase session restore failed:', e)
        }
      }
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      if (mounted && accessToken) {
        setToken(accessToken)
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser))
          } catch {}
        } else {
          // Attempt to hydrate profile from backend if missing in localStorage
          try {
            const { usersAPI } = await import('@/lib/api')
            const profileRes = await usersAPI.getProfile()
            if (profileRes.data?.data) {
              setUser({ ...profileRes.data.data, is_seller: Boolean(profileRes.data.data.is_seller) })
              localStorage.setItem('user', JSON.stringify({ ...profileRes.data.data, is_seller: Boolean(profileRes.data.data.is_seller) }))
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[Auth] Failed to auto-hydrate profile:', e)
          }
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', accessToken)
        }
      }
      if (mounted) setIsLoading(false)
    }
    init()
    return () => { mounted = false }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Hit backend login to get profile (ensures row exists and includes seller fields)
      const { authAPI } = await import('@/lib/api')
      const response = await authAPI.login({ email, password })
      const { token: accessToken, user: profile } = response.data
      if (!accessToken) throw new Error('Token tidak tersedia')
      setToken(accessToken)
      const normalizedUser: User = { ...profile, is_seller: Boolean(profile.is_seller) }
      setUser(normalizedUser)
      localStorage.setItem('token', accessToken)
      localStorage.setItem('user', JSON.stringify(normalizedUser))
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Login gagal')
    }
  }

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      // Use backend to create auth user + profile row
      const { authAPI } = await import('@/lib/api')
      await authAPI.register({ name, email, password, phone })
      // Immediately login to obtain access token + profile
      await login(email, password)
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || 'Registrasi gagal')
    }
  }

  const logout = (redirect?: boolean) => {
    if (supabase) supabase.auth.signOut().catch(() => {})
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (redirect && typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  const becomeSeller = async () => {
    const { usersAPI } = await import('@/lib/api');
    if (!user) return;
    await usersAPI.becomeSeller(user.id);
    setUser({ ...user, is_seller: true });
    localStorage.setItem('user', JSON.stringify({ ...user, is_seller: true }));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, becomeSeller, isAuthenticated: Boolean(token) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
