'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';

export function StartupScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8">
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-[320px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-gray-100"
        >
          <Image src="/splasgimg.jpeg" alt="Startup splash" fill sizes="320px" className="object-cover" priority />
        </motion.div>
        <div className="relative w-[170px] h-12 mt-4">
          <Image src="/92glory-logo.png" alt="92 Glory0" fill sizes="170px" className="object-contain" priority />
        </div>
      </div>

      <div className="w-full max-w-[200px] space-y-2">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full gradient-bg"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-gray-400">
          <span>Loading...</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
