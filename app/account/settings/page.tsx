'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function AccountSettingsPage() {
  const { user, token, setUser } = useAuthStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    fetch('/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setName(String(data.user.name || '').trim());
        }
      })
      .catch(() => {
        setMessage('Unable to load profile right now.');
      });
  }, [router, setUser, token]);

  const uid = useMemo(() => user?.uid || user?.inviteCode || user?.id?.toUpperCase().slice(0, 10) || '-', [user]);

  const save = async () => {
    if (!token) return;
    const cleaned = name.trim();
    if (!cleaned) {
      setMessage('Username is required.');
      return;
    }

    setSaving(true);
    setMessage('');
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: cleaned })
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMessage(data?.error || 'Unable to update profile.');
      return;
    }

    setUser(data.user);
    setMessage('Username updated successfully.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBack title="Settings" />
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-gray-800 mb-2">Username</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your username"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-400">UID</p>
            <p className="text-sm font-bold text-gray-700">{uid}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Phone / Email</p>
            <p className="text-sm font-bold text-gray-700">{user?.phone || user?.email || '-'}</p>
          </div>
        </div>

        {message && <p className="text-xs font-bold text-purple-600">{message}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-gradient-to-r from-accent-purple to-purple-500 text-white rounded-full py-3 text-sm font-bold disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
