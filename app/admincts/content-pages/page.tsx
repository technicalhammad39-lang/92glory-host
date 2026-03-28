'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

export default function AdminContentPages() {
  const { token } = useAuthStore();
  const [pages, setPages] = useState<any[]>([]);
  const [form, setForm] = useState({ slug: '', title: '', content: '', order: 0, isActive: true });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    fetch('/api/content-pages')
      .then((res) => res.json())
      .then((data) => setPages(data.pages || []));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/content-pages/${editingId}` : '/api/content-pages';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    setEditingId(null);
    setForm({ slug: '', title: '', content: '', order: 0, isActive: true });
    load();
  };

  const handleEdit = (page: any) => {
    setEditingId(page.id);
    setForm({
      slug: page.slug,
      title: page.title,
      content: page.content,
      order: page.order || 0,
      isActive: page.isActive
    });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/content-pages/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Content Pages</h1>
        <p className="text-gray-400 text-sm">Manage account and promotion detail pages.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" type="number" placeholder="order" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
        </div>
        <textarea className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full min-h-[120px]" placeholder="content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">Active</label>
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        </div>
        <button onClick={submit} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold">
          {editingId ? 'Update Page' : 'Add Page'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((page) => (
          <div key={page.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">{page.title}</p>
                <p className="text-xs text-gray-400">{page.slug}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(page)} className="text-xs font-bold text-accent-purple">Edit</button>
                <button onClick={() => handleDelete(page.id)} className="text-xs font-bold text-red-500">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
