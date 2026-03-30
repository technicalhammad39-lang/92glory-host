'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import { MobileTopBar } from '@/components/MobileTopBar';

type RebateConfig = {
  id: string;
  gameType: string;
  title: string;
  rate: number;
  betAmount: number;
  todayRebateAmount: number;
  claimable: boolean;
  claimedToday: boolean;
};

type RebateSummary = {
  allTotalBettingRebate: number;
  todayRebate: number;
  totalRebate: number;
};

export default function BettingRebatePage() {
  const { token } = useAuthStore();
  const [configs, setConfigs] = useState<RebateConfig[]>([]);
  const [summary, setSummary] = useState<RebateSummary>({
    allTotalBettingRebate: 0,
    todayRebate: 0,
    totalRebate: 0
  });
  const [selected, setSelected] = useState('ALL');
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    fetch('/api/rebate', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => {
        setConfigs(data?.configs || []);
        setSummary(data?.summary || { allTotalBettingRebate: 0, todayRebate: 0, totalRebate: 0 });
      });
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const current = useMemo(() => {
    if (selected === 'ALL') {
      return {
        gameType: 'ALL',
        title: 'All',
        rate: 0,
        betAmount: summary.allTotalBettingRebate,
        todayRebateAmount: configs.reduce((sum, row) => sum + Number(row.todayRebateAmount || 0), 0),
        claimable: configs.some((row) => row.claimable),
        claimedToday: configs.every((row) => row.claimedToday)
      };
    }
    return configs.find((row) => row.gameType === selected) || null;
  }, [configs, selected, summary.allTotalBettingRebate]);

  const claim = async () => {
    if (!token) return;
    const res = await fetch('/api/rebate/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ gameType: selected === 'ALL' ? 'ALL' : selected })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data?.error || 'No rebate available.');
      return;
    }
    setMessage(`Rebate claimed: Rs${Number(data.totalPayout || 0).toFixed(2)}`);
    load();
  };

  const tabs = [
    { id: 'ALL', label: 'All', logo: null },
    ...configs.map((row) => ({
      id: row.gameType,
      label: row.title,
      logo: row.gameType === 'LOTTERY' ? '/lotterycat.png' : null
    }))
  ];

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-6">
      <MobileTopBar title="Rebate" />

      <div className="px-3 pt-2">
        <div className="grid grid-cols-4 gap-1">
          {tabs.slice(0, 4).map((tab) => {
            const active = tab.id === selected;
            return (
              <button
                key={tab.id}
                onClick={() => setSelected(tab.id)}
                className={`h-11 rounded-md border text-[11px] font-medium flex flex-col items-center justify-center ${
                  active
                    ? 'text-white border-transparent bg-gradient-to-r from-[#6d8cf6] to-[#e280eb]'
                    : 'text-[#6d7ba2] border-[#ececf3] bg-white'
                }`}
              >
                {tab.logo ? (
                  <Image src={tab.logo} alt={tab.label} width={14} height={14} />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-sm bg-white/70" />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-md border border-[#efeff5] mt-2 p-2">
          <p className="text-[15px] font-semibold text-[#0f1d49]">All-Total betting rebate</p>
          <div className="mt-1 h-7 inline-flex items-center px-3 rounded-md border border-[#ef8ff3] text-[#ef8ff3] text-[11px]">
            Rebate count
          </div>

          <div className="mt-2 text-[31px] font-semibold text-[#111d4a]">{Number(current?.betAmount || 0).toFixed(2)}</div>
          <p className="text-[11px] text-[#7b8aac] mt-1">Upgrade VIP level to increase rebate rate</p>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <StatItem label="Today rebate" value={summary.todayRebate} />
            <StatItem label="Total rebate" value={summary.totalRebate} />
          </div>

          <p className="text-[11px] text-[#7b8aac] mt-2">Automatic code washing at 01:00:00 every morning</p>
          <button
            onClick={claim}
            disabled={!current?.claimable}
            className={`h-9 w-full mt-2 rounded-full text-[20px] font-medium ${
              current?.claimable
                ? 'text-white bg-gradient-to-r from-[#6d8cf6] to-[#e280eb]'
                : 'text-[#b5bfd6] bg-[#eff2f8]'
            }`}
          >
            One-Click Rebate
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2 text-[#0f1d49]">
          <span className="w-1 h-4 bg-[#e58aee]" />
          <h2 className="text-[30px] leading-none font-semibold">Rebate history</h2>
        </div>
        <button className="mt-2 h-8 w-full rounded-full border border-[#ef8ff3] text-[#ef8ff3] text-[13px]">
          All history
        </button>

        {message && <p className="text-[12px] text-[#d86de9] mt-2">{message}</p>}
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="h-[45px] rounded-md border border-[#f1f1f7] bg-[#f8f8fc] px-2 flex flex-col justify-center">
      <p className="text-[11px] text-[#7b8aac]">{label}</p>
      <p className="text-[18px] text-[#f39d2c]">{Number(value || 0).toFixed(2)}</p>
    </div>
  );
}
