'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Crown, ReceiptText } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { MobileTopBar } from '@/components/MobileTopBar';

type JackpotState = {
  setting: {
    minBetAmount: number;
    rewardAmount: number;
    validDays: number;
    isActive: boolean;
  } | null;
  current: {
    id: string;
    rewardAmount: number;
    status: 'ELIGIBLE' | 'CLAIMED' | 'EXPIRED';
    expiresAt: string | null;
  } | null;
  eligibleAmount: number;
  history: Array<{
    id: string;
    rewardAmount: number;
    status: string;
    createdAt: string;
  }>;
};

export default function SuperJackpotPage() {
  const { token } = useAuthStore();
  const [tab, setTab] = useState<'RULE' | 'WINNING'>('RULE');
  const [data, setData] = useState<JackpotState | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    fetch('/api/jackpot', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((payload) => setData(payload));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const claim = async () => {
    if (!token) return;
    const res = await fetch('/api/jackpot/claim', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(body?.error || 'Unable to claim jackpot.');
      return;
    }
    setMessage('Jackpot reward claimed successfully.');
    load();
  };

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-6">
      <MobileTopBar title="Super Jackpot" />
      <div className="px-3 pt-2">
        <div className="h-[160px] rounded-md overflow-hidden relative bg-gradient-to-r from-[#ffb86b] to-[#ffa95b] p-3 text-white">
          <p className="text-[37px] font-semibold leading-none">Super Jackpot</p>
          <p className="text-[11px] mt-2 leading-[1.2] max-w-[65%]">
            When you get the Super Jackpot in Slots, you can get additional bonus. Reward valid for {data?.setting?.validDays || 7} days.
          </p>
          <div className="absolute right-0 bottom-0 w-[150px] h-[140px]">
            <Image src="/superjackpotcat.png" alt="Super jackpot" fill sizes="150px" className="object-contain" />
          </div>
        </div>

        <button
          onClick={claim}
          disabled={data?.current?.status !== 'ELIGIBLE'}
          className={`h-8 w-full mt-2 rounded-full text-[13px] ${
            data?.current?.status === 'ELIGIBLE' ? 'text-white bg-gradient-to-r from-[#6d8cf6] to-[#e280eb]' : 'text-white/90 bg-[#bfc4d9]'
          }`}
        >
          Receive in batches
        </button>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => setTab('RULE')}
            className={`h-9 rounded-md border flex items-center justify-center gap-2 ${
              tab === 'RULE' ? 'border-transparent bg-white text-[#101d47]' : 'border-[#ececf3] bg-white text-[#7c8bad]'
            }`}
          >
            <ReceiptText className="w-4 h-4 text-[#e68cee]" />
            Rule
          </button>
          <button
            onClick={() => setTab('WINNING')}
            className={`h-9 rounded-md border flex items-center justify-center gap-2 ${
              tab === 'WINNING' ? 'border-transparent bg-white text-[#101d47]' : 'border-[#ececf3] bg-white text-[#7c8bad]'
            }`}
          >
            <Crown className="w-4 h-4 text-[#e68cee]" />
            Winning star
          </button>
        </div>

        <div className="bg-white rounded-md border border-[#efeff5] mt-2 p-3 min-h-[150px]">
          {tab === 'RULE' ? (
            <div className="text-[12px] text-[#5f6f93] leading-[1.35]">
              <p>Minimum betting required: Rs{Number(data?.setting?.minBetAmount || 0).toFixed(2)}</p>
              <p className="mt-2">Jackpot reward: Rs{Number(data?.setting?.rewardAmount || 0).toFixed(2)}</p>
              <p className="mt-2">Current eligible betting: Rs{Number(data?.eligibleAmount || 0).toFixed(2)}</p>
              <p className="mt-2">
                {data?.current
                  ? `Current status: ${data.current.status}`
                  : "You don't have a big jackpot yet, let's bet"}
              </p>
              {data?.current?.expiresAt && (
                <p className="mt-2">Expires at: {new Date(data.current.expiresAt).toLocaleString()}</p>
              )}
            </div>
          ) : data?.history?.length ? (
            <div className="space-y-2">
              {data.history.map((item) => (
                <div key={item.id} className="h-8 rounded-md border border-[#efeff5] px-2 flex items-center justify-between text-[12px]">
                  <span className="text-[#5f6f93]">{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className="text-[#101d47]">Rs{Number(item.rewardAmount || 0).toFixed(2)}</span>
                  <span className={item.status === 'CLAIMED' ? 'text-[#0fba63]' : 'text-[#f39d2c]'}>{item.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="pt-4 flex flex-col items-center">
              <div className="w-[190px] h-[120px] relative opacity-70">
                <Image src="/wingo/assets/png/missningBg-c1f02bcd.png" alt="No data" fill sizes="190px" className="object-contain" />
              </div>
              <p className="text-[13px] text-[#7181a8]">You don&apos;t have a big jackpot yet, let&apos;s bet</p>
            </div>
          )}
        </div>

        <Link
          href="/games/wingo"
          className="mt-2 h-9 rounded-full text-[15px] text-white bg-gradient-to-r from-[#6d8cf6] to-[#e280eb] flex items-center justify-center"
        >
          Go bet
        </Link>
        {message && <p className="text-[12px] text-[#d86de9] mt-2">{message}</p>}
      </div>
    </div>
  );
}
