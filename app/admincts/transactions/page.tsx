'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

type DepositRequest = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: { name?: string | null; uid?: string | null; phone?: string | null; email?: string | null };
  channel?: { method: string; title: string };
};

type WithdrawRequest = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: { name?: string | null; uid?: string | null; phone?: string | null; email?: string | null };
  withdrawAccount?: { method: string; accountNumber: string };
};

type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: { name?: string | null; uid?: string | null; phone?: string | null; email?: string | null };
};

type TabType = 'DEPOSIT' | 'WITHDRAW' | 'WALLET';

function userLabel(user?: { name?: string | null; uid?: string | null; phone?: string | null; email?: string | null }) {
  if (!user) return '--';
  return user.name || user.uid || user.phone || user.email || '--';
}

export default function AdminTransactions() {
  const [activeTab, setActiveTab] = useState<TabType>('DEPOSIT');
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(() => {
    Promise.all([
      fetch('/api/deposit-requests').then((res) => (res.ok ? res.json() : { requests: [] })),
      fetch('/api/withdraw-requests').then((res) => (res.ok ? res.json() : { requests: [] })),
      fetch('/api/transactions?limit=120').then((res) => (res.ok ? res.json() : { transactions: [] }))
    ])
      .then(([depositData, withdrawData, walletData]) => {
        setDepositRequests(depositData.requests || []);
        setWithdrawRequests(withdrawData.requests || []);
        setWalletTransactions(walletData.transactions || []);
      })
      .catch(() => {
        setDepositRequests([]);
        setWithdrawRequests([]);
        setWalletTransactions([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decideDeposit = async (id: string, decision: 'approve' | 'reject') => {
    if (busyId) return;
    setBusyId(id);
    try {
      await fetch(`/api/deposit-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });
      load();
    } finally {
      setBusyId('');
    }
  };

  const decideWithdraw = async (id: string, decision: 'approve' | 'reject') => {
    if (busyId) return;
    setBusyId(id);
    try {
      await fetch(`/api/withdraw-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });
      load();
    } finally {
      setBusyId('');
    }
  };

  const pendingCounts = useMemo(
    () => ({
      deposit: depositRequests.filter((item) => item.status === 'PENDING').length,
      withdraw: withdrawRequests.filter((item) => item.status === 'PENDING').length
    }),
    [depositRequests, withdrawRequests]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Transactions</h1>
        <p className="text-gray-400 text-sm">Approve or reject manual deposit/withdraw requests and review wallet logs.</p>
      </div>

      <div className="flex gap-2">
        <TabButton active={activeTab === 'DEPOSIT'} onClick={() => setActiveTab('DEPOSIT')}>
          Deposits ({pendingCounts.deposit} pending)
        </TabButton>
        <TabButton active={activeTab === 'WITHDRAW'} onClick={() => setActiveTab('WITHDRAW')}>
          Withdraws ({pendingCounts.withdraw} pending)
        </TabButton>
        <TabButton active={activeTab === 'WALLET'} onClick={() => setActiveTab('WALLET')}>
          Wallet Ledger
        </TabButton>
      </div>

      {activeTab === 'DEPOSIT' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3 text-xs font-black text-gray-400">User</th>
                <th className="p-3 text-xs font-black text-gray-400">Channel</th>
                <th className="p-3 text-xs font-black text-gray-400">Amount</th>
                <th className="p-3 text-xs font-black text-gray-400">Status</th>
                <th className="p-3 text-xs font-black text-gray-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {depositRequests.map((item) => (
                <tr key={item.id} className="border-t border-gray-50">
                  <td className="p-3 text-gray-700">{userLabel(item.user)}</td>
                  <td className="p-3 text-gray-700">{item.channel?.method || item.channel?.title || '--'}</td>
                  <td className="p-3 text-gray-700">Rs {Number(item.amount || 0).toFixed(2)}</td>
                  <td className="p-3 text-gray-500">{item.status}</td>
                  <td className="p-3 text-right">
                    {item.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => decideDeposit(item.id, 'approve')}
                          className="text-xs font-bold text-green-600"
                          disabled={busyId === item.id}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => decideDeposit(item.id, 'reject')}
                          className="text-xs font-bold text-red-500"
                          disabled={busyId === item.id}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'WITHDRAW' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3 text-xs font-black text-gray-400">User</th>
                <th className="p-3 text-xs font-black text-gray-400">Method</th>
                <th className="p-3 text-xs font-black text-gray-400">Amount</th>
                <th className="p-3 text-xs font-black text-gray-400">Status</th>
                <th className="p-3 text-xs font-black text-gray-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {withdrawRequests.map((item) => (
                <tr key={item.id} className="border-t border-gray-50">
                  <td className="p-3 text-gray-700">{userLabel(item.user)}</td>
                  <td className="p-3 text-gray-700">{item.withdrawAccount?.method || '--'}</td>
                  <td className="p-3 text-gray-700">Rs {Number(item.amount || 0).toFixed(2)}</td>
                  <td className="p-3 text-gray-500">{item.status}</td>
                  <td className="p-3 text-right">
                    {item.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => decideWithdraw(item.id, 'approve')}
                          className="text-xs font-bold text-green-600"
                          disabled={busyId === item.id}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => decideWithdraw(item.id, 'reject')}
                          className="text-xs font-bold text-red-500"
                          disabled={busyId === item.id}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'WALLET' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3 text-xs font-black text-gray-400">User</th>
                <th className="p-3 text-xs font-black text-gray-400">Type</th>
                <th className="p-3 text-xs font-black text-gray-400">Amount</th>
                <th className="p-3 text-xs font-black text-gray-400">Status</th>
                <th className="p-3 text-xs font-black text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {walletTransactions.map((trx) => (
                <tr key={trx.id} className="border-t border-gray-50">
                  <td className="p-3 text-gray-700">{userLabel(trx.user)}</td>
                  <td className="p-3 text-gray-700">{trx.type}</td>
                  <td className="p-3 text-gray-700">Rs {Number(trx.amount || 0).toFixed(2)}</td>
                  <td className="p-3 text-gray-500">{trx.status}</td>
                  <td className="p-3 text-gray-500">{new Date(trx.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-10 px-4 rounded-full text-xs font-bold transition-colors ${active ? 'bg-gradient-to-r from-[#6D8CF6] to-[#E284EA] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
    >
      {children}
    </button>
  );
}

