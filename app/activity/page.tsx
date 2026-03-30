'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Award, TrendingUp, Trophy } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

interface ActivityItem {
  id: string;
  title: string;
  description?: string | null;
  image: string;
  type: string;
  isActive?: boolean;
}

function routeForActivity(item: ActivityItem) {
  const title = String(item.title || '').toLowerCase();
  if (title.includes('gift')) return '/activity/gift';
  if (title.includes('attendance')) return '/activity/attendance';
  if (title.includes('deposit')) return '/activity/first-recharge';
  if (title.includes('rebate')) return '/activity/betting-rebate';
  if (title.includes('jackpot')) return '/activity/super-jackpot';
  return '/activity/daily-tasks';
}

export default function ActivityPage() {
  const { token } = useAuthStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [todayBonus, setTodayBonus] = useState(0);
  const [totalBonus, setTotalBonus] = useState(0);

  useEffect(() => {
    fetch('/api/activities')
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setActivities(data?.activities || []));
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch('/api/account/summary', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => {
        setTodayBonus(Number(data?.summary?.todayBonus || 0));
        setTotalBonus(Number(data?.summary?.totalBonus || 0));
      });
  }, [token]);

  const activeItems = useMemo(() => activities.filter((row) => row.isActive !== false), [activities]);
  const cardActivities = useMemo(() => activeItems.filter((row) => row.type === 'card'), [activeItems]);
  const bannerActivities = useMemo(() => activeItems.filter((row) => row.type !== 'card'), [activeItems]);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFBFE] pb-24">
      <div className="w-full rounded-b-[22px] bg-gradient-to-r from-[#6D8CF6] to-[#DB7BE8] pt-7 pb-20 px-4 overflow-hidden">
        <Header transparent dark showLogo />

        <div className="flex justify-around mt-8">
          <div className="text-center">
            <p className="text-white/80 text-[11px] font-medium">Today&apos;s bonus</p>
            <p className="text-white font-black text-2xl mt-1">Rs{todayBonus.toFixed(2)}</p>
          </div>
          <div className="w-[1px] h-10 bg-white/20 my-auto"></div>
          <div className="text-center">
            <p className="text-white/80 text-[11px] font-medium">Total bonus</p>
            <p className="text-white font-black text-2xl mt-1">Rs{totalBonus.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <Link href="/activity/daily-tasks" className="bg-white/12 backdrop-blur-sm text-white text-xs font-bold px-8 py-2.5 rounded-full border border-white/20 active:scale-95 transition-transform">
            Bonus details
          </Link>
        </div>
      </div>

      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl py-5 px-2 flex justify-around border border-[#EEF1F8]">
          <Link href="/activity/daily-tasks" className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center border border-pink-100/50 shadow-inner">
              <Award className="w-6 h-6 text-[#E76C8E]" />
            </div>
            <span className="text-[10px] text-gray-600 font-bold text-center leading-tight">Activity<br />Award</span>
          </Link>
          <Link href="/activity/betting-rebate" className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100/50 shadow-inner">
              <TrendingUp className="w-6 h-6 text-teal-500" />
            </div>
            <span className="text-[10px] text-gray-600 font-bold text-center leading-tight">Betting<br />rebate</span>
          </Link>
          <Link href="/activity/super-jackpot" className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center border border-yellow-100/50 shadow-inner">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <span className="text-[10px] text-gray-600 font-bold text-center leading-tight">Super<br />Jackpot</span>
          </Link>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {cardActivities.map((activity) => (
            <Link key={activity.id} href={routeForActivity(activity)} className="bg-white rounded-2xl overflow-hidden border border-[#EEF1F8] active:scale-[0.98] transition-transform">
              <div className="relative aspect-[4/3]">
                <Image src={activity.image} alt={activity.title} fill sizes="(max-width: 450px) 50vw, 220px" className="object-cover" />
              </div>
              <div className="p-3 bg-white">
                <h4 className="text-xs font-black text-gray-800">{activity.title}</h4>
                <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{activity.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {bannerActivities.map((activity) => (
          <div key={activity.id} className="bg-white rounded-2xl overflow-hidden border border-[#EEF1F8] active:scale-[0.98] transition-transform">
            <div className="relative aspect-[21/9]">
              <Image src={activity.image} alt={activity.title} fill sizes="(max-width: 450px) 100vw, 450px" className="object-cover" />
            </div>
            <div className="p-3 px-4 bg-white flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black text-gray-800">{activity.title}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{activity.description}</p>
              </div>
              <Link href={routeForActivity(activity)} className="bg-gradient-to-r from-[#6D8CF6] to-[#E284EA] text-white text-[10px] font-bold px-4 py-1.5 rounded-full">
                Detail
              </Link>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
