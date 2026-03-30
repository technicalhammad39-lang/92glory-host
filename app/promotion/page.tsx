'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import Link from 'next/link';
import {
  ChevronRight,
  Copy,
  Gift,
  HandCoins,
  ClipboardList,
  BadgePercent,
  ScrollText,
  Headset,
  ChartNoAxesColumn
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

type TeamStats = {
  registerCount: number;
  depositCount: number;
  depositAmount: number;
  firstDepositCount: number;
};

type PromotionStats = {
  yesterdayTotalCommission: number;
  directStats: TeamStats;
  teamStats: TeamStats;
  promotionData: {
    thisWeek: number;
    totalCommission: number;
    directSubordinate: number;
    totalTeam: number;
  };
  inviteCode: string;
} | null;

const ZERO_STATS: TeamStats = {
  registerCount: 0,
  depositCount: 0,
  depositAmount: 0,
  firstDepositCount: 0
};

export default function PromotionPage() {
  const { token, user } = useAuthStore();
  const [stats, setStats] = useState<PromotionStats>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch('/api/promotion', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, [token]);

  const effectiveStats = token ? stats : null;
  const direct = effectiveStats?.directStats || ZERO_STATS;
  const team = effectiveStats?.teamStats || ZERO_STATS;

  const inviteCode = effectiveStats?.inviteCode || user?.inviteCode || '8877431702';

  const leftRows = useMemo(
    () => [
      { label: 'number of register', value: direct.registerCount },
      { label: 'Deposit number', value: direct.depositCount },
      { label: 'Deposit amount', value: direct.depositAmount },
      { label: 'Number of people making first deposit', value: direct.firstDepositCount }
    ],
    [direct]
  );

  const rightRows = useMemo(
    () => [
      { label: 'number of register', value: team.registerCount },
      { label: 'Deposit number', value: team.depositCount },
      { label: 'Deposit amount', value: team.depositAmount },
      { label: 'Number of people making first deposit', value: team.firstDepositCount }
    ],
    [team]
  );

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F4FA] pb-24">
      <div className="h-12 pt-1 bg-white border-b border-[#EAEAF2] flex items-center justify-center relative">
        <h1 className="text-[20px] leading-none text-[#0E1838] font-medium">Agency</h1>
        <button className="absolute right-3 text-[#E281E9]" aria-label="Agency Gift">
          <Gift className="w-4 h-4 fill-current" />
        </button>
      </div>

      <div className="relative bg-gradient-to-r from-[#7E8EFF] to-[#DE84EB] px-2 pt-4 pb-4 overflow-hidden">
        <div className="absolute -top-10 -left-16 w-44 h-44 rounded-full bg-white/10" />
        <div className="absolute -top-12 right-10 w-36 h-36 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col items-center">
          <span className="text-white text-[40px] leading-none font-semibold">
            {(effectiveStats?.yesterdayTotalCommission || 0).toFixed(0)}
          </span>
          <div className="mt-1 rounded-full bg-white/80 px-4 h-6 flex items-center">
            <span className="text-[12px] text-[#D070E3] font-medium">Yesterday&apos;s total commission</span>
          </div>
          <p className="text-[11px] text-white/85 mt-1.5">Upgrade the level to increase commission income</p>
        </div>

        <div className="relative z-10 mt-2 rounded-[10px] overflow-hidden border border-white/30 bg-white/95">
          <div className="grid grid-cols-2 bg-gradient-to-r from-[#E57CEF] to-[#D271E8] text-white text-[14px]">
            <div className="h-10 flex items-center justify-center border-r border-white/40">Direct subordinates</div>
            <div className="h-10 flex items-center justify-center">Team subordinates</div>
          </div>

          <div className="grid grid-cols-2">
            <div className="border-r border-[#EEE8F3]">
              {leftRows.map((row) => (
                <div key={row.label} className="h-[58px] flex flex-col items-center justify-center text-center px-2">
                  <span className={`text-[20px] leading-none ${row.label === 'Deposit amount' ? 'text-[#FF8E2B]' : 'text-[#1A2342]'}`}>
                    {typeof row.value === 'number' ? Number(row.value).toFixed(0) : row.value}
                  </span>
                  <span className="text-[12px] text-[#1A2342] leading-[1.1] mt-1">{row.label}</span>
                </div>
              ))}
            </div>
            <div>
              {rightRows.map((row) => (
                <div key={row.label} className="h-[58px] flex flex-col items-center justify-center text-center px-2">
                  <span className={`text-[20px] leading-none ${row.label === 'Deposit amount' ? 'text-[#FF8E2B]' : 'text-[#1A2342]'}`}>
                    {typeof row.value === 'number' ? Number(row.value).toFixed(0) : row.value}
                  </span>
                  <span className="text-[12px] text-[#1A2342] leading-[1.1] mt-1">{row.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 mt-3 space-y-2.5">
        <button className="w-full h-11 rounded-full bg-gradient-to-r from-[#6E8CF6] to-[#DE7DEB] text-white text-[25px] leading-none font-medium">
          Download QR Code
        </button>

        <PromoItem href="/promotion/partner-rewards" icon={HandCoins} label="Partner rewards" />

        <div className="h-11 rounded-xl bg-white flex items-center justify-between px-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-[#F9E7FB] flex items-center justify-center">
              <Copy className="w-3.5 h-3.5 text-[#D770E5]" />
            </span>
            <span className="text-[15px] text-[#0B1A45]">Copy invitation code</span>
          </div>
          <button onClick={copyInviteCode} className="flex items-center gap-1.5">
            <span className="text-[13px] text-[#6D7DA0]">{inviteCode}</span>
            <Copy className="w-3.5 h-3.5 text-[#7E8BB0]" />
          </button>
        </div>

        {copied && <p className="text-[12px] text-[#5F70A0] pl-2">Copied</p>}

        <PromoItem href="/promotion/subordinate-data" icon={ClipboardList} label="Subordinate data" />
        <PromoItem href="/promotion/commission-detail" icon={BadgePercent} label="Commission detail" />
        <PromoItem href="/promotion/invitation-rules" icon={ScrollText} label="Invitation rules" />
        <PromoItem href="/promotion/agent-support" icon={Headset} label="Agent line customer service" />
        <PromoItem href="/promotion/rebate-ratio" icon={ChartNoAxesColumn} label="Rebate ratio" />

        <div className="rounded-xl bg-white px-3 pb-3 pt-2">
          <div className="h-9 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#F9E7FB] flex items-center justify-center">
              <Gift className="w-3.5 h-3.5 text-[#D770E5]" />
            </span>
            <span className="text-[15px] text-[#0B1A45] font-medium lowercase">promotion data</span>
          </div>

          <div className="grid grid-cols-2 gap-y-1 mt-3">
            <DataCell value={(effectiveStats?.promotionData?.thisWeek || 0).toFixed(0)} label="This Week" />
            <DataCell value={(effectiveStats?.promotionData?.totalCommission || 0).toFixed(2)} label="Total commission" />
            <DataCell value={String(effectiveStats?.promotionData?.directSubordinate || 0)} label="direct subordinate" />
            <DataCell value={String(effectiveStats?.promotionData?.totalTeam || 0)} label="Total number of subordinates in the team" />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function PromoItem({
  href,
  icon: Icon,
  label
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link href={href} className="h-11 rounded-xl bg-white flex items-center justify-between px-3 active:scale-[0.99] transition-transform">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-md bg-[#F9E7FB] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-[#D770E5]" />
        </span>
        <span className="text-[15px] text-[#0B1A45]">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-[#0C1A44]" />
    </Link>
  );
}

function DataCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-1">
      <p className="text-[24px] leading-none text-[#0A163B]">{value}</p>
      <p className="text-[13px] mt-1 leading-[1.15] text-[#64759A]">{label}</p>
    </div>
  );
}
