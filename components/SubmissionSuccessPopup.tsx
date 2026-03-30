'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export function SubmissionSuccessPopup({
  open,
  title,
  subtitle
}: {
  open: boolean;
  title: string;
  subtitle: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/45" />

      <div className="pointer-events-none absolute top-[30%] left-1/2 -translate-x-1/2 w-[220px] h-[120px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-[#7D8EFF] to-[#D66BEE] animate-ping"
            style={{
              left: `${10 + (i % 5) * 18}%`,
              top: `${8 + Math.floor(i / 5) * 30}%`,
              animationDelay: `${i * 90}ms`,
              animationDuration: '900ms'
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-[320px] rounded-3xl bg-white p-5 text-center">
        <div className="w-14 h-14 rounded-full mx-auto bg-gradient-to-r from-[#7D8EFF] to-[#D66BEE] flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <p className="text-xl font-bold text-[#1A1A3A]">{title}</p>
        <p className="text-sm text-[#6D7C9F] mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

