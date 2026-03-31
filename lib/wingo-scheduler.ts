import { isDatabaseReady } from '@/lib/db';
import { ensureCurrentRound, settleDueRounds } from '@/lib/wingo-engine';

const DURATIONS = [60, 180, 300] as const;
const SCHEDULER_INTERVAL_MS = Number(process.env.WINGO_SCHEDULER_INTERVAL_MS || 1000);

declare global {
  var __wingoSchedulerStarted: boolean | undefined;
  var __wingoSchedulerTimer: NodeJS.Timeout | undefined;
  var __wingoSchedulerRunning: boolean | undefined;
}

async function schedulerTick() {
  if (globalThis.__wingoSchedulerRunning) return;
  globalThis.__wingoSchedulerRunning = true;

  try {
    if (!(await isDatabaseReady())) return;
    const now = new Date();

    for (const durationSec of DURATIONS) {
      await ensureCurrentRound(durationSec, now);
      await settleDueRounds(durationSec, now);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[wingo-scheduler] tick failed:', error);
    }
  } finally {
    globalThis.__wingoSchedulerRunning = false;
  }
}

export function startWingoScheduler() {
  if (globalThis.__wingoSchedulerStarted) return;

  globalThis.__wingoSchedulerStarted = true;
  void schedulerTick();
  globalThis.__wingoSchedulerTimer = setInterval(() => {
    void schedulerTick();
  }, SCHEDULER_INTERVAL_MS);
}
