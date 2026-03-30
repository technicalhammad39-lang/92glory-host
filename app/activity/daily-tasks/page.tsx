'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Clock4 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { MobileTopBar } from '@/components/MobileTopBar';

type TaskItem = {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  rewardAmount: number;
  progressAmount: number;
  canClaim: boolean;
  claimed: boolean;
};

export default function DailyTasksPage() {
  const { token } = useAuthStore();
  const [items, setItems] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    fetch('/api/activity/tasks', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => (res.ok ? res.json().catch(() => null) : null))
      .then((data) => setItems(data?.tasks || []))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const claim = async (taskId: string) => {
    if (!token) return;
    const res = await fetch(`/api/activity/tasks/${taskId}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data?.error || 'Unable to claim task reward.');
      return;
    }
    setMessage('Reward received successfully.');
    load();
  };

  return (
    <div className="min-h-screen bg-[#f6f6f6] pb-6">
      <MobileTopBar title="Activity Award" />

      <div className="px-3 pt-2">
        <div className="h-[110px] rounded-md overflow-hidden relative bg-gradient-to-r from-[#ff8f1f] to-[#ff6a00] text-white p-3">
          <div className="max-w-[65%]">
            <p className="text-[30px] font-semibold leading-none">Activity Award</p>
            <p className="text-[11px] leading-[1.2] mt-1">
              Complete weekly/daily tasks to receive rich rewards. Weekly rewards cannot be accumulated.
            </p>
          </div>
          <div className="absolute right-2 bottom-0 w-[120px] h-[90px]">
            <Image src="/depositbonus.png" alt="Activity award" fill sizes="120px" className="object-contain" />
          </div>
        </div>

        <div className="h-8 mt-2 flex items-center justify-end text-[11px] text-[#5f6f93] gap-1">
          <Clock4 className="w-3.5 h-3.5" />
          Collection record
        </div>

        {loading && <div className="text-[12px] text-[#7a88ab]">Loading...</div>}

        {!loading &&
          items.map((task) => {
            const progress = Number(task.progressAmount || 0);
            const target = Number(task.targetAmount || 0);
            const status = task.claimed ? 'Finished' : task.canClaim ? 'Completed' : 'Unfinished';
            return (
              <div key={task.id} className="bg-white rounded-md border border-[#ededf4] p-2 mb-2">
                <div className="flex items-center justify-between">
                  <span className="h-8 px-4 rounded-l-md rounded-r-2xl bg-[#12b460] text-white text-[16px] flex items-center font-semibold">
                    Daily mission
                  </span>
                  <span className="text-[12px] text-[#65759b]">{status}</span>
                </div>

                <div className="mt-2 text-[12px] text-[#65759b] flex items-center gap-2">
                  <span>{task.title}</span>
                  <span className="text-[#ff4f4f]">
                    {progress.toFixed(0)}/{target.toFixed(0)}
                  </span>
                </div>

                <div className="mt-2 rounded-md bg-[#f7f7fb] border border-[#efeff6] p-2 text-[11px] text-[#6d7ba2] leading-[1.2]">
                  {task.description}
                </div>

                <div className="mt-2 h-7 flex items-center justify-between text-[12px]">
                  <span className="text-[#5f6f93]">Award amount</span>
                  <span className="text-[#f89a2f]">Rs{Number(task.rewardAmount || 0).toFixed(2)}</span>
                </div>

                <button
                  onClick={() => claim(task.id)}
                  disabled={!task.canClaim || task.claimed}
                  className={`h-8 w-full rounded-full border text-[16px] font-semibold ${
                    task.claimed
                      ? 'text-[#b5bfd6] border-[#e3e6ef] bg-[#f4f6fa]'
                      : task.canClaim
                        ? 'text-white border-transparent bg-gradient-to-r from-[#6d8cf6] to-[#e280eb]'
                        : 'text-[#ef8ff3] border-[#ef8ff3] bg-white'
                  }`}
                >
                  {task.claimed ? 'claimed' : task.canClaim ? 'receive' : 'to complete'}
                </button>
              </div>
            );
          })}

        {!loading && !items.length && (
          <div className="pt-10 flex flex-col items-center">
            <div className="w-[190px] h-[120px] relative opacity-70">
              <Image src="/wingo/assets/png/missningBg-c1f02bcd.png" alt="No data" fill sizes="190px" className="object-contain" />
            </div>
            <p className="text-[12px] text-[#a7b1cc] mt-1">No data</p>
          </div>
        )}

        {message && <p className="text-[12px] text-[#d86de9] mt-2">{message}</p>}
      </div>
    </div>
  );
}
