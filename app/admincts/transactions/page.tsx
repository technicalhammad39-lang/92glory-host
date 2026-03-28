'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

export default function AdminTransactions() {
  const { token } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);

  const load = () => {
    fetch('/api/transactions', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setTransactions(data.transactions || []));
  };

  useEffect(() => {
    load();
  }, [token]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Transactions</h1>
        <p className="text-gray-400 text-sm">Approve deposits and withdrawals.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3 text-xs font-black text-gray-400">User</th>
              <th className="p-3 text-xs font-black text-gray-400">Type</th>
              <th className="p-3 text-xs font-black text-gray-400">Amount</th>
              <th className="p-3 text-xs font-black text-gray-400">Status</th>
              <th className="p-3 text-xs font-black text-gray-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((trx) => (
              <tr key={trx.id} className="border-t border-gray-50">
                <td className="p-3 text-gray-700">{trx.user?.phone || trx.userId}</td>
                <td className="p-3 text-gray-700">{trx.type}</td>
                <td className="p-3 text-gray-700">Rs {trx.amount}</td>
                <td className="p-3 text-gray-500">{trx.status}</td>
                <td className="p-3 text-right">
                  {trx.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => updateStatus(trx.id, 'COMPLETED')} className="text-xs font-bold text-green-600">Approve</button>
                      <button onClick={() => updateStatus(trx.id, 'FAILED')} className="text-xs font-bold text-red-500">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
