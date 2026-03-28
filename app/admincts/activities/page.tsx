'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import Image from 'next/image';

export default function AdminActivities() {
  const { token } = useAuthStore();
  const [activities, setActivities] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', description: '', image: '', type: 'card', order: 0, isActive: true });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    fetch('/api/activities')
      .then((res) => res.json())
      .then((data) => setActivities(data.activities || []));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/activities/${editingId}` : '/api/activities';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    setEditingId(null);
    setForm({ title: '', description: '', image: '', type: 'card', order: 0, isActive: true });
    load();
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || '',
      image: item.image,
      type: item.type,
      order: item.order || 0,
      isActive: item.isActive
    });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/activities/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Activities</h1>
        <p className="text-gray-400 text-sm">Manage activity cards and banners.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Image path" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="card">card</option>
            <option value="banner">banner</option>
          </select>
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" type="number" placeholder="order" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">Active</label>
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        </div>
        <button onClick={submit} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold">
          {editingId ? 'Update Activity' : 'Add Activity'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-12 rounded-md overflow-hidden">
                <Image src={item.image} alt={item.title} fill className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-400">{item.type}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(item)} className="text-xs font-bold text-accent-purple">Edit</button>
              <button onClick={() => handleDelete(item.id)} className="text-xs font-bold text-red-500">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
