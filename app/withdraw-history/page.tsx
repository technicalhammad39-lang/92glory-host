'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Copy, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { MobileTopBar } from '@/components/MobileTopBar';

type WithdrawRequest = {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  note?: string | null;
  adminNote?: string | null;
  withdrawAccount: {
    method: string;
    title: string;
    accountNumber: string;
    accountName: string;
  };
};

type WithdrawMethodId = 'ALL' | 'EASYPAISA' | 'JAZZCASH' | 'USDT';

const methodTabs: Array<{ id: WithdrawMethodId; label: string; logo?: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'EASYPAISA', label: 'EASYPAISA', logo: '/easypaisa.png' },
  { id: 'JAZZCASH', label: 'JAZZCASH', logo: '/jazzcash.png' },
  { id: 'USDT', label: 'USDT', logo: '/usdt.png' }
] as const;

function toDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function WithdrawHistoryPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<WithdrawRequest[]>([]);
  const [method, setMethod] = useState<WithdrawMethodId>('ALL');
  const [status, setStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/withdraw-requests', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setItems(data?.requests || []))
      .finally(() => setLoading(false));
  }, [token]);

  const visible = useMemo(() => {
    return items.filter((item) => {
      const channelMethod = String(item.withdrawAccount?.method || '').toUpperCase();
      if (method !== 'ALL' && channelMethod !== method) return false;
      if (status !== 'ALL' && item.status !== status) return false;
      if (selectedDate && toDay(new Date(item.createdAt)) !== selectedDate) return false;
      return true;
    });
  }, [items, method, selectedDate, status]);

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <MobileTopBar title="Withdrawal history" />

      <div className="px-3 pt-2">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {methodTabs.map((tab) => {
            const active = tab.id === method;
            return (
              <button
                key={tab.id}
                onClick={() => setMethod(tab.id)}
                className={`h-8 px-3 rounded-md border shrink-0 flex items-center gap-2 text-[11px] ${
                  active
                    ? 'border-transparent text-white bg-gradient-to-r from-[#6d8cf6] to-[#e280eb]'
                    : 'border-[#ececf3] text-[#67769b] bg-white'
                }`}
              >
                {tab.logo ? (
                  <Image src={tab.logo} alt={tab.label} width={14} height={14} className="rounded-sm" />
                ) : (
                  <LayoutGrid className="w-3.5 h-3.5" />
                )}
                <span className="font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="h-8 bg-white rounded-md border border-[#ececf3] flex items-center justify-between px-3">
            <select
              className="w-full bg-transparent text-[12px] text-[#4f5f86] outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#7a88ab]" />
          </div>

          <div className="h-8 bg-white rounded-md border border-[#ececf3] flex items-center justify-between px-3">
            <input
              type="date"
              className="w-full bg-transparent text-[12px] text-[#4f5f86] outline-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <ChevronDown className="w-3.5 h-3.5 text-[#7a88ab]" />
          </div>
        </div>
      </div>

      <div className="px-3 pt-4 pb-6">
        {loading && <div className="text-[12px] text-[#7c8baa] px-1">Loading...</div>}
        {!loading && visible.map((item) => (
          <div key={item.id} className="bg-white rounded-md border border-[#efeff5] p-3 mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="h-6 px-3 rounded-md bg-[#ff5a5a] text-white text-[11px] flex items-center font-semibold">Withdraw</span>
              <span
                className={`text-[11px] font-semibold ${
                  item.status === 'APPROVED' ? 'text-[#15b460]' : item.status === 'REJECTED' ? 'text-[#ff5a5a]' : 'text-[#ef9f2f]'
                }`}
              >
                {item.status === 'APPROVED' ? 'Completed' : item.status}
              </span>
            </div>
            <HistoryRow label="Balance" value={`Rs${Number(item.amount || 0).toFixed(2)}`} valueColor="text-[#ff9f34]" />
            <HistoryRow label="Type" value={String(item.withdrawAccount?.method || '')} />
            <HistoryRow label="Time" value={new Date(item.createdAt).toLocaleString()} />
            <HistoryRow
              label="Order number"
              value={item.id}
              suffix={
                <button
                  onClick={() => navigator.clipboard.writeText(item.id)}
                  className="text-[#9aa8c2]"
                  aria-label="Copy order id"
                >
                  <Copy className="w-3 h-3" />
                </button>
              }
            />
            <HistoryRow label="Remarks" value={item.note || item.adminNote || '-'} />
          </div>
        ))}

        {!loading && !visible.length && (
          <div className="pt-10 flex flex-col items-center">
            <div className="w-[190px] h-[120px] relative opacity-70">
              <Image src="/wingo/assets/png/missningBg-c1f02bcd.png" alt="No data" fill sizes="190px" className="object-contain" />
            </div>
            <p className="text-[12px] text-[#a7b1cc] mt-1">No more</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryRow({
  label,
  value,
  valueColor = 'text-[#5b6a91]',
  suffix
}: {
  label: string;
  value: string;
  valueColor?: string;
  suffix?: ReactNode;
}) {
  return (
    <div className="h-6 flex items-center justify-between text-[11px]">
      <span className="text-[#7e8cab]">{label}</span>
      <span className={`flex items-center gap-1 ${valueColor}`}>{value}{suffix}</span>
    </div>
  );
}
