'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

export function AuthBootstrap() {
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setToken(token);
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      });
  }, [setToken, setUser]);

  return null;
}
