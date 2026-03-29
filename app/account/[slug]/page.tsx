'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Copy } from 'lucide-react';

type TransactionItem = {
  id: string;
  type: string;
  amount: number;
  status: string;
  metaData?: { method?: string };
  createdAt: string;
};

export default function AccountDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [content, setContent] = useState<{ title: string; content: string } | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const { token } = useAuthStore();

  const authToken = useMemo(() => {
    if (token) return token;
    if (typeof window !== 'undefined') return localStorage.getItem('token');
    return null;
  }, [token]);

  const isHistorySlug = params.slug === 'transaction' || params.slug === 'game-history';

  useEffect(() => {
    if (!authToken) {
      router.replace('/login');
      return;
    }
    fetch('/api/content-pages')
      .then((res) => (res.ok ? res.json() : { pages: [] }))
      .then((data) => {
        const page = (data.pages || []).find((p: any) => p.slug === params.slug);
        if (page) setContent({ title: page.title, content: page.content });
      })
      .catch(() => setContent(null));
  }, [params.slug, authToken, router]);

  useEffect(() => {
    if (!authToken || !isHistorySlug) return;
    fetch('/api/transactions?limit=80', { headers: { Authorization: `Bearer ${authToken}` }, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { transactions: [] }))
      .then((data) => {
        const all = data.transactions || [];
        const filtered =
          params.slug === 'game-history'
            ? all.filter((trx: TransactionItem) => trx.type === 'GAME_WIN' || trx.type === 'GAME_LOSS')
            : all;
        setTransactions(filtered);
      })
      .catch(() => setTransactions([]));
  }, [params.slug, authToken, isHistorySlug]);

  const formatDate = (raw: string) => {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '--';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const orderNo = (trx: TransactionItem) => {
    const datePart = formatDate(trx.createdAt).replace(/[-:\s]/g, '').slice(0, 14);
    return `TX${datePart}${trx.id.slice(-12).toUpperCase()}`;
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
      <Header showBack title={content?.title || 'Details'} />
      <div className="p-4">
        {!isHistorySlug && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-sm text-gray-600 leading-relaxed">
            {content?.content || 'Details will appear here.'}
          </div>
        )}
        {isHistorySlug && (
          <div className="space-y-3">
            {transactions.map((trx) => {
              const isWithdraw = trx.type === 'WITHDRAW';
              const order = orderNo(trx);
              return (
                <div key={trx.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <div className={`${isWithdraw ? 'bg-red-500' : 'bg-blue-500'} text-white text-[10px] px-3 py-1 rounded-md font-bold`}>
                      {trx.type.replace('_', ' ')}
                    </div>
                    <span className={`text-[10px] font-bold ${trx.status === 'COMPLETED' ? 'text-teal-500' : trx.status === 'FAILED' ? 'text-red-500' : 'text-amber-500'}`}>
                      {trx.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <HistoryRow
                      label="Balance"
                      value={`Rs${Number(trx.amount || 0).toFixed(2)}`}
                      valueColor={isWithdraw ? 'text-orange-400' : 'text-blue-500'}
                    />
                    <HistoryRow label="Type" value={(trx.metaData?.method || trx.type).toUpperCase()} />
                    <HistoryRow label="Time" value={formatDate(trx.createdAt)} />
                    <HistoryRow label="Order number" value={order} showCopy onCopy={() => copyValue(order)} />
                  </div>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                <p className="text-sm text-gray-500 text-center">No history available.</p>
              </div>
            )}
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

