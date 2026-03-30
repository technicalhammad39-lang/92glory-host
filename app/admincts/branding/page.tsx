'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

export default function AdminBranding() {
  const { token } = useAuthStore();
  const [form, setForm] = useState({ brandName: '', announcement: '', announcementButton: '' });

  useEffect(() => {
    fetch('/api/site-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.site) {
          setForm({
            brandName: data.site.brandName || '',
            announcement: data.site.announcement || '',
            announcementButton: data.site.announcementButton || ''
          });
        }
      });
  }, []);

  const submit = async () => {
    await fetch('/api/site-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Branding & Content</h1>
        <p className="text-gray-400 text-sm">Update site name and announcement strip.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <input
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full"
          placeholder="Brand name"
          value={form.brandName}
          onChange={(e) => setForm({ ...form, brandName: e.target.value })}
        />
        <input
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full"
          placeholder="Announcement text"
          value={form.announcement}
          onChange={(e) => setForm({ ...form, announcement: e.target.value })}
        />
        <input
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full"
          placeholder="Announcement button text"
          value={form.announcementButton}
          onChange={(e) => setForm({ ...form, announcementButton: e.target.value })}
        />
        <button onClick={submit} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold">
          Save Branding
        </button>
      </div>
    </div>
  );
}
