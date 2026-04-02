'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import Image from 'next/image';
import { Award, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

type VipGroup = 'LEVEL' | 'MY';

interface VipLevelItem {
  id: string;
  level: number;
  title?: string | null;
  expRequired: number;
  payoutDays: number;
  betToExp: number;
  isOpen: boolean;
}

interface VipBenefitItem {
  id: string;
  level: number;
  group: string;
  title: string;
  description?: string | null;
  image: string;
  value?: string | null;
  secondaryValue?: string | null;
  order?: number;
}

interface VipUser {
  id: string;
  phone?: string | null;
  email?: string | null;
  uid?: string | null;
  vipLevel: number;
  exp: number;
  name?: string | null;
}

interface VipPayload {
  user: VipUser | null;
  levels: VipLevelItem[];
  benefits: VipBenefitItem[];
}

function buildVipLevels(levels: VipLevelItem[]) {
  const map = new Map(levels.map((lvl) => [lvl.level, lvl]));
  const generated: VipLevelItem[] = [];

  for (let level = 1; level <= 10; level += 1) {
    const existing = map.get(level);
    generated.push({
      id: existing?.id || `virtual-vip-${level}`,
      level,
      title: existing?.title || `VIP${level}`,
      expRequired: existing?.expRequired ?? Math.max(0, (level - 1) * 500),
      payoutDays: existing?.payoutDays ?? Math.max(2, 6 - Math.floor(level / 3)),
      betToExp: existing?.betToExp ?? Math.max(40, 100 - (level - 1) * 4),
      isOpen: existing?.isOpen ?? level <= 2
    });
  }

  return generated;
}

function scaleValue(value: string | null | undefined, level: number, group: VipGroup) {
  if (!value) return undefined;
  const num = Number.parseFloat(value.replace('%', ''));
  if (Number.isNaN(num)) return value;

  if (value.includes('%')) {
    const add = group === 'LEVEL' ? level * 0.03 : level * 0.02;
    return `${(num + add).toFixed(2)}%`;
  }

  const factor = group === 'LEVEL' ? 0.8 + level * 0.35 : 0.5 + level * 0.2;
  return String(Math.round(num * factor));
}

function resolveBenefits(level: number, group: VipGroup, allBenefits: VipBenefitItem[]) {
  const exact = allBenefits
    .filter((item) => item.group === group && item.level === level)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (exact.length) return exact;

  const template = allBenefits
    .filter((item) => item.group === group)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, 3);

  return template.map((item, idx) => ({
    ...item,
    id: `virtual-${group}-${level}-${idx}`,
    level,
    value: scaleValue(item.value, level, group),
    secondaryValue: scaleValue(item.secondaryValue, level, group)
  }));
}

