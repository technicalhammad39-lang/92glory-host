'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';

type TransactionRow = {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  userId: string;
  user?: {
    phone?: string | null;
    uid?: string | null;
    email?: string | null;
    name?: string | null;
  } | null;
  meta?: {
    method?: string;
    methodLabel?: string;
    merchantAccountNumber?: string;
    merchantAccountName?: string;
    screenshotUrl?: string;
    accountTitle?: string;
    accountNumber?: string;
    accountName?: string;
    usdtAddress?: string;
    transactionRef?: string;
    adminAction?: {
      status?: string;
      reason?: string;
      at?: string;
      adminId?: string;
    };
  } | null;
};

function toStatusLabel(status: string) {
  const upper = String(status || '').toUpperCase();
  if (upper === 'COMPLETED') return 'Approved';
  if (upper === 'FAILED') return 'Rejected';
  if (upper === 'PROCESSING') return 'Processing';
  return 'Pending';
}

function toStatusClass(status: string) {
  const upper = String(status || '').toUpperCase();
  if (upper === 'COMPLETED') return 'text-green-600 bg-green-50 border-green-100';
  if (upper === 'FAILED') return 'text-red-600 bg-red-50 border-red-100';
  if (upper === 'PROCESSING') return 'text-amber-600 bg-amber-50 border-amber-100';
  return 'text-purple-600 bg-purple-50 border-purple-100';
}

