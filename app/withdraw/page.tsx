'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { RefreshCw, ChevronRight, Copy } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SubmissionSuccessPopup } from '@/components/SubmissionSuccessPopup';

const methods = [
  { id: 'EASYPAISA', name: 'EASYPAISA', image: '/easypaisa.png' },
  { id: 'JAZZCASH', name: 'JAZZCASH', image: '/jazzcash.png' },
  { id: 'USDT', name: 'USDT', image: '/usdt.png' }
];

type WithdrawAccount = {
  id: string;
  method: string;
  accountNumber: string;
  accountName: string;
  title?: string | null;
  isDefault: boolean;
};

type WithdrawRequest = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  adminNote?: string | null;
  withdrawAccount: WithdrawAccount;
};

export default function WithdrawPage() {
  const [selectedMethod, setSelectedMethod] = useState('JAZZCASH');
  const [amount, setAmount] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [accounts, setAccounts] = useState<WithdrawAccount[]>([]);
  const [history, setHistory] = useState<WithdrawRequest[]>([]);
  const [accountNameInput, setAccountNameInput] = useState('');
  const [accountNumberInput, setAccountNumberInput] = useState('');
  const { token, user, setUser } = useAuthStore();
  const router = useRouter();

  const authToken = useMemo(() => {
    if (token) return token;
    if (typeof window !== 'undefined') return localStorage.getItem('token');
    return null;
  }, [token]);

  const selected = methods.find((m) => m.id === selectedMethod) || methods[0];
  const selectedAccount = accounts.find((acc) => acc.method === selectedMethod) || null;

  const loadData = async () => {
    if (!authToken) return;
    const [summaryRes, accountsRes, historyRes] = await Promise.all([
      fetch('/api/account/summary', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store'
      }),
      fetch('/api/withdraw-accounts', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store'
      }),
      fetch('/api/withdraw-requests?limit=5', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store'
      })
    ]);

    if (summaryRes.ok) {
      const data = await summaryRes.json();
      if (data?.user) setUser(data.user);
    }
    if (accountsRes.ok) {
      const data = await accountsRes.json();
      setAccounts(data.accounts || []);
    }
    if (historyRes.ok) {
      const data = await historyRes.json();
      setHistory(data.requests || []);
    }
  };

  useEffect(() => {
    if (!authToken) {
      router.replace('/login');
      return;
    }
    loadData().catch(() => null);
  }, [authToken, router, setUser]);

  useEffect(() => {
    if (selectedAccount) {
      setAccountNameInput(selectedAccount.accountName);
      setAccountNumberInput(selectedAccount.accountNumber);
    } else {
      setAccountNameInput('');
      setAccountNumberInput('');
    }
  }, [selectedAccount]);

  const saveAccount = async () => {
    if (!authToken || !accountNameInput.trim() || !accountNumberInput.trim() || savingAccount) return;
    setSavingAccount(true);
    try {
      const res = await fetch('/api/withdraw-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          method: selectedMethod,
          accountName: accountNameInput.trim(),
          accountNumber: accountNumberInput.trim(),
          title: selected.name
        })
      });
      if (!res.ok) return;
      await loadData();
    } finally {
      setSavingAccount(false);
    }
  };

  const submitWithdraw = async () => {
    if (!authToken || !selectedAccount || isSubmitting) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/withdraw-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          withdrawAccountId: selectedAccount.id,
          amount: value
        })
      });
      if (!res.ok) return;
      setAmount('');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (raw: string) => {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '--';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const orderNo = (item: WithdrawRequest) => {
    const datePart = formatDate(item.createdAt).replace(/[-:\s]/g, '').slice(0, 14);
    return `WD${datePart}${item.id.slice(-12).toUpperCase()}`;
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <SubmissionSuccessPopup
        open={showSuccess}
        title="Request Submitted"
        subtitle="Your withdraw request is pending admin approval."
      />

      <div className="bg-white">
        <Header
          showBack
          title="Withdraw"
          rightElement={
            <Link href="/withdraw-history" className="text-xs text-gray-500">
              Withdrawal history
            </Link>
          }
        />
      </div>

      <div className="px-4 py-4">
        <div className="gradient-bg rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-sm" />
            <span className="text-white/80 text-xs">Available balance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">Rs{Number(user?.balance || 0).toFixed(2)}</span>
            <button onClick={() => loadData()} className="text-white/80" aria-label="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 grid grid-cols-3 gap-3">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all relative ${selectedMethod === method.id ? 'border-pink-400 bg-white shadow-sm' : 'border-transparent bg-white'}`}
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <Image src={method.image} alt={method.name} width={40} height={40} />
            </div>
            <span className="text-[10px] font-bold text-gray-400">{method.name}</span>
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">
        {!selectedAccount ? (
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3 border border-[#EEF1F8]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#101E44]">Add Account</p>
              <span className="text-xs text-gray-400">{selected.name}</span>
            </div>
            <input
              className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none"
              placeholder="Account holder name"
              value={accountNameInput}
              onChange={(e) => setAccountNameInput(e.target.value)}
            />
            <input
              className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none"
              placeholder="Account number"
              value={accountNumberInput}
              onChange={(e) => setAccountNumberInput(e.target.value)}
            />
            <button
              onClick={saveAccount}
              disabled={savingAccount}
              className="w-full h-11 rounded-full bg-gradient-to-r from-[#6D8CF6] to-[#E284EA] text-white font-bold disabled:opacity-70"
            >
              {savingAccount ? 'Saving...' : 'Save Account'}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#EEF1F8]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                  <Image src={selected.image} alt={selected.name} width={20} height={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase">{selected.name}</p>
                  <p className="text-[10px] text-gray-400">{selectedAccount.accountNumber}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        )}
      </div>

      {selectedAccount && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EEF1F8]">
            <div className="relative mb-4">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-pink-400 text-2xl font-bold italic">Rs</div>
              <input
                type="number"
                placeholder="0"
                className="w-full bg-transparent border-b border-gray-100 py-4 pl-12 text-2xl font-bold outline-none placeholder:text-gray-200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] text-pink-400">Withdrawable balance Rs{Number(user?.balance || 0).toFixed(2)}</p>
              <button onClick={() => setAmount(String(Number(user?.balance || 0)))} className="text-pink-400 text-xs border border-pink-400 px-4 py-0.5 rounded-full">
                All
              </button>
            </div>
            <button
              onClick={submitWithdraw}
              disabled={isSubmitting}
              className="w-full bg-accent-purple text-white font-bold py-3 rounded-full disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Withdraw'}
            </button>
          </div>
        </div>
      )}

      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-4 bg-pink-400/20 rounded flex items-center justify-center">
            <div className="w-3 h-2 bg-pink-400 rounded-sm" />
          </div>
          <h3 className="text-sm font-bold">Withdrawal history</h3>
        </div>

        {history.map((item) => {
          const currentOrder = orderNo(item);
          return (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 mb-3">
              <div className="flex justify-between items-center mb-4">
                <div className="bg-red-500 text-white text-[10px] px-3 py-1 rounded-md font-bold">Withdraw</div>
                <span
                  className={`text-[10px] font-bold ${
                    item.status === 'APPROVED' ? 'text-teal-500' : item.status === 'REJECTED' ? 'text-red-500' : 'text-amber-500'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="space-y-3">
                <HistoryRow label="Balance" value={`Rs${Number(item.amount || 0).toFixed(2)}`} valueColor="text-orange-400" />
                <HistoryRow label="Type" value={item.withdrawAccount?.method || 'N/A'} />
                <HistoryRow label="Time" value={formatDate(item.createdAt)} />
                <HistoryRow label="Order number" value={currentOrder} showCopy onCopy={() => copyText(currentOrder)} />
              </div>
            </div>
          );
        })}

        {history.length === 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100 text-center text-sm text-gray-400">
            No withdrawal history found.
          </div>
        )}

        <Link href="/withdraw-history" className="w-full py-3 rounded-full border border-pink-200 text-pink-400 font-medium mt-4 block text-center">
          All history
        </Link>
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

