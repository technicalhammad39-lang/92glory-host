'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Search, Filter, Gamepad2, Trophy, Star, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const gameCategories = [
  { id: 'all', name: 'All Games', icon: Gamepad2 },
  { id: 'hot', name: 'Hot', icon: Trophy },
  { id: 'new', name: 'New', icon: Star },
  { id: 'recent', name: 'Recent', icon: Clock },
];

const games: Array<{ id: number; name: string; provider: string; image: string; href?: string }> = [
  { id: 1, name: 'WIN GO', provider: 'LOTTO', image: '/wingo/assets/png/wingoissue-6a9eab2e.png', href: '/games/wingo' },
  { id: 2, name: 'SUPER ACE', provider: 'JILI', image: 'https://picsum.photos/seed/superace/200/200' },
  { id: 3, name: 'GOLDEN EMPIRE', provider: 'JILI', image: 'https://picsum.photos/seed/golden/200/200' },
  { id: 4, name: 'BOXING KING', provider: 'JILI', image: 'https://picsum.photos/seed/boxing/200/200' },
  { id: 5, name: 'FORTUNE GEMS', provider: 'JILI', image: 'https://picsum.photos/seed/gems2/200/200' },
  { id: 6, name: 'ALI BABA', provider: 'JILI', image: 'https://picsum.photos/seed/alibaba/200/200' },
];

export default function GamePage() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="flex flex-col min-h-screen bg-primary-dark pb-32">
      <Header dark title="Games" showBack />

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search game name" 
            className="w-full bg-secondary-dark rounded-full py-3 pl-12 pr-4 text-white text-sm outline-none border border-white/5"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2">
            <Filter className="w-4 h-4 text-accent-teal" />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 flex gap-4 overflow-x-auto no-scrollbar mb-6">
        {gameCategories.map((cat) => (
          <button 
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`flex flex-col items-center gap-2 shrink-0 px-4 py-2 rounded-xl transition-all ${activeTab === cat.id ? 'bg-accent-teal/10 border border-accent-teal/20' : ''}`}
          >
            <cat.icon className={`w-5 h-5 ${activeTab === cat.id ? 'text-accent-teal' : 'text-gray-500'}`} />
            <span className={`text-[10px] font-bold ${activeTab === cat.id ? 'text-accent-teal' : 'text-gray-500'}`}>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Game Grid */}
      <div className="px-4 grid grid-cols-3 gap-3">
        {games.map((game) => {
          const card = (
            <div key={game.id} className="flex flex-col gap-1">
              <div className="relative aspect-square rounded-xl overflow-hidden border border-white/5 shadow-lg group">
                <Image src={game.image} alt={game.name} fill sizes="(max-width: 450px) 33vw, 150px" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <div className="absolute top-1 right-1 bg-black/60 rounded px-1 py-0.5">
                  <span className="text-[8px] text-white font-bold">{game.provider}</span>
                </div>
              </div>
              <p className="text-[9px] text-gray-400 font-medium truncate px-1">{game.name}</p>
            </div>
          );

          if (!game.href) return card;
          return (
            <Link key={game.id} href={game.href}>
              {card}
            </Link>
          );
        })}
      </div>

      {/* Load More */}
      <div className="px-4 mt-8">
        <button className="w-full py-3 rounded-xl bg-secondary-dark text-gray-400 text-xs font-bold border border-white/5">
          Load More
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
