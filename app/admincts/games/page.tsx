'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import Image from 'next/image';

export default function AdminGames() {
  const { token } = useAuthStore();
  const [games, setGames] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', category: '', image: '', provider: '', order: 0, isActive: true });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    fetch('/api/games')
      .then((res) => res.json())
      .then((data) => setGames(data.games || []));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/games/${editingId}` : '/api/games';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    setEditingId(null);
    setForm({ name: '', category: '', image: '', provider: '', order: 0, isActive: true });
    load();
  };

  const handleEdit = (game: any) => {
    setEditingId(game.id);
    setForm({
      name: game.name,
      category: game.category,
      image: game.image,
      provider: game.provider || '',
      order: game.order || 0,
      isActive: game.isActive
    });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/games/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Games</h1>
        <p className="text-gray-400 text-sm">Manage section-wise game images.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Game name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Category key (slots)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="/card1.png" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" type="number" placeholder="order" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">Active</label>
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        </div>
        <button onClick={submit} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold">
          {editingId ? 'Update Game' : 'Add Game'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game) => (
          <div key={game.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-12 rounded-md overflow-hidden">
                <Image src={game.image} alt={game.name} fill sizes="40px" className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{game.name}</p>
                <p className="text-xs text-gray-400">{game.category} • {game.provider}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(game)} className="text-xs font-bold text-accent-purple">Edit</button>
              <button onClick={() => handleDelete(game.id)} className="text-xs font-bold text-red-500">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
