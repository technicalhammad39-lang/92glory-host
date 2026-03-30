'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function AccountDetailPage() {
  const params = useParams<{ slug: string }>();
  const [content, setContent] = useState<{ title: string; content: string } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const { token } = useAuthStore();

  useEffect(() => {
    let ignore = false;

    const loadContent = async () => {
      try {
        const res = await fetch('/api/content-pages');
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!data || ignore) return;
        const page = (data.pages || []).find((p: any) => p.slug === params.slug);
        if (page) setContent({ title: page.title, content: page.content });
      } catch {
        // Keep fallback state on transient/API errors.
      }
    };

    loadContent();
    return () => {
      ignore = true;
    };
  }, [params.slug]);

  useEffect(() => {
    if (!token) return;
    if (params.slug === 'transaction' || params.slug === 'game-history') {
      fetch('/api/transactions', { headers: { Authorization: `Bearer ${token}` } })
        .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
        .then((data) => setTransactions(data?.transactions || []))
        .catch(() => setTransactions([]));
    }
  }, [params.slug, token]);

  const formatAmount = (value: number) => {
    return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const amountColor = (type: string) => {
    const upper = String(type || '').toUpperCase();
    if (upper === 'DEPOSIT' || upper === 'GAME_WIN' || upper === 'BONUS') return 'text-green-600';
    if (upper === 'WITHDRAW' || upper === 'GAME_LOSS') return 'text-red-500';
    return 'text-gray-700';
  };

  const amountPrefix = (type: string) => {
    const upper = String(type || '').toUpperCase();
    if (upper === 'DEPOSIT' || upper === 'GAME_WIN' || upper === 'BONUS') return '+';
    if (upper === 'WITHDRAW' || upper === 'GAME_LOSS') return '-';
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBack title={content?.title || 'Details'} />
      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-sm text-gray-600 leading-relaxed">
          {content?.content || 'Details will appear here.'}
        </div>
        {(params.slug === 'transaction' || params.slug === 'game-history') && (
          <div className="mt-4 space-y-3">
            {transactions.map((trx) => (
              <div key={trx.id} className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-700">{trx.type}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(trx.createdAt).toLocaleString()}</p>
                  </div>
                  <p className={`text-sm font-black whitespace-nowrap ${amountColor(trx.type)}`}>
                    {amountPrefix(trx.type)} Rs {formatAmount(trx.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
