'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import Image from 'next/image';

export default function AdminCategories() {
  const { token } = useAuthStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ key: '', name: '', icon: '', order: 0, providers: '', isActive: true });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
    const providers = form.providers ? form.providers.split(',').map((p) => p.trim()) : [];
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, providers })
    });
    setEditingId(null);
    setForm({ key: '', name: '', icon: '', order: 0, providers: '', isActive: true });
    load();
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setForm({
      key: cat.key,
      name: cat.name,
      icon: cat.icon,
      order: cat.order || 0,
      providers: cat.providers ? JSON.parse(cat.providers).join(', ') : '',
      isActive: cat.isActive
    });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Categories</h1>
        <p className="text-gray-400 text-sm">Manage home categories and tabs.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="key (slots)" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="/cat1.png" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="providers (JILI, PG)" value={form.providers} onChange={(e) => setForm({ ...form, providers: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" type="number" placeholder="order" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">Active</label>
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        </div>
        <button onClick={submit} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold">
          {editingId ? 'Update Category' : 'Add Category'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image src={cat.icon} alt={cat.name} fill className="object-contain" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{cat.name}</p>
                <p className="text-xs text-gray-400">{cat.key}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(cat)} className="text-xs font-bold text-accent-purple">Edit</button>
              <button onClick={() => handleDelete(cat.id)} className="text-xs font-bold text-red-500">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
