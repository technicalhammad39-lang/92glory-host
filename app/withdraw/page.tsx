'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { RefreshCw, ChevronRight, Copy } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';

const methods = [
  { id: 'easypaisa', name: 'EASYPAISA', image: '/easypaisa.png' },
  { id: 'jazzcash', name: 'JAZZCASH', image: '/jazzcash.png' },
  { id: 'usdt', name: 'USDT', image: '/usdt.png' },
];

export default function WithdrawPage() {
  const [selectedMethod, setSelectedMethod] = useState('jazzcash');
  const [amount, setAmount] = useState('');
  const { token, user } = useAuthStore();
  const selected = methods.find((m) => m.id === selectedMethod) || methods[0];

  const handleWithdraw = async () => {
    if (!token || !amount) return;
    await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'WITHDRAW',
        amount: Number(amount),
        status: 'PENDING',
        meta: { method: selectedMethod }
      })
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white">
        <Header showBack title="Withdraw" rightElement={<span className="text-xs text-gray-500">Withdrawal history</span>} />
      </div>

      {/* Balance Card */}
      <div className="px-4 py-4">
        <div className="gradient-bg rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-sm" />
            <span className="text-white/80 text-xs">Available balance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">Rs{(user?.balance || 0).toFixed(2)}</span>
            <RefreshCw className="w-4 h-4 text-white/80" />
          </div>
          <div className="mt-6 flex justify-between items-end">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-1 h-1 bg-white/40 rounded-full" />)}
              <span className="text-white/40 text-[10px] ml-1">**** ****</span>
            </div>
          </div>
        </div>
      </div>

      {/* Methods */}
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
            {selectedMethod === method.id && (
              <div className="absolute inset-0 gradient-bg opacity-10 rounded-xl" />
            )}
          </button>
        ))}
      </div>

      {/* Account Info */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
              <Image src={selected.image} alt={selected.name} width={20} height={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase">{selected.name}</p>
              <p className="text-[10px] text-gray-400">030****116</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      {/* Amount Input */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-pink-400 text-2xl font-bold italic">Rs</div>
            <input 
              type="text" 
              placeholder="0" 
              className="w-full bg-transparent border-b border-gray-100 py-4 pl-12 text-2xl font-bold outline-none placeholder:text-gray-200"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-[10px] text-pink-400">Withdrawable balance Rs{(user?.balance || 0).toFixed(2)}</p>
            <button className="text-pink-400 text-xs border border-pink-400 px-4 py-0.5 rounded-full">All</button>
          </div>
          <div className="flex justify-between items-center mb-8">
            <p className="text-[10px] text-gray-400">Withdrawal amount received</p>
            <p className="text-pink-400 text-xs font-bold">Rs0.00</p>
          </div>
          <button onClick={handleWithdraw} className="w-full bg-accent-purple text-white font-bold py-3 rounded-full active:scale-95 transition-transform">
            Withdraw
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <ul className="space-y-4">
            <InstructionItem text="Need to bet Rs0.00 to be able to withdraw" color="text-red-400" />
            <InstructionItem text="Withdraw time 00:00-23:59" />
            <InstructionItem text="Inday Remaining Withdrawal Times 3" color="text-red-400" />
            <InstructionItem text="Withdrawal amount range Rs500.00-Rs50,000.00" color="text-red-400" />
            <InstructionItem text="Please confirm your beneficial account information before withdrawing. If your information is incorrect, our company will not be liable for the amount of loss" />
            <InstructionItem text="If your beneficial information is incorrect, please contact customer service" />
          </ul>
        </div>
      </div>

      {/* History Section */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-4 bg-pink-400/20 rounded flex items-center justify-center">
            <div className="w-3 h-2 bg-pink-400 rounded-sm" />
          </div>
          <h3 className="text-sm font-bold">Withdrawal history</h3>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div className="bg-red-500 text-white text-[10px] px-3 py-1 rounded-md font-bold">Withdraw</div>
            <span className="text-teal-500 text-[10px] font-bold">Completed</span>
          </div>
          <div className="space-y-3">
            <HistoryRow label="Balance" value="Rs700.00" valueColor="text-orange-400" />
            <HistoryRow label="Type" value="JAZZCASH" />
            <HistoryRow label="Time" value="2025-10-20 21:..." />
            <HistoryRow label="Order number" value="WD2025102021243923341392c" showCopy />
          </div>
        </div>

        <button className="w-full py-3 rounded-full border border-pink-200 text-pink-400 font-medium mt-4">
          All history
        </button>
      </div>
    </div>
  );
}

function InstructionItem({ text, color = "text-gray-400" }: { text: string, color?: string }) {
  return (
    <li className="flex gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
      <p className={`text-[10px] leading-relaxed ${color}`}>{text}</p>
    </li>
  );
}

function HistoryRow({ label, value, valueColor = "text-gray-800", showCopy }: { label: string, value: string, valueColor?: string, showCopy?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-gray-400">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`text-[10px] font-bold ${valueColor}`}>{value}</span>
        {showCopy && <Copy className="w-3 h-3 text-gray-300" />}
      </div>
    </div>
  );
}
