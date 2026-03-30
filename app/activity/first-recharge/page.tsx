'use client';

import { useEffect, useState } from 'react';
import { MobileTopBar } from '@/components/MobileTopBar';

type BannerItem = {
  id: string;
  title: string;
  description: string | null;
  rulesText: string | null;
};

const fallbackRules = [
  'Exclusive for the first recharge of the account. There is only one chance.',
  'Activities cannot be participated in repeatedly.',
  'Rewards can only be claimed manually on iOS, Android, H5, and PC.',
  'This event is limited to normal human operations by account owner.',
  'Platform reserves the right of final interpretation.'
];

export default function FirstRechargePage() {
  const [rules, setRules] = useState<string[]>(fallbackRules);

  useEffect(() => {
    fetch('/api/banners')
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => {
        const list = data?.banners || [];
        const target = list.find((row: any) =>
          String(row.title || '').toLowerCase().includes('first deposit')
        ) as BannerItem | undefined;
        if (!target?.rulesText) return;
        const parsed = String(target.rulesText)
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        if (parsed.length) setRules(parsed);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-6">
      <MobileTopBar title="First deposit bonus" />
      <div className="px-3 pt-3">
        <div className="bg-white rounded-md border border-[#efeff5] p-3">
          <div className="h-8 rounded-l-md rounded-r-2xl bg-[#eb8cf1] text-white text-[18px] flex items-center justify-center font-semibold">
            Activity Rules
          </div>
          <div className="pt-3 space-y-2">
            {rules.map((rule, idx) => (
              <p key={idx} className="text-[12px] leading-[1.35] text-[#5f6f93]">
                ♦ {rule}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

