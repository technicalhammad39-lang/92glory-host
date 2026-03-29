'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { RefreshCw, ChevronRight, Copy } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const methods = [
  { id: 'easypaisa', name: 'EASYPAISA', image: '/easypaisa.png' },
  { id: 'jazzcash', name: 'JAZZCASH', image: '/jazzcash.png' },
  { id: 'usdt', name: 'USDT', image: '/usdt.png' }
];

type TransactionItem = {
  id: string;
  type: string;
  amount: number;
  status: string;
  meta?: string | null;
  metaData?: { method?: string };
  createdAt: string;
};

export default function WithdrawPage() {
  const [selectedMethod, setSelectedMethod] = useState('jazzcash');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<TransactionItem[]>([]);
  const { token, user, setUser } = useAuthStore();
  const router = useRouter();
  const selected = methods.find((m) => m.id === selectedMethod) || methods[0];

  const authToken = useMemo(() => {
    if (token) return token;
    if (typeof window !== 'undefined') return localStorage.getItem('token');
    return null;
  }, [token]);

  const maskedContact = useMemo(() => {
    const source = (user?.phone || user?.email || '').trim();
    if (!source) return 'N/A';
    if (source.includes('@')) {
      const [left, right] = source.split('@');
      if (!left) return source;
      const prefix = left.slice(0, Math.min(2, left.length));
      return `${prefix}***@${right || ''}`;
    }
    if (source.length <= 4) return source;
    return `${source.slice(0, 3)}****${source.slice(-3)}`;
  }, [user?.phone, user?.email]);

  const formatDate = (raw: string) => {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '--';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const orderNo = (trx: TransactionItem) => {
    const datePart = formatDate(trx.createdAt).replace(/[-:\s]/g, '').slice(0, 14);
    return `${trx.type === 'WITHDRAW' ? 'WD' : 'TX'}${datePart}${trx.id.slice(-12).toUpperCase()}`;
  };

  const loadData = async () => {
    if (!authToken) return;
    const [summaryRes, historyRes] = await Promise.all([
      fetch('/api/account/summary', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store'
      }),
      fetch('/api/transactions?type=WITHDRAW&limit=5', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store'
      })
    ]);

    if (summaryRes.ok) {
      const summaryData = await summaryRes.json();
      if (summaryData?.user) setUser(summaryData.user);
    }
    if (historyRes.ok) {
      const historyData = await historyRes.json();
      setHistory(historyData.transactions || []);
    }
  };

  useEffect(() => {
    if (!authToken) {
      router.replace('/login');
      return;
    }
    loadData().catch(() => null);
  }, [authToken, router, setUser]);

  const handleWithdraw = async () => {
    if (!authToken || !amount || isSubmitting) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: 'WITHDRAW',
          amount: value,
          status: 'PENDING',
          meta: { method: selectedMethod }
        })
      });
      if (res.ok) {
        setAmount('');
        await loadData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOrderNo = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore copy failure
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
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
        <div className="gradient-bg rounded-2xl p-6 shadow-lg relative overflow-hidden">
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
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all relative ${selectedMethod === method.id ? 'border-pink-400 bg-white shadow-md' : 'border-transparent bg-white'}`}
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <Image src={method.image} alt={method.name} width={40} height={40} />
            </div>
            <span className="text-[10px] font-bold text-gray-400">{method.name}</span>
            {selectedMethod === method.id && <div className="absolute inset-0 gradient-bg opacity-10 rounded-xl" />}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
              <Image src={selected.image} alt={selected.name} width={20} height={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase">{selected.name}</p>
              <p className="text-[10px] text-gray-400">{maskedContact}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
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
          <div className="flex justify-between items-center mb-8">
            <p className="text-[10px] text-gray-400">Withdrawal amount received</p>
            <p className="text-pink-400 text-xs font-bold">Rs{amount ? Number(amount).toFixed(2) : '0.00'}</p>
          </div>
          <button
            onClick={handleWithdraw}
            disabled={isSubmitting}
            className="w-full bg-accent-purple text-white font-bold py-3 rounded-full active:scale-95 transition-transform disabled:opacity-70"
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <ul className="space-y-4">
            <InstructionItem text="Need to bet Rs0.00 to be able to withdraw" color="text-red-400" />
            <InstructionItem text="Withdraw time 00:00-23:59" />
            <InstructionItem text="In-day Remaining Withdrawal Times 3" color="text-red-400" />
            <InstructionItem text="Withdrawal amount range Rs500.00-Rs50,000.00" color="text-red-400" />
            <InstructionItem text="Please confirm your beneficial account information before withdrawing. If your information is incorrect, our company will not be liable for the amount of loss" />
            <InstructionItem text="If your beneficial information is incorrect, please contact customer service" />
          </ul>
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-4 bg-pink-400/20 rounded flex items-center justify-center">
            <div className="w-3 h-2 bg-pink-400 rounded-sm" />
          </div>
          <h3 className="text-sm font-bold">Withdrawal history</h3>
        </div>

        {history.map((trx) => (
          <div key={trx.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 mb-3">
            <div className="flex justify-between items-center mb-4">
              <div className="bg-red-500 text-white text-[10px] px-3 py-1 rounded-md font-bold">Withdraw</div>
              <span className={`text-[10px] font-bold ${trx.status === 'COMPLETED' ? 'text-teal-500' : trx.status === 'FAILED' ? 'text-red-500' : 'text-amber-500'}`}>{trx.status}</span>
            </div>
            <div className="space-y-3">
              <HistoryRow label="Balance" value={`Rs${Number(trx.amount || 0).toFixed(2)}`} valueColor="text-orange-400" />
              <HistoryRow label="Type" value={(trx.metaData?.method || selectedMethod || '').toUpperCase() || 'N/A'} />
              <HistoryRow label="Time" value={formatDate(trx.createdAt)} />
              <HistoryRow
                label="Order number"
                value={orderNo(trx)}
                showCopy
                onCopy={() => copyOrderNo(orderNo(trx))}
              />
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
            <p className="text-sm text-gray-500 text-center">No withdrawal history yet.</p>
          </div>
        )}

        <Link href="/withdraw-history" className="w-full py-3 rounded-full border border-pink-200 text-pink-400 font-medium mt-4 block text-center">
          All history
        </Link>
      </div>
    </div>
  );
}

function InstructionItem({ text, color = 'text-gray-400' }: { text: string; color?: string }) {
  return (
    <li className="flex gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
      <p className={`text-[10px] leading-relaxed ${color}`}>{text}</p>
    </li>
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

