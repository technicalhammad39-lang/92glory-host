'use client';

import React, { useCallback, useEffect, useState } from 'react';

type UserItem = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  uid?: string | null;
  balance: number;
  vipLevel: number;
  role: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applyAdjust = async () => {
    if (!editing || busy) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/wallet-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editing.id,
          mode,
          amount: value,
          reason
        })
      });
      if (!res.ok) return;
      setEditing(null);
      setAmount('');
      setReason('');
      setMode('ADD');
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">User Management</h1>
        <p className="text-gray-400 text-sm">Manual wallet add/deduct and user overview.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3 text-xs font-black text-gray-400">User</th>
              <th className="p-3 text-xs font-black text-gray-400">Balance</th>
              <th className="p-3 text-xs font-black text-gray-400">VIP</th>
              <th className="p-3 text-xs font-black text-gray-400">Role</th>
              <th className="p-3 text-xs font-black text-gray-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((usr) => (
              <tr key={usr.id} className="border-t border-gray-50">
                <td className="p-3 text-gray-700">
                  <p className="font-semibold">{usr.name || usr.uid || usr.phone || usr.email || usr.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400">{usr.phone || usr.email || '--'}</p>
                </td>
                <td className="p-3 text-gray-600">Rs {Number(usr.balance || 0).toFixed(2)}</td>
                <td className="p-3 text-gray-600">VIP{usr.vipLevel}</td>
                <td className="p-3 text-gray-600">{usr.role}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => {
                      setEditing(usr);
                      setAmount('');
                      setReason('');
                      setMode('ADD');
                    }}
                    className="text-xs font-bold text-accent-purple"
                  >
                    Adjust Wallet
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h2 className="text-sm font-black text-gray-800">
            Wallet Adjust for {editing.name || editing.uid || editing.phone || editing.email || editing.id.slice(0, 6)}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('ADD')}
              className={`px-4 py-2 rounded-full text-xs font-bold ${mode === 'ADD' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            >
              Add
            </button>
            <button
              onClick={() => setMode('DEDUCT')}
              className={`px-4 py-2 rounded-full text-xs font-bold ${mode === 'DEDUCT' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}
            >
              Deduct
            </button>
          </div>
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            placeholder="Amount"
          />
          <textarea
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full min-h-20"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
          />
          <div className="flex gap-2">
            <button onClick={applyAdjust} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold" disabled={busy}>
              {busy ? 'Saving...' : 'Apply'}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="border border-gray-200 text-gray-600 px-5 py-2 rounded-full text-sm font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

