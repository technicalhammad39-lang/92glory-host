'use client';

import { CircleAlert, CircleCheckBig } from 'lucide-react';

type ActionResultModalProps = {
  isOpen: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
  confirmText?: string;
  onClose: () => void;
};

export function ActionResultModal({
  isOpen,
  type,
  title,
  message,
  confirmText = 'OK',
  onClose
}: ActionResultModalProps) {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-6">
      <button className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-full max-w-[320px] rounded-3xl bg-white p-5">
        <div
          className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 ${
            isSuccess
              ? 'bg-gradient-to-r from-[#6D8CF6] to-[#E284EA]'
              : 'bg-gradient-to-r from-[#F87171] to-[#FB7185]'
          }`}
        >
          {isSuccess ? <CircleCheckBig className="w-8 h-8 text-white" /> : <CircleAlert className="w-8 h-8 text-white" />}
        </div>
        <p className="text-center text-xl font-bold text-[#1A1A3A] mb-2">{title}</p>
        <p className="text-center text-sm text-[#707A96] mb-5">{message}</p>
        <button
          onClick={onClose}
          className={`w-full rounded-full py-3 text-white font-bold ${
            isSuccess
              ? 'bg-gradient-to-r from-[#6D8CF6] to-[#E284EA]'
              : 'bg-gradient-to-r from-[#F87171] to-[#FB7185]'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
