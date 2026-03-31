'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type SupportTicket = {
  id: string;
  categoryLabel: string;
  subject: string;
  details: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  adminResponse: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    uid?: string | null;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  attachments: Array<{ id: string; url: string }>;
};

const STATUS_OPTIONS: SupportTicket['status'][] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export default function AdminSupportTicketsPage() {
  const [status, setStatus] = useState<'ALL' | SupportTicket['status']>('ALL');
  const [rows, setRows] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [responseMap, setResponseMap] = useState<Record<string, string>>({});
  const [statusMap, setStatusMap] = useState<Record<string, SupportTicket['status']>>({});

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (status !== 'ALL') qs.set('status', status);
    fetch(`/api/admin/support-tickets?${qs.toString()}`, { credentials: 'include', cache: 'no-store' })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => {
        const list: SupportTicket[] = data?.tickets || [];
        setRows(list);
        const responseDraft: Record<string, string> = {};
        const statusDraft: Record<string, SupportTicket['status']> = {};
        list.forEach((row) => {
          responseDraft[row.id] = row.adminResponse || '';
          statusDraft[row.id] = row.status;
        });
        setResponseMap(responseDraft);
        setStatusMap(statusDraft);
      })
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const counts = useMemo(() => {
    return {
      total: rows.length,
      open: rows.filter((row) => row.status === 'OPEN').length,
      inProgress: rows.filter((row) => row.status === 'IN_PROGRESS').length,
      resolved: rows.filter((row) => row.status === 'RESOLVED').length,
      rejected: rows.filter((row) => row.status === 'REJECTED').length
    };
  }, [rows]);

  const saveOne = async (id: string) => {
    setSavingId(id);
    await fetch(`/api/admin/support-tickets/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: statusMap[id],
        adminResponse: responseMap[id]
      })
    });
    setSavingId('');
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Support Tickets</h1>
        <p className="text-sm text-gray-400">Manage user self-service queries and responses.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setStatus('ALL')} className={`px-3 h-8 rounded-lg text-xs font-black ${status === 'ALL' ? 'bg-accent-purple text-white' : 'bg-gray-100 text-gray-600'}`}>All ({counts.total})</button>
          <button onClick={() => setStatus('OPEN')} className={`px-3 h-8 rounded-lg text-xs font-black ${status === 'OPEN' ? 'bg-accent-purple text-white' : 'bg-gray-100 text-gray-600'}`}>Open ({counts.open})</button>
          <button onClick={() => setStatus('IN_PROGRESS')} className={`px-3 h-8 rounded-lg text-xs font-black ${status === 'IN_PROGRESS' ? 'bg-accent-purple text-white' : 'bg-gray-100 text-gray-600'}`}>In progress ({counts.inProgress})</button>
          <button onClick={() => setStatus('RESOLVED')} className={`px-3 h-8 rounded-lg text-xs font-black ${status === 'RESOLVED' ? 'bg-accent-purple text-white' : 'bg-gray-100 text-gray-600'}`}>Resolved ({counts.resolved})</button>
          <button onClick={() => setStatus('REJECTED')} className={`px-3 h-8 rounded-lg text-xs font-black ${status === 'REJECTED' ? 'bg-accent-purple text-white' : 'bg-gray-100 text-gray-600'}`}>Rejected ({counts.rejected})</button>
        </div>
      </div>

      <div className="space-y-3">
        {loading && <div className="text-sm text-gray-500">Loading...</div>}

        {!loading && !rows.length && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-500">No support tickets found.</div>
        )}

        {rows.map((row) => (
          <div key={row.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-gray-800">{row.categoryLabel}</p>
                <p className="text-xs text-gray-500 mt-1">UID: {row.user?.uid || '-'} | Name: {row.user?.name || '-'} | Phone: {row.user?.phone || '-'}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(row.createdAt).toLocaleString()}</p>
              </div>
              <span className="px-2.5 h-7 rounded-full text-xs font-black bg-gray-100 text-gray-700 inline-flex items-center">{row.status}</span>
            </div>

            <div className="text-sm text-gray-700 whitespace-pre-wrap">{row.details}</div>

            {row.attachments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {row.attachments.map((item) => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="relative aspect-square rounded-lg border border-gray-100 overflow-hidden bg-gray-50">
                    <Image src={item.url} alt="ticket attachment" fill sizes="220px" className="object-contain" />
                  </a>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
              <select
                className="h-10 rounded-xl border border-gray-200 px-3 text-sm"
                value={statusMap[row.id] || row.status}
                onChange={(e) => setStatusMap((prev) => ({ ...prev, [row.id]: e.target.value as SupportTicket['status'] }))}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <textarea
                rows={2}
                className="md:col-span-2 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Admin response"
                value={responseMap[row.id] || ''}
                onChange={(e) => setResponseMap((prev) => ({ ...prev, [row.id]: e.target.value }))}
              />

              <button
                onClick={() => saveOne(row.id)}
                disabled={savingId === row.id}
                className="h-10 rounded-xl bg-accent-purple text-white text-sm font-bold disabled:opacity-60"
              >
                {savingId === row.id ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
