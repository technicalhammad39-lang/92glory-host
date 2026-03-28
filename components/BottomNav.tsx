'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { TrendingUp, Gift, Gamepad2, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Promotion', icon: TrendingUp, path: '/promotion' },
  { name: 'Activity', icon: Gift, path: '/activity' },
  { name: 'Game', icon: Gamepad2, path: '/', isCenter: true },
  { name: 'Wallet', icon: Wallet, path: '/wallet' },
  { name: 'Account', icon: User, path: '/account' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-white border-t border-gray-100 h-[82px] flex items-center justify-around z-50 px-2 pb-4 pt-1">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        
        if (item.isCenter) {
          return (
            <Link key={item.name} href={item.path} className="relative -top-3 flex flex-col items-center transition-transform active:scale-95">
              <div className="relative w-[70px] h-[70px]">
                <Image src="/game-icon5.png" alt="Game" fill className="object-contain scale-[1.28]" priority />
              </div>
            </Link>
          );
        }

        return (
          <Link key={item.name} href={item.path} className="flex flex-col items-center justify-center flex-1 transition-transform active:scale-95 mt-1">
            <item.icon className={cn(
              "w-6 h-6 mb-1",
              isActive ? "text-accent-purple" : "text-gray-400"
            )} />
            <span className={cn(
              "text-[11px] font-bold",
              isActive ? "text-accent-purple" : "text-gray-400"
            )}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
