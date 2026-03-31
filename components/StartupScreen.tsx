'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export function StartupScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 280);
          return 100;
        }
        return Math.min(100, prev + 8);
      });
    }, 95);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col px-8 pb-16 pt-20">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-[340px] aspect-[3/4] rounded-[28px] overflow-hidden">
          <Image src="/splasgimg.jpeg" alt="Startup splash" fill sizes="320px" className="object-cover" priority />
        </div>
        <div className="relative w-[92px] h-[54px] mt-8">
          <Image src="/92glory-logo.png" alt="92 Glory0 logo" fill sizes="92px" className="object-contain" priority />
        </div>
      </div>

      <div className="w-full max-w-[420px] mx-auto space-y-2">
        <div className="h-1.5 bg-[#efeef6] rounded-full overflow-hidden">
          <div className="h-full bg-[linear-gradient(90deg,#5a7cf3_0%,#d45ae4_100%)]" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[12px] text-[#8f93a5] font-semibold">
          <span>Loading...</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
