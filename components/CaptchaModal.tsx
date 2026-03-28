'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface CaptchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CaptchaModal({ isOpen, onClose, onSuccess }: CaptchaModalProps) {
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const container = document.getElementById('slider-track');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    let pos = ((clientX - rect.left) / rect.width) * 100;
    pos = Math.max(0, Math.min(pos, 85)); // 85% is max to keep slider in track
    setSliderPos(pos);
  };

  const handleEnd = () => {
    setIsDragging(false);
    // Success condition: slider is around 40-50% (based on screenshot puzzle position)
    if (sliderPos > 38 && sliderPos < 45) {
      onSuccess();
    } else {
      setSliderPos(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg w-full max-w-[320px] overflow-hidden relative z-10"
          >
            <div className="relative aspect-[4/3] w-full">
              <Image 
                src="https://picsum.photos/seed/captcha/400/300" 
                alt="Captcha" 
                fill 
                className="object-cover"
              />
              
              {/* Target Hole */}
              <div className="absolute top-1/4 left-[40%] w-12 h-12 bg-black/40 border-2 border-white/50 rounded-sm shadow-inner">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/40 rounded-full" />
                <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-black/40 rounded-full" />
              </div>

              {/* Slider Piece */}
              <div 
                className="absolute top-1/4 w-12 h-12 rounded-sm shadow-xl z-20"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="relative w-full h-full overflow-hidden rounded-sm border-2 border-white">
                   <Image 
                    src="https://picsum.photos/seed/captcha/400/300" 
                    alt="Piece" 
                    width={400} 
                    height={300} 
                    className="absolute max-w-none"
                    style={{ 
                      left: `-${40}%`, 
                      top: `-${25}%`,
                      width: '320px',
                      height: '240px'
                    }}
                  />
                </div>
                {/* Puzzle notches */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-white rounded-full" />
                <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-white rounded-full" />
              </div>
            </div>

            <div className="p-4 bg-white">
              <div 
                id="slider-track"
                className="h-10 bg-gray-100 rounded-sm relative flex items-center justify-center"
                onMouseMove={handleDrag}
                onTouchMove={handleDrag}
                onMouseUp={handleEnd}
                onTouchEnd={handleEnd}
                onMouseLeave={handleEnd}
              >
                <span className="text-[10px] text-gray-400 font-medium">Hold and slide</span>
                
                <div 
                  className="absolute left-0 top-0 h-full bg-accent-teal/20"
                  style={{ width: `${sliderPos}%` }}
                />
                
                <div 
                  className="absolute top-0 h-full aspect-square bg-white shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing border border-gray-100"
                  style={{ left: `${sliderPos}%` }}
                  onMouseDown={() => setIsDragging(true)}
                  onTouchStart={() => setIsDragging(true)}
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                  <ChevronRight className="w-5 h-5 text-gray-400 -ml-3" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
