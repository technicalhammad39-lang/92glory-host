'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

type GatewayId = 'JAZZCASH' | 'EASYPAISA';

const GATEWAYS: Record<
  GatewayId,
  {
    id: GatewayId;
    label: string;
    image: string;
  }
> = {
  JAZZCASH: {
    id: 'JAZZCASH',
    label: 'JazzCash',
    image: '/jazzcash.png'
  },
  EASYPAISA: {
    id: 'EASYPAISA',
    label: 'EasyPaisa',
    image: '/easypaisa.png'
  }
};

const AMOUNT_PRESETS = [300, 500, 800, 1000, 2000, 3000, 5000, 8000, 10000, 20000, 30000, 50000];

function formatAmount(value: number) {
  return `Rs ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DepositPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();

  const [gatewayId, setGatewayId] = useState<GatewayId>('JAZZCASH');
  const [selectedAmount, setSelectedAmount] = useState<number>(300);
  const [customAmount, setCustomAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const amount = useMemo(() => {
    const parsed = Number(customAmount);
    if (customAmount.trim() && Number.isFinite(parsed)) {
      return parsed;
    }
    return selectedAmount;
  }, [customAmount, selectedAmount]);

  const onContinue = async () => {
    setMessage('');

    if (!token) {
      router.push('/login');
      return;
    }

    if (!Number.isFinite(amount) || amount < 300 || amount > 50000) {
      setMessage('Amount must be between Rs 300 and Rs 50,000.');
      return;
    }

    setIsSubmitting(true);
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'DEPOSIT',
        amount,
        meta: {
          method: gatewayId
        }
      })
    });
    const data = await response.json().catch(() => ({}));
    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(data?.error || 'Unable to create deposit request.');
      return;
    }

    const orderId = String(data?.transaction?.id || '');
    if (!orderId) {
      setMessage('Unable to create order ID.');
      return;
    }

    router.push(`/deposit/payout?orderId=${encodeURIComponent(orderId)}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      <div className="bg-white">
        <Header showBack title="Deposit" rightElement={<Link href="/deposit-history" className="text-xs text-gray-500">Deposit history</Link>} />
      </div>

      <div className="px-4 py-4">
        <div className="gradient-bg rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-sm" />
            <span className="text-white/80 text-xs">Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{formatAmount(user?.balance || 0)}</span>
            <RefreshCw className="w-4 h-4 text-white/80" />
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-pink-100 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-pink-400 rounded-sm rotate-45" />
            </div>
            <h3 className="text-sm font-bold">Select gateway</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(Object.values(GATEWAYS) as Array<(typeof GATEWAYS)[GatewayId]>).map((item) => (
              <button
                key={item.id}
                onClick={() => setGatewayId(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  gatewayId === item.id
                    ? 'border-pink-400 bg-pink-50'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-white overflow-hidden flex items-center justify-center">
                  <Image src={item.image} alt={item.label} width={34} height={34} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-700">{item.label}</p>
                  <p className="text-[10px] text-gray-400">300 - 50,000</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-pink-100 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-pink-400 rounded-sm" />
            </div>
            <h3 className="text-sm font-bold">Deposit amount</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {AMOUNT_PRESETS.map((value) => (
              <button
                key={value}
                onClick={() => {
                  setSelectedAmount(value);
                  setCustomAmount('');
                }}
                className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                  !customAmount && selectedAmount === value
                    ? 'border-pink-400 text-pink-500 bg-pink-50'
                    : 'border-gray-100 text-gray-500'
                }`}
              >
                Rs {value >= 1000 ? `${value / 1000}K` : value}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 font-bold">Rs</div>
            <input
              type="number"
              min={300}
              max={50000}
              placeholder="300 - 50,000"
              className="w-full bg-gray-50 rounded-xl py-4 pl-12 pr-4 text-sm outline-none border border-gray-100"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-bold mb-3">Recharge instructions</h3>
          <ul className="space-y-2">
            <InstructionItem text="Channel select karke continue par click karen." />
            <InstructionItem text="Next page par account details copy karke payment complete karen." />
            <InstructionItem text="Payment screenshot upload karne ke baad request admin approval mein chali jayegi." />
          </ul>
        </div>
      </div>

      {message && (
        <div className="px-4 mt-3">
          <p className="text-xs font-bold text-pink-500">{message}</p>
        </div>
      )}

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-white p-4 border-t border-gray-100 z-50">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500">Total amount</p>
            <p className="text-base font-black text-gray-800 truncate">{formatAmount(amount)}</p>
          </div>
          <button
            onClick={onContinue}
            disabled={isSubmitting}
            className="shrink-0 bg-accent-purple text-white py-3 px-6 rounded-lg font-bold disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InstructionItem({ text }: { text: string }) {
  return (
    <li className="flex gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
      <p className="text-[10px] text-gray-500 leading-relaxed">{text}</p>
    </li>
  );
}
