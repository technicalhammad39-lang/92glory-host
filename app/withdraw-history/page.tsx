'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useAuthStore } from '@/lib/store';

export default function WithdrawHistoryPage() {
  const { token } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/transactions?type=WITHDRAW', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : { transactions: [] }))
      .then((data) => setTransactions(data.transactions || []))
      .catch(() => setTransactions([]));
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBack title="Withdraw History" />
      <div className="p-4 space-y-3">
        {transactions.map((trx) => (
          <div key={trx.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-700">Rs {trx.amount}</p>
            <p className="text-[10px] text-gray-400">{trx.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
