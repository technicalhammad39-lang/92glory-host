'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

export default function AdminPopups() {
  const { token } = useAuthStore();
  const [popups, setPopups] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', content: '', order: 0, isActive: true });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    fetch('/api/popups')
      .then((res) => res.json())
      .then((data) => setPopups(data.popups || []));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/popups/${editingId}` : '/api/popups';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    setEditingId(null);
    setForm({ title: '', content: '', order: 0, isActive: true });
    load();
  };

  const handleEdit = (popup: any) => {
    setEditingId(popup.id);
    setForm({
      title: popup.title,
      content: popup.content,
      order: popup.order || 0,
      isActive: popup.isActive
    });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/popups/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Popups</h1>
        <p className="text-gray-400 text-sm">Manage announcement popups.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <input
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full"
          placeholder="Popup title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full min-h-[120px]"
          placeholder="Content (use line breaks)"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
        <div className="flex items-center gap-3">
          <input
            type="number"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Order"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
          />
          <label className="text-sm text-gray-600 font-medium">Active</label>
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        </div>
        <button onClick={submit} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold">
          {editingId ? 'Update Popup' : 'Add Popup'}
        </button>
      </div>

      <div className="space-y-3">
        {popups.map((popup) => (
          <div key={popup.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">{popup.title}</p>
                <p className="text-xs text-gray-400">Order {popup.order}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(popup)} className="text-xs font-bold text-accent-purple">Edit</button>
                <button onClick={() => handleDelete(popup.id)} className="text-xs font-bold text-red-500">Delete</button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 whitespace-pre-line">{popup.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
