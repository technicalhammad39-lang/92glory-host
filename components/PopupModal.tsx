'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string[];
  confirmText?: string;
}

export function PopupModal({ isOpen, onClose, title, content, confirmText = 'Confirm' }: PopupModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-[320px] bg-white rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="bg-gradient-to-r from-blue-400 to-blue-500 py-3 px-4 text-center">
              <h3 className="text-white font-bold text-base">{title}</h3>
            </div>

            <div className="p-5 text-center space-y-4">
              <div className="space-y-3 text-xs font-bold text-gray-700 leading-relaxed">
                {content.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-full border border-gray-200 text-blue-500 font-bold text-sm active:scale-95 transition-transform"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
