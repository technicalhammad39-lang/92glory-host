'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

export default function AdminUsers() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [balance, setBalance] = useState('');

  const load = useCallback(() => {
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const saveBalance = async () => {
    if (!editing) return;
    await fetch(`/api/users/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ balance: Number(balance) })
    });
    setEditing(null);
    setBalance('');
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">User Management</h1>
        <p className="text-gray-400 text-sm">Manage players and balances.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3 text-xs font-black text-gray-400">Phone</th>
              <th className="p-3 text-xs font-black text-gray-400">Balance</th>
              <th className="p-3 text-xs font-black text-gray-400">VIP</th>
              <th className="p-3 text-xs font-black text-gray-400">Role</th>
              <th className="p-3 text-xs font-black text-gray-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((usr) => (
              <tr key={usr.id} className="border-t border-gray-50">
                <td className="p-3 font-bold text-gray-700">{usr.phone}</td>
                <td className="p-3 text-gray-600">Rs {usr.balance.toFixed(2)}</td>
                <td className="p-3 text-gray-600">VIP{usr.vipLevel}</td>
                <td className="p-3 text-gray-600">{usr.role}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => {
                      setEditing(usr);
                      setBalance(String(usr.balance));
                    }}
                    className="text-xs font-bold text-accent-purple"
                  >
                    Edit Balance
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h2 className="text-sm font-black text-gray-800">Update Balance for {editing.phone}</h2>
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
          <button onClick={saveBalance} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold">
            Save
          </button>
        </div>
      )}
    </div>
  );
}
