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
      .then(async (res) => {
        if (res.ok) return res.json();
        if (res.status === 401 || res.status === 403) return { unauthorized: true };
        return null;
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else if (data?.unauthorized) {
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      })
      .catch(() => {
        // Keep token on transient API/network errors.
      });
  }, [setToken, setUser]);

  return null;
}