export default function AdminApprovalsPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [typeFilter, setTypeFilter] = useState<'DEPOSIT' | 'WITHDRAW'>(() => {
    if (typeof window === 'undefined') return 'DEPOSIT';
    const params = new URLSearchParams(window.location.search);
    const type = String(params.get('type') || '').toUpperCase();
    return type === 'WITHDRAW' ? 'WITHDRAW' : 'DEPOSIT';
  });
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(() => {
    const query = new URLSearchParams();
    query.set('type', typeFilter);
    if (statusFilter !== 'ALL') query.set('status', statusFilter);

    fetch(`/api/transactions?${query.toString()}`, { credentials: 'include', cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || 'Unable to load approvals.');
        }
        return data;
      })
      .then((data) => {
        setLoadError('');
        setTransactions(data.transactions || []);
      })
      .catch((error) => {
        setLoadError(error?.message || 'Unable to load approvals.');
        setTransactions([]);
      });
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const pending = transactions.filter((trx) => trx.status === 'PENDING').length;
    const approved = transactions.filter((trx) => trx.status === 'COMPLETED').length;
    const rejected = transactions.filter((trx) => trx.status === 'FAILED').length;
    return { pending, approved, rejected };
  }, [transactions]);

  const updateStatus = async (id: string, status: 'COMPLETED' | 'FAILED') => {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setLoadError(data?.error || 'Unable to update status.');
      return;
    }
    setLoadError('');
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Approvals</h1>
        <p className="text-gray-400 text-sm">Deposit and withdraw approvals with full user details.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTypeFilter('DEPOSIT');
              setExpandedId(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black ${typeFilter === 'DEPOSIT' ? 'bg-accent-purple text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            Deposit approvals
          </button>
          <button
            onClick={() => {
              setTypeFilter('WITHDRAW');
              setExpandedId(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black ${typeFilter === 'WITHDRAW' ? 'bg-accent-purple text-white' : 'bg-gray-100 text-gray-500'}`}
          >
            Withdraw approvals
          </button>
          <button
            onClick={() => setStatusFilter((prev) => (prev === 'ALL' ? 'PENDING' : 'ALL'))}
            className="ml-auto px-4 py-2 rounded-xl text-xs font-black bg-gray-100 text-gray-600"
          >
            {statusFilter === 'ALL' ? 'Only pending' : 'Show all'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-2">
            <p className="text-[10px] text-purple-700 font-bold">Pending</p>
            <p className="text-sm font-black text-purple-700">{counts.pending}</p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2">
            <p className="text-[10px] text-green-700 font-bold">Approved</p>
            <p className="text-sm font-black text-green-700">{counts.approved}</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
            <p className="text-[10px] text-red-700 font-bold">Rejected</p>
            <p className="text-sm font-black text-red-700">{counts.rejected}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loadError ? (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-3 text-xs font-semibold">{loadError}</div>
        ) : null}

        {transactions.map((trx) => {
          const isExpanded = expandedId === trx.id;
          return (
            <div key={trx.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-gray-800">
                    Rs {Number(trx.amount || 0).toLocaleString('en-US')}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{trx.type}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(trx.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${toStatusClass(trx.status)}`}>
                  {toStatusLabel(trx.status)}
                </span>
              </div>

              <button
                onClick={() => setExpandedId(isExpanded ? null : trx.id)}
                className="mt-3 w-full rounded-xl border border-gray-100 bg-gray-50 py-2 px-3 text-xs font-bold text-gray-600 flex items-center justify-center gap-1"
              >
                {isExpanded ? 'Hide details' : 'Open details'}
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isExpanded && (
                <div className="mt-3 rounded-xl border border-gray-100 p-3">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <p className="text-gray-500">User</p>
                    <p className="text-gray-700 font-semibold text-right">{trx.user?.name || '-'}</p>
                    <p className="text-gray-500">Phone</p>
                    <p className="text-gray-700 font-semibold text-right break-all">{trx.user?.phone || '-'}</p>
                    <p className="text-gray-500">UID</p>
                    <p className="text-gray-700 font-semibold text-right">{trx.user?.uid || '-'}</p>
                    <p className="text-gray-500">Email</p>
                    <p className="text-gray-700 font-semibold text-right break-all">{trx.user?.email || '-'}</p>
                    <p className="text-gray-500">Channel</p>
                    <p className="text-gray-700 font-semibold text-right">{trx.meta?.methodLabel || trx.meta?.method || '-'}</p>

                    {trx.type === 'DEPOSIT' ? (
                      <>
                        <p className="text-gray-500">Merchant account</p>
                        <p className="text-gray-700 font-semibold text-right break-all">{trx.meta?.merchantAccountNumber || '-'}</p>
                        <p className="text-gray-500">Merchant name</p>
                        <p className="text-gray-700 font-semibold text-right break-all">{trx.meta?.merchantAccountName || '-'}</p>
                        <p className="text-gray-500">Txn reference</p>
                        <p className="text-gray-700 font-semibold text-right break-all">{trx.meta?.transactionRef || '-'}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500">Account title</p>
                        <p className="text-gray-700 font-semibold text-right break-all">{trx.meta?.accountTitle || '-'}</p>
                        <p className="text-gray-500">Account no/address</p>
                        <p className="text-gray-700 font-semibold text-right break-all">{trx.meta?.accountNumber || trx.meta?.usdtAddress || '-'}</p>
                        <p className="text-gray-500">Account name</p>
                        <p className="text-gray-700 font-semibold text-right break-all">{trx.meta?.accountName || '-'}</p>
                      </>
                    )}
                  </div>

                  {trx.type === 'DEPOSIT' && trx.meta?.screenshotUrl && (
                    <a href={trx.meta.screenshotUrl} target="_blank" rel="noreferrer" className="block mt-3">
                      <p className="text-[11px] font-bold text-gray-600 mb-2">Payment screenshot</p>
                      <div className="relative w-36 h-36 rounded-lg overflow-hidden border border-gray-100">
                        <Image src={trx.meta.screenshotUrl} alt="Payment proof" fill sizes="144px" className="object-cover" />
                      </div>
                    </a>
                  )}

                  {trx.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-3 mt-4">
                      <button onClick={() => updateStatus(trx.id, 'FAILED')} className="text-xs font-bold text-red-500">
                        Reject
                      </button>
                      <button onClick={() => updateStatus(trx.id, 'COMPLETED')} className="text-xs font-bold text-green-600">
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!transactions.length && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500">No approvals found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
