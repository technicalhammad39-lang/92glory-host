'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

export function AuthBootstrap() {
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
    const clearSession = () => {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    };

    const token = localStorage.getItem('token');
    if (!token) return;
    setToken(token);

    const cachedUserRaw = localStorage.getItem('auth_user_cache');
    if (cachedUserRaw) {
      try {
        const cachedUser = JSON.parse(cachedUserRaw);
        if (cachedUser && typeof cachedUser === 'object') {
          setUser(cachedUser);
        }
      } catch {
        localStorage.removeItem('auth_user_cache');
      }
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (res.status === 401) {
          clearSession();
          return null;
        }
        if (!res.ok) {
          return null;
        }
        return data;
      })
      .then((data) => {
        if (data?.user) {
          localStorage.setItem('auth_user_cache', JSON.stringify(data.user));
          setUser(data.user);
        }
      })
      .catch(() => {
        // keep local token on transient network/db errors
      });
  }, [setToken, setUser]);

  return null;
}
