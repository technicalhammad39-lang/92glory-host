'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { RefreshCw, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SubmissionSuccessPopup } from '@/components/SubmissionSuccessPopup';

type Channel = {
  id: string;
  method: string;
  title: string;
  logo: string;
  accountNumber: string;
  accountName: string;
  instructions?: string | null;
  sortOrder: number;
};

const amounts = [300, 500, 800, '1K', '2K', '3K', '5K', '8K', '10K', '20K', '30K', '50K'];

export default function DepositPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | string>(300);
  const [customAmount, setCustomAmount] = useState('');
  const [step, setStep] = useState<'SELECT' | 'CONFIRM'>('SELECT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { token, user, setUser } = useAuthStore();
  const router = useRouter();

  const authToken = useMemo(() => {
    if (token) return token;
    if (typeof window !== 'undefined') return localStorage.getItem('token');
    return null;
  }, [token]);

  const loadInitial = async () => {
    if (!authToken) return;
    const [channelRes, summaryRes] = await Promise.all([
      fetch('/api/deposit-channels', { cache: 'no-store' }),
      fetch('/api/account/summary', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store'
      })
    ]);

    if (channelRes.ok) {
      const channelData = await channelRes.json();
      const list = (channelData.channels || []).slice(0, 3);
      setChannels(list);
      if (!selectedChannelId && list[0]) setSelectedChannelId(list[0].id);
    }

    if (summaryRes.ok) {
      const summaryData = await summaryRes.json();
      if (summaryData?.user) setUser(summaryData.user);
    }
  };

  useEffect(() => {
    if (!authToken) {
      router.replace('/login');
      return;
    }
    loadInitial().catch(() => null);
  }, [authToken, router, setUser]);

  const amountValue = customAmount
    ? Number(customAmount)
    : Number(String(selectedAmount).replace('K', '000'));

  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) || null;

  const continueToConfirm = () => {
    if (!selectedChannel) return;
    if (!Number.isFinite(amountValue) || amountValue <= 0) return;
    setStep('CONFIRM');
  };

  const submitDepositRequest = async () => {
    if (!authToken || !selectedChannel || !Number.isFinite(amountValue) || amountValue <= 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/deposit-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          channelId: selectedChannel.id,
          amount: amountValue
        })
      });
      if (!res.ok) return;
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/deposit-history');
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const channelCard = (channel: Channel) => {
    const active = selectedChannelId === channel.id;
    const isUsdt = channel.method === 'USDT';
    return (
      <button
        key={channel.id}
        onClick={() => setSelectedChannelId(channel.id)}
        className={`relative p-2 rounded-2xl border-2 transition-all min-w-[90px] bg-white ${active ? 'border-pink-400 shadow-sm' : 'border-transparent'}`}
      >
        <div className={`relative mx-auto ${isUsdt ? 'w-12 h-12' : 'w-14 h-14'}`}>
          <Image src={channel.logo} alt={channel.title} fill className="object-contain" />
        </div>
        {isUsdt && <p className="text-[10px] font-bold text-gray-500 mt-1">USDT</p>}
      </button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <SubmissionSuccessPopup
        open={showSuccess}
        title="Request Submitted"
        subtitle="Your deposit request is pending admin approval."
      />

      <div className="bg-white">
        <Header
          showBack
          title="Deposit"
          rightElement={
            <Link href="/deposit-history" className="text-xs text-gray-500">
              Deposit history
            </Link>
          }
        />
      </div>

      <div className="px-4 py-4">
        <div className="gradient-bg rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-sm" />
            <span className="text-white/80 text-xs">Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">Rs{Number(user?.balance || 0).toFixed(2)}</span>
            <button onClick={() => loadInitial()} className="text-white/80" aria-label="Refresh balance">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {step === 'SELECT' && (
        <>
          <div className="px-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EEF1F8]">
              <h3 className="text-sm font-bold mb-3">Select payment channel</h3>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">{channels.map(channelCard)}</div>
            </div>
          </div>

          <div className="px-4 mt-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EEF1F8]">
              <h3 className="text-sm font-bold mb-3">Deposit amount</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {amounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className={`py-2 rounded-lg border text-xs font-bold transition-all ${selectedAmount === amount ? 'border-pink-400 text-pink-400 bg-pink-50' : 'border-gray-100 text-gray-400'}`}
                  >
                    Rs {amount}
                  </button>
                ))}
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 font-bold">Rs</div>
                <input
                  type="number"
                  placeholder="Rs300.00 - Rs50,000.00"
                  className="w-full bg-gray-50 rounded-xl py-4 pl-12 pr-10 text-sm outline-none border border-gray-100"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
                <button onClick={() => setCustomAmount('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                  <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px]">x</div>
                </button>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-white p-4 border-t border-gray-100 z-50">
            <button
              onClick={continueToConfirm}
              className="w-full h-12 rounded-full bg-gradient-to-r from-[#6D8CF6] to-[#E284EA] text-white text-lg font-bold flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {step === 'CONFIRM' && selectedChannel && (
        <>
          <div className="px-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EEF1F8]">
              <h3 className="text-sm font-bold mb-4">Channel details</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-14 h-14">
                  <Image src={selectedChannel.logo} alt={selectedChannel.title} fill className="object-contain" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[#101E44]">{selectedChannel.title}</p>
                  <p className="text-xs text-[#6D7C9F]">{selectedChannel.method}</p>
                </div>
              </div>
              <div className="space-y-2 rounded-xl bg-[#F7F8FD] p-3 border border-[#ECEFFA]">
                <p className="text-xs text-[#6D7C9F]">
                  Account number: <span className="text-[#101E44] font-semibold">{selectedChannel.accountNumber}</span>
                </p>
                <p className="text-xs text-[#6D7C9F]">
                  Account holder: <span className="text-[#101E44] font-semibold">{selectedChannel.accountName}</span>
                </p>
                <p className="text-xs text-[#6D7C9F]">
                  Deposit amount: <span className="text-[#101E44] font-semibold">Rs{amountValue.toFixed(2)}</span>
                </p>
              </div>
              {selectedChannel.instructions && (
                <p className="text-xs text-[#5B6788] leading-relaxed mt-3">{selectedChannel.instructions}</p>
              )}
            </div>
          </div>

          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-white p-4 border-t border-gray-100 z-50 flex gap-2">
            <button onClick={() => setStep('SELECT')} className="flex-1 h-12 rounded-full border border-[#D58AF2] text-[#C26DE9] font-bold">
              Back
            </button>
            <button
              onClick={submitDepositRequest}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-full bg-gradient-to-r from-[#6D8CF6] to-[#E284EA] text-white font-bold disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

