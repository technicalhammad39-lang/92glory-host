'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const TELEGRAM_URL = 'https://t.me/traderxhammad';
const TELEGRAM_HANDLE = '@traderxhammad';
const WHATSAPP_URL = 'https://wa.me/923209310656';
const WHATSAPP_NUMBER = '923209310656';

const TICKER_TEXT =
  'Website demo by Hammad. This website is for sale. Do not deposit or make any transaction.';

export function GlobalDemoNotice() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(true);
  }, [pathname]);

  return (
    <>
      <div className="w-full h-9 px-2 bg-gradient-to-r from-[#ffd9a8] to-[#fff09f] border-y border-[#efc085] flex items-center overflow-hidden">
        <div className="demo-ticker-track">
          {[0, 1].map((idx) => (
            <span key={idx} className="inline-flex items-center whitespace-nowrap text-[12px] text-[#7d3737] font-semibold pr-10">
              <span>{TICKER_TEXT}</span>
              <span className="px-1.5">|</span>
              <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="underline text-[#7b37d8] font-bold">
                {TELEGRAM_HANDLE}
              </a>
              <span className="px-1.5">|</span>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="underline text-[#0f9d58] font-bold">
                WhatsApp {WHATSAPP_NUMBER}
              </a>
            </span>
          ))}
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-5">
          <button
            className="absolute inset-0 bg-black/55"
            onClick={() => setIsOpen(false)}
            aria-label="Close demo notice"
          />
          <div className="relative w-full max-w-[340px] bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-4 py-3 bg-gradient-to-r from-[#f8be74] to-[#f6d57d]">
              <h3 className="text-[#4f2e2e] text-base font-bold text-center">Demo Notice</h3>
            </div>
            <div className="p-4 space-y-3 text-[12px] leading-5 text-[#4d5367]">
              <p>This website is for demo/viewing only.</p>
              <p>Please do not make any deposit or money transaction.</p>
              <p>This website is available for sale.</p>
              <p>
                Telegram: {' '}
                <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="underline font-bold text-[#7b37d8]">
                  {TELEGRAM_HANDLE}
                </a>
              </p>
              <p>
                WhatsApp: {' '}
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="underline font-bold text-[#0f9d58]">
                  {WHATSAPP_NUMBER}
                </a>
              </p>
              <p>
                After deal completion, all demo/sale notices will be removed and website will be customized according to client requirements.
              </p>
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full h-10 rounded-full bg-gradient-to-r from-[#6e8cf7] to-[#da7be8] text-white text-sm font-semibold"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

