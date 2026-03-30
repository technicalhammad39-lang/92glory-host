'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';

export default function AdminBanners() {
  const { token } = useAuthStore();
  const [banners, setBanners] = useState<any[]>([]);
  const [form, setForm] = useState({ image: '', link: '', order: 0, isActive: true, placement: 'home' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    fetch('/api/banners')
      .then((res) => res.json())
      .then((data) => setBanners(data.banners || []));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/banners/${editingId}` : '/api/banners';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    setEditingId(null);
    setForm({ image: '', link: '', order: 0, isActive: true, placement: 'home' });
    load();
  };

  const handleEdit = (banner: any) => {
    setEditingId(banner.id);
    setForm({
      image: banner.image,
      link: banner.link || '',
      order: banner.order || 0,
      isActive: banner.isActive,
      placement: banner.placement || 'home'
    });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/banners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Home Banners</h1>
        <p className="text-gray-400 text-sm">Manage home slider banners.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="/banner 1.png"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
          />
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="https://link"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
          />
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Order"
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
          />
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={form.placement}
            onChange={(e) => setForm({ ...form, placement: e.target.value })}
          >
            <option value="home">home</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">Active</label>
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        </div>
        <button onClick={submit} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold">
          {editingId ? 'Update Banner' : 'Add Banner'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative aspect-[21/9]">
              <Image src={banner.image} alt="banner" fill sizes="(max-width: 1024px) 100vw, 420px" className="object-cover" />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">{banner.image}</p>
                <p className="text-xs text-gray-400">Order {banner.order}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(banner)} className="text-xs font-bold text-accent-purple">Edit</button>
                <button onClick={() => handleDelete(banner.id)} className="text-xs font-bold text-red-500">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
