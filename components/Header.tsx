'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, Headset, Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  showLanguage?: boolean;
  rightElement?: React.ReactNode;
  transparent?: boolean;
  dark?: boolean;
}

export function Header({
  title,
  showBack = false,
  showLogo = false,
  showLanguage = false,
  rightElement,
  transparent = false,
  dark = false
}: HeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const textColor = dark ? 'text-white' : 'text-gray-800';
  const subTextColor = dark ? 'text-white/80' : 'text-gray-400';
  const [lang, setLang] = useState<'en' | 'ur'>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem('site-lang');
    return saved === 'ur' ? 'ur' : 'en';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const applyLanguage = (next: 'en' | 'ur') => {
    setLang(next);
    localStorage.setItem('site-lang', next);
    document.documentElement.lang = next;
  };

  const t = {
    balance: lang === 'ur' ? 'بیلنس' : 'Balance',
    login: lang === 'ur' ? 'لاگ اِن' : 'Log in',
    register: lang === 'ur' ? 'رجسٹر' : 'Register'
  };

  return (
    <header className={`relative h-14 flex items-center justify-between px-4 z-40 ${transparent ? 'bg-transparent' : 'bg-white'} ${!transparent ? 'border-b border-gray-100' : ''}`}>
      {showLogo && (
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-0">
          <div className="relative w-[148px] h-10">
            <Image src="/92glory-logo.png" alt="92 Glory0" fill className="object-contain" priority />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 min-w-[84px] z-10">
        {showBack ? (
          <button onClick={() => router.back()} className={textColor}>
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : showLogo ? (
          <>
            <Link href="/account/customer-service" className="text-[#C86DE9] active:text-[#E284EA]" aria-label="Support">
              <Headset className="w-5 h-5" />
            </Link>
            <button
              onClick={() => applyLanguage(lang === 'en' ? 'ur' : 'en')}
              className="text-[#C86DE9] active:text-[#E284EA]"
              aria-label="Toggle language"
              title={lang === 'en' ? 'Switch to Urdu' : 'Switch to English'}
            >
              <Languages className="w-5 h-5" />
            </button>
          </>
        ) : showLanguage ? (
          <button
            onClick={() => applyLanguage(lang === 'en' ? 'ur' : 'en')}
            className={textColor}
            aria-label="Toggle language"
            title={lang === 'en' ? 'Switch to Urdu' : 'Switch to English'}
          >
            <Languages className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      <div className="flex-1 flex justify-center z-10">
        {!showLogo && title && (
          <h1 className={`text-lg font-bold ${textColor}`}>{title}</h1>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 min-w-[120px] z-10">
        {rightElement ? (
          rightElement
        ) : isAuthenticated && user ? (
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-bold ${subTextColor}`}>{t.balance}</span>
            <span className="text-xs text-accent-pink font-bold">Rs{user.balance.toFixed(2)}</span>
          </div>
        ) : (
          <>
            <Link href="/login" className="h-8 px-4 rounded-full border border-purple-200 text-purple-500 text-[11px] font-bold active:scale-95 transition-transform flex items-center justify-center">
              {t.login}
            </Link>
            <Link href="/register" className="h-8 px-4 rounded-full gradient-bg text-white text-[11px] font-bold active:scale-95 transition-transform flex items-center justify-center shadow-md">
              {t.register}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
