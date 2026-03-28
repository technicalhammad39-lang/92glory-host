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
    fetch('/api/content-pages')
      .then((res) => (res.ok ? res.json() : { pages: [] }))
      .then((data) => {
        const page = (data.pages || []).find((p: any) => p.slug === params.slug);
        if (page) setContent({ title: page.title, content: page.content });
      })
      .catch(() => setContent(null));
  }, [params.slug]);

  useEffect(() => {
    if (!token) return;
    if (params.slug === 'transaction' || params.slug === 'game-history') {
      fetch('/api/transactions', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => (res.ok ? res.json() : { transactions: [] }))
        .then((data) => setTransactions(data.transactions || []))
        .catch(() => setTransactions([]));
    }
  }, [params.slug, token]);

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
                <p className="text-xs font-bold text-gray-700">{trx.type}</p>
                <p className="text-[10px] text-gray-400">Rs {trx.amount}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
