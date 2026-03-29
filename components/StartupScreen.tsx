'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';

export function StartupScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100]">
      <Image src="/splasgimg.jpeg" alt="Startup splash" fill className="object-cover" priority />
    </div>
  );
}
