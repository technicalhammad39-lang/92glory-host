'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Wallet as WalletIcon, RefreshCw, ArrowUpCircle, ArrowDownCircle, History, FileText } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

type WalletSummary = {
  totalBalance: number;
  totalAmount: number;
  totalDepositAmount: number;
};

export default function WalletPage() {
  const { user, isAuthenticated, token, setUser } = useAuthStore();
  const router = useRouter();
  const [summary, setSummary] = useState<WalletSummary>({
    totalBalance: 0,
    totalAmount: 0,
    totalDepositAmount: 0
  });
  const [loadingSummary, setLoadingSummary] = useState(false);

  const authToken = useMemo(() => {
    if (token) return token;
    if (typeof window !== 'undefined') return localStorage.getItem('token');
    return null;
  }, [token]);

  const formatAmount = (value: number) =>
    value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const loadSummary = useCallback(async () => {
    if (!authToken) return;
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/account/summary', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store'
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.user) setUser(data.user);
      if (data?.summary) {
        setSummary({
          totalBalance: Number(data.summary.totalBalance || 0),
          totalAmount: Number(data.summary.totalAmount || 0),
          totalDepositAmount: Number(data.summary.totalDepositAmount || 0)
        });
      }
    } finally {
      setLoadingSummary(false);
    }
  }, [authToken, setUser]);

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!isAuthenticated && !token && !storedToken) {
      router.replace('/login');
    }
  }, [isAuthenticated, token, router]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFBFE] pb-20">
      <div className="w-full rounded-b-[22px] bg-gradient-to-r from-[#6D8CF6] to-[#DB7BE8] pt-4 pb-12 px-4 overflow-hidden">
        <Header transparent dark showBack title="Wallet" />
        
        <div className="flex flex-col items-center mt-1">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-1">
            <WalletIcon className="w-9 h-9 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[42px] leading-none font-bold text-white">Rs{formatAmount(summary.totalBalance || user?.balance || 0)}</span>
            <button onClick={loadSummary} className="text-white/85 active:rotate-180 transition-transform duration-300" aria-label="Refresh wallet summary">
              <RefreshCw className={`w-5 h-5 ${loadingSummary ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-white/85 text-sm mt-1">Total balance</p>
          
          <div className="flex gap-10 mt-3">
            <div className="text-center">
              <p className="text-white font-bold text-[34px] leading-none">Rs{formatAmount(summary.totalAmount)}</p>
              <p className="text-white/75 text-sm mt-1">Total amount</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-[34px] leading-none">Rs{formatAmount(summary.totalDepositAmount)}</p>
              <p className="text-white/75 text-sm mt-1">Total deposit amount</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl p-6 border border-[#EEF1F8]">
          <div className="flex justify-around mb-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
                <span className="text-sm font-bold">100%</span>
              </div>
              <p className="text-xs font-bold">Rs{formatAmount(summary.totalBalance || user?.balance || 0)}</p>
              <p className="text-[10px] text-gray-400">Main wallet</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full border-4 border-pink-300 flex items-center justify-center relative">
                <span className="text-sm font-bold">0%</span>
              </div>
              <p className="text-xs font-bold">Rs0.00</p>
              <p className="text-[10px] text-gray-400">3rd party wallet</p>
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-[#6D8CF6] to-[#E284EA] text-white font-bold py-3 rounded-full mb-8">
            Main wallet transfer
          </button>

          <div className="grid grid-cols-4 gap-4">
            <Link href="/deposit" className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <ArrowUpCircle className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-[10px] font-medium text-gray-500">Deposit</span>
            </Link>
            <Link href="/withdraw" className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <ArrowDownCircle className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-[10px] font-medium text-gray-500">Withdraw</span>
            </Link>
            <Link href="/deposit-history" className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <History className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-[10px] font-medium text-gray-500 text-center">Deposit history</span>
            </Link>
            <Link href="/withdraw-history" className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-[10px] font-medium text-gray-500 text-center">Withdrawal history</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Game Balance List */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#EEF1F8] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#6D8CF6] to-[#E284EA] opacity-10" />
          <p className="text-pink-500 font-bold text-sm">{formatAmount(summary.totalBalance || user?.balance || 0)}</p>
          <p className="text-gray-400 text-[10px]">ARGame</p>
        </div>
        <div className="bg-white rounded-xl p-4 flex flex-col items-center justify-center border border-[#EEF1F8]">
          <p className="text-gray-300 font-bold text-sm">0.00</p>
          <p className="text-gray-300 text-[10px]">Lottery</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
