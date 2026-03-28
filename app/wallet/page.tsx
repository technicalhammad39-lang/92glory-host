'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Wallet as WalletIcon, RefreshCw, ArrowUpCircle, ArrowDownCircle, History, FileText } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';

export default function WalletPage() {
  const { user } = useAuthStore();
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFBFE] pb-20">
      <div className="w-full rounded-b-[22px] bg-gradient-to-r from-[#6D8CF6] to-[#DB7BE8] pt-7 pb-20 px-4 overflow-hidden">
        <Header transparent dark showBack title="Wallet" />
        
        <div className="flex flex-col items-center mt-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-2">
            <WalletIcon className="w-10 h-10 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-white">Rs{(user?.balance || 0).toFixed(2)}</span>
            <RefreshCw className="w-5 h-5 text-white/80" />
          </div>
          <p className="text-white/80 text-xs mt-1">Total balance</p>
          
          <div className="flex gap-12 mt-6">
            <div className="text-center">
              <p className="text-white font-bold text-lg">43300</p>
              <p className="text-white/60 text-[10px]">Total amount</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">19900</p>
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
                <span className="text-sm font-bold">0%</span>
              </div>
              <p className="text-xs font-bold">Rs0.00</p>
              <p className="text-[10px] text-gray-400">Main wallet</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full border-4 border-pink-400 flex items-center justify-center relative">
                <span className="text-sm font-bold">100%</span>
              </div>
              <p className="text-xs font-bold">Rs18.54</p>
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
          <p className="text-pink-500 font-bold text-sm">18.54</p>
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
