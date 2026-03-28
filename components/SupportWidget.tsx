'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const WIDGET_SIZE = 56;
const EDGE_GAP = 10;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function SupportWidget() {
  const router = useRouter();
  const areaRef = useRef<HTMLDivElement | null>(null);
  const movedRef = useRef(false);
  const dragStateRef = useRef<{ pointerId: number | null; offsetX: number; offsetY: number }>({
    pointerId: null,
    offsetX: 0,
    offsetY: 0
  });
  const [pos, setPos] = useState({ x: EDGE_GAP, y: 220 });
  const [ready, setReady] = useState(false);

  const clampToArea = useCallback((x: number, y: number) => {
    const area = areaRef.current;
    if (!area) return { x, y };
    const maxX = area.clientWidth - WIDGET_SIZE - EDGE_GAP;
    const maxY = area.clientHeight - WIDGET_SIZE - EDGE_GAP;
    return {
      x: clamp(x, EDGE_GAP, maxX),
      y: clamp(y, EDGE_GAP, maxY)
    };
  }, []);

  useEffect(() => {
    const setDefaultPos = () => {
      const area = areaRef.current;
      if (!area) return;

      if (!ready) {
        const startX = area.clientWidth - WIDGET_SIZE - EDGE_GAP;
        const startY = Math.max(EDGE_GAP, Math.floor(area.clientHeight * 0.58));
        setPos(clampToArea(startX, startY));
        setReady(true);
        return;
      }

      setPos((prev) => clampToArea(prev.x, prev.y));
    };

    setDefaultPos();
    window.addEventListener('resize', setDefaultPos);
    return () => window.removeEventListener('resize', setDefaultPos);
  }, [clampToArea, ready]);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!ready) return;
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    movedRef.current = false;
    dragStateRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left - pos.x,
      offsetY: e.clientY - rect.top - pos.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!areaRef.current) return;
    if (dragStateRef.current.pointerId !== e.pointerId) return;

    const rect = areaRef.current.getBoundingClientRect();
    const nextX = e.clientX - rect.left - dragStateRef.current.offsetX;
    const nextY = e.clientY - rect.top - dragStateRef.current.offsetY;
    const next = clampToArea(nextX, nextY);

    if (Math.abs(next.x - pos.x) > 2 || Math.abs(next.y - pos.y) > 2) {
      movedRef.current = true;
    }

    setPos(next);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current.pointerId !== e.pointerId) return;
    dragStateRef.current.pointerId = null;
    if (!movedRef.current) {
      router.push('/account/customer-service');
    }
  };

  return (
    <div ref={areaRef} className="fixed inset-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] pointer-events-none z-[55]">
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="absolute pointer-events-auto w-14 h-14 rounded-full overflow-hidden active:scale-95"
        style={{ left: pos.x, top: pos.y, touchAction: 'none', opacity: ready ? 1 : 0 }}
        aria-label="Support"
      >
        <Image src="/support-icon.webp" alt="Support" fill className="object-cover" priority />
      </button>
    </div>
  );
}
