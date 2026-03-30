'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useAuthStore } from '@/lib/store';

type DepositRow = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  meta?: {
    methodLabel?: string;
    method?: string;
    screenshotUrl?: string;
  } | null;
};

function toStatus(status: string) {
  const upper = String(status || '').toUpperCase();
  if (upper === 'COMPLETED') return 'Completed';
  if (upper === 'FAILED') return 'Rejected';
  if (upper === 'PROCESSING') return 'Processing';
  return 'Pending';
}

export default function DepositHistoryPage() {
  const { token } = useAuthStore();
  const [transactions, setTransactions] = useState<DepositRow[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/transactions?type=DEPOSIT', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setTransactions(data.transactions || []));
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBack title="Deposit History" />
      <div className="p-4 space-y-3">
        {transactions.map((trx) => (
          <div key={trx.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-black text-gray-800">Rs {Number(trx.amount || 0).toLocaleString('en-US')}</p>
              <p className="text-[10px] font-bold text-accent-purple">{toStatus(trx.status)}</p>
            </div>
            <p className="text-[11px] text-gray-500">{String(trx.meta?.methodLabel || trx.meta?.method || 'DEPOSIT')}</p>
            <p className="text-[10px] text-gray-400 mt-1">{new Date(trx.createdAt).toLocaleString()}</p>
          </div>
        ))}

        {!transactions.length && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500">No deposit history found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