export default function VIPPage() {
  const { token, user: authUser } = useAuthStore();
  const [data, setData] = useState<VipPayload | null>(null);
  const [activeTab, setActiveTab] = useState<'History' | 'Rules'>('History');
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    fetch('/api/vip', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
      .then((res) => res.json())
      .then((payload) => setData(payload));
  }, [token]);

  const vipLevels = useMemo(() => buildVipLevels(data?.levels || []), [data?.levels]);

  const currentUser = data?.user || (authUser
    ? {
        id: authUser.id,
        phone: authUser.phone,
        email: authUser.email,
        uid: authUser.uid,
        vipLevel: authUser.vipLevel,
        exp: 0,
        name: null
      }
    : null);

  const userVipLevel = Math.max(1, currentUser?.vipLevel || 1);
  const userExp = Math.max(0, currentUser?.exp || 0);
  const uidLabel = currentUser?.uid || authUser?.inviteCode || (currentUser?.id || 'GUEST').substring(0, 8).toUpperCase();
  const displayName = (currentUser?.name || '').trim() || 'Hammad Demo';

  const defaultCardIndex = Math.max(0, Math.min(userVipLevel - 1, Math.max(vipLevels.length - 1, 0)));
  const effectiveCardIndex = vipLevels[activeCardIndex] ? activeCardIndex : defaultCardIndex;
  const activeLevel = vipLevels[effectiveCardIndex] || vipLevels[0];
  const levelBenefits = useMemo(
    () => (activeLevel ? resolveBenefits(activeLevel.level, 'LEVEL', data?.benefits || []) : []),
    [activeLevel, data?.benefits]
  );
  const myBenefits = useMemo(
    () => (activeLevel ? resolveBenefits(activeLevel.level, 'MY', data?.benefits || []) : []),
    [activeLevel, data?.benefits]
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F6F6] pb-24 overflow-x-hidden">
      <Header transparent title="VIP" showBack />

      <div className="bg-gradient-to-r from-[#8DB3FF] via-[#BFA7FF] to-[#F2A6E4] pt-10 pb-28 px-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-8 w-32 h-32 border-[10px] border-white/35 rounded-full" />
        <div className="absolute top-6 right-12 w-14 h-14 border-[6px] border-white/25 rounded-full" />

        <div className="flex items-center gap-4 w-full relative z-10">
          <div className="relative w-[84px] h-[84px] rounded-full border-4 border-white/70 overflow-hidden bg-white/20">
            <Image src="/casinocat.png" alt="Avatar" fill sizes="84px" className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex bg-white/30 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">VIP{userVipLevel}</div>
            <h2 className="text-white text-lg font-black truncate">{displayName}</h2>
            <p className="text-white/90 text-xs mt-1">UID: {uidLabel}</p>
          </div>
        </div>

        <div className="absolute -bottom-8 left-4 right-4 flex gap-3 z-10">
          <div className="flex-1 bg-white rounded-xl py-4 text-center border border-white/80">
            <p className="text-[#E76C8E] font-bold text-base">{userExp} EXP</p>
            <p className="text-gray-500 text-[11px] mt-1">My experience</p>
          </div>
          <div className="flex-1 bg-white rounded-xl py-4 text-center border border-white/80">
            <p className="text-gray-800 font-bold text-base">{activeLevel?.payoutDays || 5} Days</p>
            <p className="text-gray-500 text-[11px] mt-1">Payout time</p>
          </div>
        </div>
      </div>

      <div className="mt-12 px-4">
        <div className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 mb-3 text-sm text-gray-600 text-center">
          VIP level rewards are settled at 2:00 am on the 1st of every month
        </div>

        <Swiper
          modules={[Pagination]}
          slidesPerView={1.12}
          centeredSlides
          spaceBetween={12}
          pagination={{ clickable: true }}
          initialSlide={Math.min(userVipLevel - 1, 9)}
          onSlideChange={(swiper) => setActiveCardIndex(swiper.activeIndex)}
          className="mb-6"
        >
          {vipLevels.map((level) => {
            const isOpen = level.level <= userVipLevel;
            const currentProgress = level.expRequired ? Math.min(100, (userExp / level.expRequired) * 100) : 100;

            return (
              <SwiperSlide key={level.id}>
                <div className="w-full rounded-2xl p-4 border border-gray-100 relative overflow-hidden min-h-[210px] bg-gradient-to-r from-[#7E5BFF] via-[#A06AFE] to-[#D58AFF]">
                  <div className="absolute -top-7 -right-7 w-20 h-20 border-[8px] border-white/40 rounded-full" />
                  <div className="absolute top-4 right-4 w-10 h-10 border-[5px] border-white/30 rounded-full" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white text-xl font-black italic">VIP{level.level}</h3>
                          <div className={`text-white text-[10px] font-bold px-2 py-0.5 rounded ${isOpen ? 'bg-emerald-500/80' : 'bg-red-500/85'}`}>
                            {isOpen ? 'Open' : 'Not open yet'}
                          </div>
                        </div>
                        <p className="text-white/95 text-[11px] leading-tight mb-2">
                          Upgrading VIP{level.level} requires {level.expRequired} EXP
                        </p>
                        <p className="text-white/90 text-[10px]">
                          Bet Rs{level.betToExp}=1EXP
                        </p>
                      </div>
                      <div className="relative w-16 h-16">
                        <Image src="/vip-card.webp" alt="VIP visual" fill sizes="64px" className="object-contain" />
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="h-1.5 bg-black/20 rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-yellow-300" style={{ width: `${currentProgress}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-white/90 font-medium">
                        <span>{userExp}/{level.expRequired}</span>
                        <span>{Math.max(level.expRequired - userExp, 0)} EXP to level up</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-3 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 flex items-center justify-center bg-pink-100 rounded-full">
                <Award className="w-3.5 h-3.5 text-pink-500" />
              </div>
              <h4 className="text-gray-800 font-bold text-sm">VIP{activeLevel?.level || 1} Benefits level</h4>
            </div>

            <div className="space-y-0">
              {levelBenefits.map((item, i) => (
                <div key={item.id} className={`flex items-center justify-between py-3 ${i !== levelBenefits.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 shrink-0">
                      <Image src={item.image} alt={item.title} fill sizes="40px" className="object-contain" />
                    </div>
                    <div>
                      <p className="text-gray-800 font-bold text-xs">{item.title}</p>
                      <p className="text-gray-400 text-[9px] leading-tight max-w-[160px]">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center justify-between min-w-[60px] ${item.title === 'Rebate rate' ? 'bg-pink-50 text-pink-500 border-pink-100 w-full justify-center' : 'bg-yellow-50 text-yellow-500 border-yellow-100'}`}>
                      <span>{item.value}</span>
                    </div>
                    {item.secondaryValue && (
                      <div className="bg-pink-50 text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded border border-pink-100 min-w-[60px] flex items-center justify-between">
                        <span>{item.secondaryValue}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 border border-gray-100 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 flex items-center justify-center bg-pink-100 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-pink-500" />
              </div>
              <h4 className="text-gray-800 font-bold text-sm">My benefits</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-2">
              {myBenefits.slice(0, 2).map((item) => (
                <div key={item.id} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                  <div className="relative aspect-[4/3]">
                    <Image src={item.image} alt={item.title} fill sizes="(max-width: 450px) 50vw, 210px" className="object-cover" />
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-gray-800">{item.title}</p>
                    <p className="text-[9px] text-gray-400 leading-tight">{item.description}</p>
                    <button className="mt-2 w-full text-[10px] font-bold text-gray-500 bg-gray-100 rounded-full py-1">
                      Received
                    </button>
                  </div>
                </div>
              ))}
              {myBenefits[2] && (
                <div className="bg-white rounded-xl overflow-hidden border border-gray-100 col-span-2">
                  <div className="relative aspect-[4/3]">
                    <Image src={myBenefits[2].image} alt={myBenefits[2].title} fill sizes="(max-width: 450px) 100vw, 420px" className="object-cover" />
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-gray-800">{myBenefits[2].title}</p>
                    <p className="text-[9px] text-gray-400 leading-tight">{myBenefits[2].description}</p>
                    <button className="mt-2 w-full text-[10px] font-bold text-accent-purple border border-purple-200 rounded-full py-1">
                      Check the details
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex">
              <button
                onClick={() => setActiveTab('History')}
                className={`flex-1 py-3 text-center text-xs font-bold ${activeTab === 'History' ? 'text-accent-purple border-b-2 border-accent-purple' : 'text-gray-400'}`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('Rules')}
                className={`flex-1 py-3 text-center text-xs font-bold ${activeTab === 'Rules' ? 'text-accent-purple border-b-2 border-accent-purple' : 'text-gray-400'}`}
              >
                Rules
              </button>
            </div>
            <div className="p-4 text-[10px] text-gray-500 leading-relaxed">
              {activeTab === 'History'
                ? 'Successfully received. Your VIP reward history will appear here.'
                : 'VIP rules and reward conditions will appear here.'}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
