'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function MobileTopBar({ title }: { title: string }) {
  const router = useRouter();
  return (
    <div className="h-11 bg-white flex items-center justify-center relative">
      <button
        onClick={() => router.back()}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#1D2758]"
        aria-label="Go back"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <h1 className="text-[15px] font-semibold text-[#111D4A]">{title}</h1>
    </div>
  );
}

