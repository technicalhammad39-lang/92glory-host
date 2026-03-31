'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Gift } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { MobileTopBar } from '@/components/MobileTopBar';

type GiftClaim = {
  id: string;
  code: string;
  amount: number;
  status: string;
  createdAt: string;
};

export default function GiftPage() {
  const { token } = useAuthStore();
  const [claims, setClaims] = useState<GiftClaim[]>([]);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    fetch('/api/gifts', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setClaims(data?.claims || []));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const redeem = async () => {
    if (!token || !code.trim()) return;
    setSubmitting(true);
    const res = await fetch('/api/gifts/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code })
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setMessage(data?.error || 'Unable to redeem gift code.');
      return;
    }
    setMessage(`Gift received: Rs${Number(data?.claim?.amount || 0).toFixed(2)}`);
    setCode('');
    load();
  };

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-6">
      <MobileTopBar title="Gift" />
      <div className="px-3 pt-2">
        <div className="h-[160px] rounded-md overflow-hidden relative">
          <Image src="/gifts.webp" alt="Gift" fill sizes="420px" className="object-cover" />
        </div>

        <div className="bg-white rounded-md border border-[#efeff5] p-3 mt-2">
          <p className="text-[12px] text-[#6d7ca2]">Hi</p>
          <p className="text-[12px] text-[#6d7ca2] mt-1">We have a gift for you</p>
          <p className="text-[15px] text-[#101d47] mt-3">Please enter the gift code below</p>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Please enter gift code"
            className="h-9 w-full mt-2 rounded-full bg-[#f5f5f9] border border-[#ececf3] px-4 text-[13px] outline-none text-[#55658c]"
          />

          <button
            onClick={redeem}
            disabled={submitting || !code.trim()}
            className="h-9 w-full mt-3 rounded-full text-[16px] text-white bg-gradient-to-r from-[#6d8cf6] to-[#e280eb] disabled:opacity-60"
          >
            {submitting ? 'Please wait...' : 'Receive'}
          </button>
          {message && <p className="text-[12px] text-[#d86de9] mt-2">{message}</p>}
        </div>

        <div className="bg-white rounded-md border border-[#efeff5] p-3 mt-2">
          <div className="flex items-center gap-1 text-[#101d47]">
            <Gift className="w-3.5 h-3.5 text-[#e78bec]" />
            <h3 className="text-[14px] font-semibold">History</h3>
          </div>

          {!claims.length && (
            <div className="pt-4 flex flex-col items-center">
              <div className="w-[190px] h-[120px] relative opacity-70">
                <Image src="/empty-state.svg" alt="No data" fill sizes="190px" className="object-contain" />
              </div>
              <p className="text-[12px] text-[#a7b1cc] mt-1">No data</p>
            </div>
          )}

          {claims.map((item) => (
            <div key={item.id} className="h-8 border-b border-[#f2f2f7] flex items-center justify-between text-[12px]">
              <span className="text-[#5f6f93]">{item.code}</span>
              <span className="text-[#f39d2c]">Rs{Number(item.amount || 0).toFixed(2)}</span>
              <span className={item.status === 'SUCCESS' ? 'text-[#0fba63]' : 'text-[#ff5050]'}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
