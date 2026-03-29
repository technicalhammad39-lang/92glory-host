'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { useAuthStore } from '@/lib/store';
import { Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

type DepositRequest = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  adminNote?: string | null;
  channel: {
    method: string;
    title: string;
  };
};

export default function DepositHistoryPage() {
  const { token } = useAuthStore();
  const [requests, setRequests] = useState<DepositRequest[]>([]);
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
    fetch('/api/deposit-requests', {
      headers: { Authorization: `Bearer ${authToken}` },
      cache: 'no-store'
    })
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((data) => setRequests(data.requests || []))
      .catch(() => setRequests([]));
  }, [authToken, router]);

  const formatDate = (raw: string) => {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '--';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const orderNo = (item: DepositRequest) => {
    const datePart = formatDate(item.createdAt).replace(/[-:\s]/g, '').slice(0, 14);
    return `DP${datePart}${item.id.slice(-12).toUpperCase()}`;
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
      <Header showBack title="Deposit History" />
      <div className="p-4 space-y-3">
        {requests.map((item) => {
          const order = orderNo(item);
          return (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
              <div className="flex justify-between items-center mb-4">
                <div className="bg-blue-500 text-white text-[10px] px-3 py-1 rounded-md font-bold">Deposit</div>
                <span
                  className={`text-[10px] font-bold ${
                    item.status === 'APPROVED' ? 'text-teal-500' : item.status === 'REJECTED' ? 'text-red-500' : 'text-amber-500'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="space-y-3">
                <HistoryRow label="Balance" value={`Rs${Number(item.amount || 0).toFixed(2)}`} valueColor="text-blue-500" />
                <HistoryRow label="Type" value={item.channel?.method || item.channel?.title || 'N/A'} />
                <HistoryRow label="Time" value={formatDate(item.createdAt)} />
                <HistoryRow label="Order number" value={order} showCopy onCopy={() => copyValue(order)} />
              </div>
              {item.adminNote && <p className="text-[10px] text-gray-400 mt-3">Note: {item.adminNote}</p>}
            </div>
          );
        })}

        {requests.length === 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 text-center">
            <p className="text-sm text-gray-500">No deposit history found.</p>
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

