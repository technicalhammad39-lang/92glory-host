'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import { MobileTopBar } from '@/components/MobileTopBar';

type AttendanceState = {
  setting: {
    minDepositAmount: number;
    oneTimeOnly: boolean;
    day1Reward: number;
    day2Reward: number;
    day3Reward: number;
    day4Reward: number;
    day5Reward: number;
    day6Reward: number;
    day7Reward: number;
  };
  state: {
    dayKey: string;
    consecutiveDays: number;
    currentDay: number;
    rewardToday: number;
    minDepositAmount: number;
    totalDeposited: number;
    claimedToday: boolean;
    oneTimeBlocked: boolean;
    eligible: boolean;
  };
  claims: Array<{
    id: string;
    dayKey: string;
    dayNumber: number;
    amount: number;
    createdAt: string;
  }>;
};

export default function AttendancePage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<AttendanceState | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    fetch('/api/attendance', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((payload) => setData(payload));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const claim = async () => {
    if (!token) return;
    const res = await fetch('/api/attendance/claim', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(body?.error || 'Unable to claim attendance reward.');
      return;
    }
    setMessage('Attendance reward received successfully.');
    load();
  };

  const rewards = data?.setting
    ? [
        data.setting.day1Reward,
        data.setting.day2Reward,
        data.setting.day3Reward,
        data.setting.day4Reward,
        data.setting.day5Reward,
        data.setting.day6Reward,
        data.setting.day7Reward
      ]
    : [15, 25, 45, 85, 110, 140, 180];

  const canClaim = Boolean(data?.state?.eligible);

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-6">
      <MobileTopBar title="Attendance" />
      <div className="px-3 pt-2">
        <div className="h-[220px] rounded-md bg-[#ff4646] relative overflow-hidden p-3 text-white">
          <p className="text-[38px] leading-none font-semibold">Attendance bonus</p>
          <p className="text-[11px] mt-1 leading-[1.2]">Get rewards based on consecutive login days</p>

          <div className="mt-3 w-[55%] bg-white rounded-r-2xl rounded-l-sm text-[#ff4d4d] p-2">
            <p className="text-[12px]">Attended consecutively</p>
            <p className="text-[20px] font-semibold">{data?.state?.consecutiveDays || 0} Day</p>
          </div>

          <div className="mt-2">
            <p className="text-[12px]">Accumulated</p>
            <p className="text-[31px] leading-none font-semibold">Rs{Number(data?.state?.rewardToday || 0).toFixed(2)}</p>
          </div>

          <div className="absolute right-1 top-7 w-[140px] h-[130px]">
            <Image src="/attendence bonus.webp" alt="Attendance" fill sizes="140px" className="object-contain" />
          </div>

          <div className="absolute left-3 right-3 bottom-3 grid grid-cols-2 gap-2">
            <button className="h-8 rounded-full bg-[#ffb02f] text-white text-[12px]">Game Rules</button>
            <button className="h-8 rounded-full bg-[#ffb02f] text-white text-[12px]">Attendance history</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 mt-2">
          {rewards.slice(0, 6).map((amount, idx) => (
            <div key={idx} className="bg-white rounded-md border border-[#efeff5] p-2 text-center">
              <p className="text-[22px] leading-none text-[#101d47]">Rs{Number(amount || 0).toFixed(2)}</p>
              <div className="w-9 h-9 rounded-full mx-auto mt-1 bg-[#ffd55b] border border-[#ffb22a] flex items-center justify-center text-[#ff8f00]">*</div>
              <p className="text-[16px] text-[#5f6f93] mt-1">{idx + 1} Day</p>
            </div>
          ))}
        </div>

        <div className="h-[90px] bg-white rounded-md border border-[#efeff5] mt-2 flex items-center justify-between px-3">
          <div className="w-24 h-16 relative">
            <Image src="/gifts.webp" alt="Day 7 reward" fill sizes="96px" className="object-contain" />
          </div>
          <div className="text-right">
            <p className="text-[31px] leading-none text-[#101d47]">Rs{Number(rewards[6] || 0).toFixed(2)}</p>
            <p className="text-[30px] leading-none text-[#5f6f93] mt-1">7 Day</p>
          </div>
        </div>

        <button
          onClick={claim}
          disabled={!canClaim}
          className={`mt-3 h-9 w-full rounded-full text-[18px] ${
            canClaim
              ? 'text-white bg-gradient-to-r from-[#6d8cf6] to-[#e280eb]'
              : 'text-[#b5bfd6] bg-[#eff2f8]'
          }`}
        >
          Attendance
        </button>

        <p className="mt-2 text-[12px] text-[#6d7ca2]">
          Deposit required: Rs{Number(data?.state?.minDepositAmount || 500).toFixed(2)} | Current deposited: Rs{Number(data?.state?.totalDeposited || 0).toFixed(2)}
        </p>
        {message && <p className="text-[12px] text-[#d86de9] mt-1">{message}</p>}
      </div>
    </div>
  );
}
