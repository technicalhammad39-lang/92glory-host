'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

type Channel = {
  id: string;
  method: string;
  title: string;
  logo: string;
  accountNumber: string;
  accountName: string;
  instructions?: string | null;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm = {
  method: 'JAZZCASH',
  title: '',
  logo: '/jazzcash.png',
  accountNumber: '',
  accountName: '',
  instructions: '',
  isActive: true,
  sortOrder: 0
};

export default function AdminDepositChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadChannels = useCallback(() => {
    fetch('/api/deposit-channels', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { channels: [] }))
      .then((data) => setChannels(data.channels || []))
      .catch(() => setChannels([]));
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const activeCount = useMemo(() => channels.filter((c) => c.isActive).length, [channels]);

  const onSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/deposit-channels/${editingId}` : '/api/deposit-channels', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sortOrder: Number(form.sortOrder || 0)
        })
      });
      if (!res.ok) return;
      setForm(emptyForm);
      setEditingId(null);
      loadChannels();
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (channel: Channel) => {
    setEditingId(channel.id);
    setForm({
      method: channel.method,
      title: channel.title,
      logo: channel.logo,
      accountNumber: channel.accountNumber,
      accountName: channel.accountName,
      instructions: channel.instructions || '',
      isActive: channel.isActive,
      sortOrder: channel.sortOrder
    });
  };

  const onDelete = async (id: string) => {
    await fetch(`/api/deposit-channels/${id}`, { method: 'DELETE' });
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
    loadChannels();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Deposit Channels</h1>
        <p className="text-gray-400 text-sm">Manage max 3 active channels for manual deposit flow.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <p className="text-xs text-gray-500">Active channels: {activeCount}/3</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-gray-600">
            Method
            <select
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={form.method}
              onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value.toUpperCase() }))}
            >
              <option value="JAZZCASH">JAZZCASH</option>
              <option value="EASYPAISA">EASYPAISA</option>
              <option value="USDT">USDT</option>
            </select>
          </label>
          <label className="text-xs text-gray-600">
            Sort order
            <input
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={form.sortOrder}
              onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value || 0) }))}
              type="number"
            />
          </label>
          <label className="text-xs text-gray-600 col-span-2">
            Title
            <input
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </label>
          <label className="text-xs text-gray-600 col-span-2">
            Logo path
            <input
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={form.logo}
              onChange={(e) => setForm((prev) => ({ ...prev, logo: e.target.value }))}
            />
          </label>
          <label className="text-xs text-gray-600">
            Account number
            <input
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={form.accountNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
            />
          </label>
          <label className="text-xs text-gray-600">
            Account name
            <input
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={form.accountName}
              onChange={(e) => setForm((prev) => ({ ...prev, accountName: e.target.value }))}
            />
          </label>
          <label className="text-xs text-gray-600 col-span-2">
            Instructions
            <textarea
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm min-h-24"
              value={form.instructions}
              onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
            />
          </label>
          <label className="text-xs text-gray-600 col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Active channel
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSubmit}
            disabled={saving}
            className="h-10 px-5 rounded-full bg-gradient-to-r from-[#6D8CF6] to-[#E284EA] text-white text-sm font-bold disabled:opacity-70"
          >
            {saving ? 'Saving...' : editingId ? 'Update Channel' : 'Add Channel'}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="h-10 px-5 rounded-full border border-gray-200 text-sm font-bold text-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3 text-xs font-black text-gray-400">Method</th>
              <th className="p-3 text-xs font-black text-gray-400">Title</th>
              <th className="p-3 text-xs font-black text-gray-400">Status</th>
              <th className="p-3 text-xs font-black text-gray-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.id} className="border-t border-gray-50">
                <td className="p-3 text-gray-700">{channel.method}</td>
                <td className="p-3 text-gray-700">{channel.title}</td>
                <td className="p-3 text-gray-500">{channel.isActive ? 'Active' : 'Inactive'}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => onEdit(channel)} className="text-xs font-bold text-accent-purple">
                      Edit
                    </button>
                    <button onClick={() => onDelete(channel.id)} className="text-xs font-bold text-red-500">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
