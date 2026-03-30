'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Award, TrendingUp, Trophy } from 'lucide-react';
import Image from 'next/image';

interface ActivityItem {
  id: string;
  title: string;
  description?: string | null;
  image: string;
  type: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetch('/api/activities')
      .then((res) => res.json())
      .then((data) => setActivities(data.activities || []));
  }, []);

  const activeItems = activities.filter((a: any) => a.isActive !== false);
  const cardActivities = activeItems.filter((a) => a.type === 'card');
  const bannerActivities = activeItems.filter((a) => a.type !== 'card');

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFBFE] pb-24">
      <div className="w-full rounded-b-[22px] bg-gradient-to-r from-[#6D8CF6] to-[#DB7BE8] pt-7 pb-20 px-4 overflow-hidden">
        <Header transparent dark showLogo />
        
        <div className="flex justify-around mt-8">
          <div className="text-center">
            <p className="text-white/80 text-[11px] font-medium">Today&apos;s bonus</p>
            <p className="text-white font-black text-2xl mt-1">Rs0.00</p>
          </div>
          <div className="w-[1px] h-10 bg-white/20 my-auto"></div>
          <div className="text-center">
            <p className="text-white/80 text-[11px] font-medium">Total bonus</p>
            <p className="text-white font-black text-2xl mt-1">Rs5,297.01</p>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button className="bg-white/12 backdrop-blur-sm text-white text-xs font-bold px-8 py-2.5 rounded-full border border-white/20 active:scale-95 transition-transform">
            Bonus details
          </button>
        </div>
      </div>

      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl py-5 px-2 flex justify-around border border-[#EEF1F8]">
          <button className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center border border-pink-100/50 shadow-inner">
              <Award className="w-6 h-6 text-[#E76C8E]" />
            </div>
            <span className="text-[10px] text-gray-600 font-bold text-center leading-tight">Activity<br />Award</span>
          </button>
          <button className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100/50 shadow-inner">
              <TrendingUp className="w-6 h-6 text-teal-500" />
            </div>
            <span className="text-[10px] text-gray-600 font-bold text-center leading-tight">Betting<br />rebate</span>
          </button>
          <button className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center border border-yellow-100/50 shadow-inner">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <span className="text-[10px] text-gray-600 font-bold text-center leading-tight">Super<br />Jackpot</span>
          </button>
        </div>
      </div>

      {/* Activity Cards */}
      <div className="px-4 mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {cardActivities.map(activity => (
            <div key={activity.id} className="bg-white rounded-2xl overflow-hidden border border-[#EEF1F8] active:scale[0.98] transition-transform">
              <div className="relative aspect-[4/3]">
                <Image src={activity.image} alt={activity.title} fill sizes="(max-width: 450px) 50vw, 220px" className="object-cover" />
              </div>
              <div className="p-3 bg-white">
                <h4 className="text-xs font-black text-gray-800">{activity.title}</h4>
                <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{activity.description}</p>
              </div>
            </div>
          ))}
        </div>

        {bannerActivities.map(activity => (
          <div key={activity.id} className="bg-white rounded-2xl overflow-hidden border border-[#EEF1F8] active:scale[0.98] transition-transform">
            <div className="relative aspect-[21/9]">
              <Image src={activity.image} alt={activity.title} fill sizes="(max-width: 450px) 100vw, 450px" className="object-cover" />
            </div>
            <div className="p-3 px-4 bg-white flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black text-gray-800">{activity.title}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{activity.description}</p>
              </div>
              <button className="bg-gradient-to-r from-[#6D8CF6] to-[#E284EA] text-white text-[10px] font-bold px-4 py-1.5 rounded-full">
                Detail
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
