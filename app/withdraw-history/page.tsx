'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { useAuthStore } from '@/lib/store';
import { Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

type TransactionItem = {
  id: string;
  type: string;
  amount: number;
  status: string;
  metaData?: { method?: string };
  createdAt: string;
};

export default function WithdrawHistoryPage() {
  const { token } = useAuthStore();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const router = useRouter();

  const authToken = useMemo(() => {
    if (token) return token;
    if (typeof window !== 'undefined') return localStorage.getItem('token');
    return null;
  }, [token]);

  useEffect(() => {
    if (!authToken) {
      router.replace('/login');
      return;
    }
    fetch('/api/transactions?type=WITHDRAW', {
      headers: { Authorization: `Bearer ${authToken}` },
      cache: 'no-store'
    })
      .then((res) => (res.ok ? res.json() : { transactions: [] }))
      .then((data) => setTransactions(data.transactions || []))
      .catch(() => setTransactions([]));
  }, [authToken, router]);

  const formatDate = (raw: string) => {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '--';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const orderNo = (trx: TransactionItem) => {
    const datePart = formatDate(trx.createdAt).replace(/[-:\s]/g, '').slice(0, 14);
    return `WD${datePart}${trx.id.slice(-12).toUpperCase()}`;
  };

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <Header showBack title="Withdraw History" />
      <div className="p-4 space-y-3">
        {transactions.map((trx) => {
          const order = orderNo(trx);
          return (
            <div key={trx.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
              <div className="flex justify-between items-center mb-4">
                <div className="bg-red-500 text-white text-[10px] px-3 py-1 rounded-md font-bold">Withdraw</div>
                <span className={`text-[10px] font-bold ${trx.status === 'COMPLETED' ? 'text-teal-500' : trx.status === 'FAILED' ? 'text-red-500' : 'text-amber-500'}`}>{trx.status}</span>
              </div>
              <div className="space-y-3">
                <HistoryRow label="Balance" value={`Rs${Number(trx.amount || 0).toFixed(2)}`} valueColor="text-orange-400" />
                <HistoryRow label="Type" value={(trx.metaData?.method || 'WITHDRAW').toUpperCase()} />
                <HistoryRow label="Time" value={formatDate(trx.createdAt)} />
                <HistoryRow label="Order number" value={order} showCopy onCopy={() => copyValue(order)} />
              </div>
            </div>
          );
        })}

        {transactions.length === 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
            <p className="text-sm text-gray-500 text-center">No withdrawal history found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryRow({
  label,
  value,
  valueColor = 'text-gray-800',
  showCopy,
  onCopy
}: {
  label: string;
  value: string;
  valueColor?: string;
  showCopy?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-[10px] text-gray-400">{label}</span>
      <div className="flex items-center gap-1 max-w-[65%]">
        <span className={`text-[10px] font-bold ${valueColor} text-right truncate`}>{value}</span>
        {showCopy && (
          <button onClick={onCopy} className="text-gray-300">
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

