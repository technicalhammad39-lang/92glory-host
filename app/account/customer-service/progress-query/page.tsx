'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MobileTopBar } from '@/components/MobileTopBar';
import { useAuthStore } from '@/lib/store';

type TicketRow = {
  id: string;
  category: string;
  categoryLabel: string;
  subject: string;
  details: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  adminResponse: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  attachments: Array<{ id: string; url: string }>;
};

function statusLabel(status: TicketRow['status']) {
  if (status === 'OPEN') return 'Open';
  if (status === 'IN_PROGRESS') return 'In progress';
  if (status === 'RESOLVED') return 'Resolved';
  return 'Rejected';
}

function statusClass(status: TicketRow['status']) {
  if (status === 'OPEN') return 'bg-[#eef2ff] text-[#5f74d8]';
  if (status === 'IN_PROGRESS') return 'bg-[#fff7e9] text-[#dc9235]';
  if (status === 'RESOLVED') return 'bg-[#eafbf3] text-[#21a567]';
  return 'bg-[#ffecec] text-[#df5555]';
}

export default function SupportProgressQueryPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const qs = new URLSearchParams(window.location.search);
    return qs.get('submitted') === '1';
  });

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/support/tickets', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setItems(data?.tickets || []))
      .finally(() => setLoading(false));
  }, [router, token]);

  const content = useMemo(() => {
    if (loading) return <p className="text-[13px] text-[#7a8297]">Loading...</p>;

    if (!items.length) {
      return <p className="text-[13px] text-[#7a8297]">No support query found.</p>;
    }

    return (
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-[#ececf2] rounded-md p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[15px] text-[#293042] font-semibold">{item.categoryLabel}</p>
              <span className={`h-6 px-2 rounded-full text-[11px] inline-flex items-center ${statusClass(item.status)}`}>
                {statusLabel(item.status)}
              </span>
            </div>

            <p className="text-[13px] text-[#656e84] mt-2">{item.details}</p>

            {item.attachments.length > 0 && (
              <div className="mt-2 text-[12px] text-[#7f879b]">Screenshots: {item.attachments.length}</div>
            )}

            <div className="mt-2 text-[12px] text-[#7f879b] space-y-1">
              <p>Submitted: {new Date(item.createdAt).toLocaleString()}</p>
              <p>Updated: {new Date(item.updatedAt).toLocaleString()}</p>
              {item.resolvedAt ? <p>Closed: {new Date(item.resolvedAt).toLocaleString()}</p> : null}
            </div>

            <div className="mt-2 bg-[#f8f9fd] border border-[#eceef5] rounded-md p-2">
              <p className="text-[12px] text-[#8a91a3]">Admin response</p>
              <p className="text-[13px] text-[#4f576e] mt-1">{item.adminResponse || 'No response yet.'}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }, [items, loading]);

  return (
    <div className="min-h-screen bg-[#f2f2f8] pb-6">
      <MobileTopBar title="Progress Query" />
      <div className="px-4 pt-3">
        {submitted && (
          <div className="mb-3 rounded-md border border-[#d8e7ff] bg-[#eff5ff] px-3 py-2 text-[12px] text-[#5274b8]">
            Query submitted successfully.
          </div>
        )}

        {content}

        <Link
          href="/account/customer-service"
          className="mt-4 h-11 rounded-full bg-gradient-to-r from-[#6f8df8] to-[#6b92ef] text-white text-[15px] flex items-center justify-center"
        >
          Back to Self Service Center
        </Link>
      </div>
    </div>
  );
}
