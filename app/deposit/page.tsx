'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { RefreshCw, ChevronRight, Info } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';

const methods = [
  { id: 'jazzcash', name: 'Jazzcash', bonus: '+2%', image: '/jazzcash.png' },
  { id: 'easypaisa', name: 'Easypaisa', bonus: '+2%', image: '/easypaisa.png' },
  { id: 'usdt', name: 'USDT', bonus: '+2%', image: '/usdt.png' },
];

const channels = [
  { id: 'epay', name: 'EPay-Jazz', range: '300 - 50K', bonus: '2% bonus' },
  { id: 'open', name: 'Open-Jazz', range: '300 - 50K', bonus: '2% bonus' },
  { id: 'ok', name: 'Ok -Jazz', range: '300 - 50K', bonus: '2% bonus' },
  { id: 'pk', name: 'Pk-Jazz', range: '300 - 50K', bonus: '2% bonus' },
  { id: 'dee', name: 'Dee-Jazz', range: '300 - 50K', bonus: '2% bonus' },
  { id: 'star', name: 'StarPago-Jazz', range: '300 - 50K', bonus: '2% bonus' },
];

const amounts = [300, 500, 800, '1K', '2K', '3K', '5K', '8K', '10K', '20K', '30K', '50K'];

export default function DepositPage() {
  const [selectedMethod, setSelectedMethod] = useState('jazzcash');
  const [selectedChannel, setSelectedChannel] = useState('epay');
  const [selectedAmount, setSelectedAmount] = useState<number | string>(300);
  const [customAmount, setCustomAmount] = useState('');
  const { token, user } = useAuthStore();

  const handleDeposit = async () => {
    const amount = customAmount ? Number(customAmount) : Number(String(selectedAmount).replace('K', '000'));
    if (!amount || !token) return;
    await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'DEPOSIT',
        amount,
        status: 'PENDING',
        meta: { method: selectedMethod, channel: selectedChannel }
      })
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white">
        <Header showBack title="Deposit" rightElement={<span className="text-xs text-gray-500">Deposit history</span>} />
      </div>

      {/* Balance Card */}
      <div className="px-4 py-4">
        <div className="gradient-bg rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-sm" />
            <span className="text-white/80 text-xs">Balance</span>
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
      <div className="px-4 flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {methods.map((method) => (
          <button 
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all min-w-[80px] relative ${selectedMethod === method.id ? 'border-pink-400 bg-white shadow-md' : 'border-transparent bg-white'}`}
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <Image src={method.image} alt={method.name} width={40} height={40} />
            </div>
            <span className="text-[10px] font-bold text-gray-600">{method.name}</span>
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-1 rounded-sm font-bold">
              {method.bonus}
            </div>
          </button>
        ))}
      </div>

      {/* Channels */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-pink-100 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-pink-400 rounded-sm rotate-45" />
            </div>
            <h3 className="text-sm font-bold">Select channel</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {channels.map((channel) => (
              <button 
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`p-3 rounded-xl text-left transition-all border ${selectedChannel === channel.id ? 'gradient-bg text-white border-transparent' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
              >
                <p className="text-[10px] font-bold">{channel.name}</p>
                <p className="text-[9px] mt-1">Balance:{channel.range}</p>
                <p className="text-[9px]">{channel.bonus}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Amount Selection */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-pink-100 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-pink-400 rounded-sm" />
            </div>
            <h3 className="text-sm font-bold">Deposit amount</h3>
          </div>
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
              type="text" 
              placeholder="Rs300.00 - Rs50,000.00" 
              className="w-full bg-gray-50 rounded-xl py-4 pl-12 pr-10 text-sm outline-none border border-gray-100"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
              <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px]">✕</div>
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-pink-100 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-pink-400 rounded-sm" />
            </div>
            <h3 className="text-sm font-bold">Recharge instructions</h3>
          </div>
          <ul className="space-y-3">
            <InstructionItem text="If the transfer time is up, please fill out the deposit form again." />
            <InstructionItem text="The transfer amount must match the order you created, otherwise the money cannot be credited successfully." />
            <InstructionItem text="If you transfer the wrong amount, our company will not be responsible for the lost amount!" />
            <InstructionItem text="Note: do not cancel the deposit order after the money has been transferred." />
          </ul>
        </div>
      </div>

      {/* Footer Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-white p-4 border-t border-gray-100 flex items-center justify-between z-50">
        <div>
          <p className="text-[10px] text-gray-400">Recharge Method:</p>
          <p className="text-xs font-bold">EPay-Jazz</p>
        </div>
        <button onClick={handleDeposit} className="bg-accent-purple text-white px-10 py-3 rounded-lg font-bold active:scale-95 transition-transform">
          Deposit
        </button>
      </div>
    </div>
  );
}

function InstructionItem({ text }: { text: string }) {
  return (
    <li className="flex gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
      <p className="text-[10px] text-gray-400 leading-relaxed">{text}</p>
    </li>
  );
}
