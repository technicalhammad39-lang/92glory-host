'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { RefreshCw, ChevronRight, Copy, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { ActionResultModal } from '@/components/ActionResultModal';

type MethodId = 'JAZZCASH' | 'EASYPAISA' | 'USDT';

type PaymentAccount = {
  id: string;
  method: MethodId;
  accountTitle: string;
  accountName?: string | null;
  accountNumber?: string | null;
  usdtAddress?: string | null;
  isActive: boolean;
};

type TransactionItem = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  meta?: {
    method?: string;
    accountTitle?: string;
  } | null;
};

const methods = [
  { id: 'EASYPAISA' as const, name: 'EASYPAISA', image: '/easypaisa.png' },
  { id: 'JAZZCASH' as const, name: 'JAZZCASH', image: '/jazzcash.png' },
  { id: 'USDT' as const, name: 'USDT', image: '/usdt.png' }
];

function toMoney(value: number) {
  return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toStatusLabel(status: string) {
  const upper = String(status || '').toUpperCase();
  if (upper === 'COMPLETED') return 'Completed';
  if (upper === 'FAILED') return 'Rejected';
  if (upper === 'PROCESSING') return 'Processing';
  return 'Pending';
}

export default function WithdrawPage() {
  const { token, user, setUser } = useAuthStore();
  const [selectedMethod, setSelectedMethod] = useState<MethodId>('JAZZCASH');
  const [amount, setAmount] = useState('');
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountTitle, setAccountTitle] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const availableBalance = Number(user?.balance || 0);
  const amountNumber = Number(amount || 0);
  const selected = methods.find((m) => m.id === selectedMethod) || methods[0];
  const selectedAccount = useMemo(
    () => accounts.find((acc) => acc.method === selectedMethod && acc.isActive),
    [accounts, selectedMethod]
  );

  const fetchProfile = async () => {
    if (!token) return;
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.user) {
      setUser(data.user);
    }
  };

  const fetchAccounts = async () => {
    if (!token) return;
    const response = await fetch('/api/payment-accounts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setAccounts(data?.accounts || []);
    }
  };

  const fetchTransactions = async () => {
    if (!token) return;
    const response = await fetch('/api/transactions?type=WITHDRAW', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setTransactions(data?.transactions || []);
    }
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      const [accountsRes, trxRes, profileRes] = await Promise.all([
        fetch('/api/payment-accounts', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/transactions?type=WITHDRAW', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [accountsData, trxData, profileData] = await Promise.all([
        accountsRes.json().catch(() => ({})),
        trxRes.json().catch(() => ({})),
        profileRes.json().catch(() => null)
      ]);

      if (cancelled) return;
      if (accountsRes.ok) setAccounts(accountsData?.accounts || []);
      if (trxRes.ok) setTransactions(trxData?.transactions || []);
      if (profileRes.ok && profileData?.user) setUser(profileData.user);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, setUser]);

  const openAccountModal = () => {
    if (selectedAccount) {
      setAccountTitle(selectedAccount.accountTitle || '');
      setAccountName(selectedAccount.accountName || '');
      setAccountNumber(selectedAccount.accountNumber || '');
      setUsdtAddress(selectedAccount.usdtAddress || '');
    } else {
      setAccountTitle('');
      setAccountName('');
      setAccountNumber('');
      setUsdtAddress('');
    }
    setAccountModalOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!token) return;
    setMessage('');

    if (!accountTitle.trim()) {
      setMessage('Account title is required.');
      return;
    }

    if (selectedMethod === 'USDT') {
      if (!usdtAddress.trim()) {
        setMessage('USDT address is required.');
        return;
      }
    } else if (!accountNumber.trim() || !accountName.trim()) {
      setMessage('Account number and account name are required.');
      return;
    }

    const response = await fetch('/api/payment-accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        method: selectedMethod,
        accountTitle,
        accountName,
        accountNumber,
        usdtAddress
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data?.error || 'Unable to save account.');
      return;
    }

    setMessage('Account saved successfully.');
    setAccountModalOpen(false);
    await fetchAccounts();
  };

  const handleWithdraw = async () => {
    if (!token) return;
    setMessage('');

    const openResult = (type: 'success' | 'error', title: string, nextMessage: string) => {
      setResultModal({
        isOpen: true,
        type,
        title,
        message: nextMessage
      });
    };

    if (!selectedAccount) {
      setMessage('Please add account for selected channel.');
      openAccountModal();
      return;
    }

    if (!Number.isFinite(amountNumber) || amountNumber < 500 || amountNumber > 50000) {
      setMessage('Withdrawal amount range Rs500.00-Rs50,000.00');
      return;
    }

    if (amountNumber > availableBalance) {
      setMessage('Insufficient withdrawable balance.');
      return;
    }

    setSubmitting(true);
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'WITHDRAW',
        amount: amountNumber,
        meta: {
          method: selectedMethod
        }
      })
    });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      const errorMessage = data?.error || 'Unable to submit withdraw request.';
      setMessage(errorMessage);
      openResult('error', 'Request Failed', errorMessage);
      return;
    }

    setMessage('Withdraw request submitted. Waiting for admin approval.');
    openResult('success', 'Request Submitted', 'Withdraw request submitted. Waiting for admin approval.');
    setAmount('');
    await fetchTransactions();
    await fetchProfile();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white">
        <Header
          showBack
          title="Withdraw"
          rightElement={<Link href="/withdraw-history" className="text-xs text-gray-500">Withdrawal history</Link>}
        />
      </div>

      <div className="px-4 py-4">
        <div className="gradient-bg rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-sm" />
            <span className="text-white/80 text-xs">Available balance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">Rs {toMoney(availableBalance)}</span>
            <RefreshCw className="w-4 h-4 text-white/80" />
          </div>
        </div>
      </div>

      <div className="px-4 grid grid-cols-3 gap-3">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all relative ${
              selectedMethod === method.id ? 'border-pink-400 bg-white shadow-md' : 'border-transparent bg-white'
            }`}
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <Image src={method.image} alt={method.name} width={40} height={40} />
            </div>
            <span className="text-[10px] font-bold text-gray-400">{method.name}</span>
            {selectedMethod === method.id && <div className="absolute inset-0 gradient-bg opacity-10 rounded-xl" />}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4">
        <button
          onClick={openAccountModal}
          className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-gray-100"
        >
          {selectedAccount ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                <Image src={selected.image} alt={selected.name} width={20} height={20} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold uppercase">{selectedAccount.accountTitle}</p>
                <p className="text-[10px] text-gray-400 truncate">
                  {selectedMethod === 'USDT' ? selectedAccount.usdtAddress : selectedAccount.accountNumber}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                <Image src={selected.image} alt={selected.name} width={20} height={20} />
              </div>
              <p className="text-xs font-bold text-gray-700">Add account</p>
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="relative mb-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-pink-400 text-2xl font-bold italic">Rs</div>
            <input
              type="number"
              placeholder="0"
              min={500}
              max={50000}
              className="w-full bg-transparent border-b border-gray-100 py-4 pl-12 text-2xl font-bold outline-none placeholder:text-gray-200"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-[10px] text-pink-400">Withdrawable balance Rs{toMoney(availableBalance)}</p>
            <button onClick={() => setAmount(String(Math.min(availableBalance, 50000)))} className="text-pink-400 text-xs border border-pink-400 px-4 py-0.5 rounded-full">All</button>
          </div>
          <div className="flex justify-between items-center mb-8">
            <p className="text-[10px] text-gray-400">Withdrawal amount received</p>
            <p className="text-pink-400 text-xs font-bold">Rs{toMoney(amountNumber)}</p>
          </div>
          <button
            onClick={handleWithdraw}
            disabled={submitting}
            className="w-full bg-accent-purple text-white font-bold py-3 rounded-full active:scale-95 transition-transform disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Withdraw'}
          </button>
        </div>
      </div>

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

      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-4 bg-pink-400/20 rounded flex items-center justify-center">
            <div className="w-3 h-2 bg-pink-400 rounded-sm" />
          </div>
          <h3 className="text-sm font-bold">Withdrawal history</h3>
        </div>

        {transactions.slice(0, 3).map((trx) => (
          <div key={trx.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 mb-3">
            <div className="flex justify-between items-center mb-4">
              <div className="bg-red-500 text-white text-[10px] px-3 py-1 rounded-md font-bold">Withdraw</div>
              <span className="text-teal-500 text-[10px] font-bold">{toStatusLabel(trx.status)}</span>
            </div>
            <div className="space-y-2">
              <HistoryRow label="Balance" value={`Rs ${toMoney(trx.amount)}`} valueColor="text-orange-400" />
              <HistoryRow label="Type" value={String(trx.meta?.method || '').toUpperCase() || 'WITHDRAW'} />
              <HistoryRow label="Time" value={new Date(trx.createdAt).toLocaleString()} />
              <HistoryRow label="Order number" value={trx.id} showCopy />
            </div>
          </div>
        ))}

        <Link href="/withdraw-history" className="block w-full text-center py-3 rounded-full border border-pink-200 text-pink-400 font-medium mt-4">
          All history
        </Link>
      </div>

      {message && (
        <div className="px-4 mt-4">
          <p className="text-xs font-bold text-accent-purple">{message}</p>
        </div>
      )}

      {accountModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-gray-800">Add {selected.name} account</h3>
              <button onClick={() => setAccountModalOpen(false)} className="text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                className="w-full bg-gray-50 rounded-xl py-3 px-3 text-xs outline-none border border-gray-100"
                placeholder="Account title (e.g. My JazzCash)"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
              />
              {selectedMethod === 'USDT' ? (
                <input
                  className="w-full bg-gray-50 rounded-xl py-3 px-3 text-xs outline-none border border-gray-100"
                  placeholder="USDT address"
                  value={usdtAddress}
                  onChange={(e) => setUsdtAddress(e.target.value)}
                />
              ) : (
                <>
                  <input
                    className="w-full bg-gray-50 rounded-xl py-3 px-3 text-xs outline-none border border-gray-100"
                    placeholder="Account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                  <input
                    className="w-full bg-gray-50 rounded-xl py-3 px-3 text-xs outline-none border border-gray-100"
                    placeholder="Account name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </>
              )}
            </div>

            <button onClick={handleSaveAccount} className="w-full mt-4 bg-accent-purple text-white py-3 rounded-xl font-bold">
              Confirm account
            </button>
          </div>
        </div>
      )}

      <ActionResultModal
        isOpen={resultModal.isOpen}
        type={resultModal.type}
        title={resultModal.title}
        message={resultModal.message}
        onClose={() => setResultModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function InstructionItem({ text, color = 'text-gray-400' }: { text: string; color?: string }) {
  return (
    <li className="flex gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
      <p className={`text-[10px] leading-relaxed ${color}`}>{text}</p>
    </li>
  );
}

function HistoryRow({ label, value, valueColor = 'text-gray-800', showCopy }: { label: string; value: string; valueColor?: string; showCopy?: boolean }) {
  const copy = async () => {
    if (!showCopy) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // no-op
    }
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-gray-400">{label}</span>
      <button onClick={copy} className="flex items-center gap-1">
        <span className={`text-[10px] font-bold ${valueColor}`}>{value}</span>
        {showCopy && <Copy className="w-3 h-3 text-gray-300" />}
      </button>
    </div>
  );
}
