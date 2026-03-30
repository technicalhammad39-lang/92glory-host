'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Copy, Upload } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { getPaymentChannel, isPaymentMethodId } from '@/lib/payment-channels';

function formatAmount(value: number) {
  return `Rs ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type TransactionLike = {
  id: string;
  amount: number;
  status: string;
  meta?: {
    method?: string;
    methodLabel?: string;
    merchantAccountNumber?: string;
    merchantAccountName?: string;
    screenshotUrl?: string;
  } | null;
};

function DepositPayoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const { token } = useAuthStore();

  const [transaction, setTransaction] = useState<TransactionLike | null>(null);
  const [senderName, setSenderName] = useState('');
  const [senderAccount, setSenderAccount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (!orderId) {
      setMessage('Invalid order ID.');
      return;
    }

    fetch(`/api/transactions/${encodeURIComponent(orderId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || 'Unable to load order.');
        }
        return data;
      })
      .then((data) => {
        setTransaction(data?.transaction || null);
      })
      .catch((error) => {
        setMessage(error?.message || 'Unable to load order.');
      });
  }, [token, orderId, router]);

  const method = String(transaction?.meta?.method || '').toUpperCase();
  const isPending = String(transaction?.status || '').toUpperCase() === 'PENDING';
  const channel = useMemo(() => {
    if (isPaymentMethodId(method)) return getPaymentChannel(method);
    return null;
  }, [method]);

  const merchantAccount = transaction?.meta?.merchantAccountNumber || channel?.accountNumber || '-';
  const merchantName = transaction?.meta?.merchantAccountName || channel?.accountName || '-';

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage('Copied.');
    } catch {
      setMessage('Copy failed, please copy manually.');
    }
  };

  const submitDeposit = async () => {
    if (!token || !transaction) return;

    if (!proofFile) {
      setMessage('Payment screenshot is required.');
      return;
    }

    setMessage('');
    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append('file', proofFile);

      const uploadRes = await fetch('/api/uploads/deposit-proof', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        throw new Error(uploadData?.error || 'Unable to upload screenshot.');
      }

      const patchRes = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          screenshotUrl: uploadData?.url,
          senderAccount,
          senderName
        })
      });
      const patchData = await patchRes.json().catch(() => ({}));
      if (!patchRes.ok) {
        throw new Error(patchData?.error || 'Unable to submit deposit.');
      }

      setMessage('Deposit submitted successfully. Waiting for admin approval.');
      setTimeout(() => {
        router.push('/deposit-history');
      }, 900);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to submit deposit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header showBack title="Deposit details" rightElement={<Link href="/deposit-history" className="text-xs text-gray-500">Deposit history</Link>} />

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500">Order ID</p>
          <p className="text-[11px] font-bold text-gray-700 break-all">{transaction?.id || orderId}</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">Total amount</p>
            <p className="text-lg font-black text-accent-purple">{formatAmount(transaction?.amount || 0)}</p>
          </div>
          {transaction && !isPending && (
            <p className="text-[11px] font-bold text-gray-500 mt-2">This order is already {String(transaction.status).toLowerCase()}.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-base font-black text-gray-800 mb-4 text-center">Payment account details</h3>
          <div className="space-y-3">
            <DetailCard
              label="Channel"
              value={channel?.label || transaction?.meta?.methodLabel || '-'}
            />
            <DetailCard
              label="Account number"
              value={merchantAccount}
              action={
                merchantAccount !== '-' ? (
                  <button onClick={() => copyValue(merchantAccount)} className="text-accent-purple">
                    <Copy className="w-4 h-4" />
                  </button>
                ) : null
              }
            />
            <DetailCard
              label="Account name"
              value={merchantName}
              action={
                merchantName !== '-' ? (
                  <button onClick={() => copyValue(merchantName)} className="text-accent-purple">
                    <Copy className="w-4 h-4" />
                  </button>
                ) : null
              }
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-black text-gray-800 mb-3">Upload payment proof</h3>

          <div className="space-y-3">
            <input
              placeholder="Sender account (optional)"
              className="w-full bg-gray-50 rounded-xl py-3 px-3 text-xs outline-none border border-gray-100"
              value={senderAccount}
              onChange={(e) => setSenderAccount(e.target.value)}
            />
            <input
              placeholder="Sender name (optional)"
              className="w-full bg-gray-50 rounded-xl py-3 px-3 text-xs outline-none border border-gray-100"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />

            <label className="flex items-center gap-2 w-full bg-[#F8F3FF] rounded-xl py-4 px-4 border-2 border-dashed border-[#C886F8] cursor-pointer">
              <Upload className="w-5 h-5 text-[#9B4EE8]" />
              <span className="text-sm font-bold text-[#7B35D4] truncate">
                {proofFile ? proofFile.name : 'Upload payment screenshot (required)'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>

        <div className="bg-[#FDF6FF] rounded-2xl border border-[#E9CCF8] p-4">
          <h3 className="text-sm font-black text-accent-purple mb-2">ہدایات</h3>
          <ul className="space-y-2">
            {(channel?.instructionsUrdu || []).map((line, idx) => (
              <li key={`${line}-${idx}`} className="text-xs leading-relaxed text-gray-700 font-semibold">
                {line}
              </li>
            ))}
          </ul>
        </div>

        {message && <p className="text-xs font-bold text-accent-purple">{message}</p>}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-white p-4 border-t border-gray-100 z-50">
        <button
          onClick={submitDeposit}
          disabled={isSubmitting || !transaction || !isPending}
          className="w-full bg-accent-purple text-white py-3 rounded-lg font-bold disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting...' : 'Submit deposit'}
        </button>
      </div>
    </div>
  );
}

export default function DepositPayoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <DepositPayoutContent />
    </Suspense>
  );
}

function DetailCard({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="w-full rounded-2xl border border-purple-100 bg-[#FAF5FF] px-4 py-4 min-h-[92px] flex flex-col items-center justify-center">
      <span className="text-xs text-gray-500 mb-1">{label}</span>
      <div className="flex items-center gap-2 min-w-0 max-w-full">
        <span className="text-base font-black text-gray-800 break-all text-center">{value}</span>
        {action ? <span className="shrink-0">{action}</span> : null}
      </div>
    </div>
  );
}
