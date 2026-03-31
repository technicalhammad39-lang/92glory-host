import { startWingoScheduler } from '@/lib/wingo-scheduler';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    startWingoScheduler();
  }
}
