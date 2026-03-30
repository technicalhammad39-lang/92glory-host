'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Wallet as WalletIcon, RefreshCw, ArrowUpCircle, ArrowDownCircle, History, FileText } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';

type SummaryResponse = {
  summary?: {
    totalBalance: number;
    totalAmount: number;
    totalDepositAmount: number;
    totalWithdrawAmount: number;
  };
};

export default function WalletPage() {
  const { user, token } = useAuthStore();
  const [summary, setSummary] = useState({
    totalBalance: 0,
    totalAmount: 0,
    totalDepositAmount: 0,
    totalWithdrawAmount: 0
  });

  const loadSummary = useCallback(() => {
    if (!token) return;
    fetch('/api/account/summary', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data: SummaryResponse | null) => {
        setSummary({
          totalBalance: Number(data?.summary?.totalBalance || 0),
          totalAmount: Number(data?.summary?.totalAmount || 0),
          totalDepositAmount: Number(data?.summary?.totalDepositAmount || 0),
          totalWithdrawAmount: Number(data?.summary?.totalWithdrawAmount || 0)
        });
      });
  }, [token]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const mainWallet = Number(summary.totalBalance || user?.balance || 0);
  const thirdPartyWallet = 0;
  const totalWallet = mainWallet + thirdPartyWallet;
  const mainPct = totalWallet > 0 ? Math.round((mainWallet / totalWallet) * 100) : 0;
  const thirdPct = totalWallet > 0 ? Math.max(0, 100 - mainPct) : 0;

  const gameWallets = useMemo(
    () => [
      { label: 'Main wallet', value: mainWallet, active: true },
      { label: '3rd party wallet', value: thirdPartyWallet, active: false }
    ],
    [mainWallet, thirdPartyWallet]
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFBFE] pb-20">
      <div className="w-full rounded-b-[22px] bg-gradient-to-r from-[#6D8CF6] to-[#DB7BE8] pt-7 pb-20 px-4 overflow-hidden">
        <Header transparent dark showBack title="Wallet" />

        <div className="flex flex-col items-center mt-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-2">
            <WalletIcon className="w-10 h-10 text-white" />
          </div>
          <button onClick={loadSummary} className="flex items-center gap-2">
            <span className="text-3xl font-bold text-white">Rs{mainWallet.toFixed(2)}</span>
            <RefreshCw className="w-5 h-5 text-white/80" />
          </button>
          <p className="text-white/80 text-xs mt-1">Total balance</p>

          <div className="flex gap-12 mt-6">
            <div className="text-center">
              <p className="text-white font-bold text-lg">{summary.totalAmount.toFixed(2)}</p>
              <p className="text-white/60 text-[10px]">Total amount</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">{summary.totalDepositAmount.toFixed(2)}</p>
              <p className="text-white/60 text-[10px]">Total deposit amount</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8">
        <div className="bg-white rounded-2xl p-6 border border-[#EEF1F8]">
          <div className="flex justify-around mb-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
                <span className="text-sm font-bold">{mainPct}%</span>
              </div>
              <p className="text-xs font-bold">Rs{mainWallet.toFixed(2)}</p>
              <p className="text-[10px] text-gray-400">Main wallet</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full border-4 border-pink-400 flex items-center justify-center relative">
                <span className="text-sm font-bold">{thirdPct}%</span>
              </div>
              <p className="text-xs font-bold">Rs{thirdPartyWallet.toFixed(2)}</p>
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

      <div className="px-4 mt-4 grid grid-cols-2 gap-4">
        {gameWallets.map((row) => (
          <div key={row.label} className="bg-white rounded-xl p-4 border border-[#EEF1F8] relative overflow-hidden">
            {row.active ? <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#6D8CF6] to-[#E284EA] opacity-10" /> : null}
            <p className={`${row.active ? 'text-pink-500' : 'text-gray-300'} font-bold text-sm`}>{row.value.toFixed(2)}</p>
            <p className={`${row.active ? 'text-gray-500' : 'text-gray-300'} text-[10px]`}>{row.label}</p>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
