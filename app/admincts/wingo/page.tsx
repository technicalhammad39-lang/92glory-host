'use client';

import React, { useCallback, useEffect, useState } from 'react';

type AdminRound = {
  issueNumber: string;
  status: 'OPEN' | 'LOCKED' | 'SETTLED';
  lockAt: string;
  endAt: string;
};

export default function AdminWingoControlPage() {
  const [durationSec, setDurationSec] = useState<30 | 60 | 180 | 300>(30);
  const [currentRound, setCurrentRound] = useState<AdminRound | null>(null);
  const [issueNumber, setIssueNumber] = useState('');
  const [resultNumber, setResultNumber] = useState(0);
  const [settleNow, setSettleNow] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadCurrent = useCallback(async () => {
    const response = await fetch(`/api/wingo/current?durationSec=${durationSec}`, { cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.round) return;
    setCurrentRound(data.round);
    setIssueNumber(data.round.issueNumber);
  }, [durationSec]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCurrent();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadCurrent]);

  const submitManualResult = async () => {
    setLoading(true);
    setMessage('');

    const response = await fetch('/api/wingo/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        durationSec,
        issueNumber: issueNumber || undefined,
        resultNumber,
        settleNow
      })
    });

    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data?.error || 'Failed to set result.');
      return;
    }

    setMessage('Manual result applied successfully.');
    loadCurrent();
  };

  const settleDue = async () => {
    setLoading(true);
    setMessage('');
    const response = await fetch('/api/wingo/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationSec })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setMessage(data?.error || 'Failed to settle due rounds.');
      return;
    }
    setMessage('Due rounds settled.');
    loadCurrent();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Wingo Control</h1>
        <p className="text-gray-400 text-sm font-medium">Manual result and settlement controls for Wingo engine.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDurationSec(30)}
            className={`rounded-xl py-2 text-sm font-bold border ${durationSec === 30 ? 'bg-purple-100 text-accent-purple border-purple-300' : 'border-gray-200 text-gray-500'}`}
          >
            30s
          </button>
          <button
            onClick={() => setDurationSec(60)}
            className={`rounded-xl py-2 text-sm font-bold border ${durationSec === 60 ? 'bg-purple-100 text-accent-purple border-purple-300' : 'border-gray-200 text-gray-500'}`}
          >
            60s
          </button>
          <button
            onClick={() => setDurationSec(180)}
            className={`rounded-xl py-2 text-sm font-bold border ${durationSec === 180 ? 'bg-purple-100 text-accent-purple border-purple-300' : 'border-gray-200 text-gray-500'}`}
          >
            3min
          </button>
          <button
            onClick={() => setDurationSec(300)}
            className={`rounded-xl py-2 text-sm font-bold border ${durationSec === 300 ? 'bg-purple-100 text-accent-purple border-purple-300' : 'border-gray-200 text-gray-500'}`}
          >
            5min
          </button>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm">
          <p className="text-gray-400">Current Round</p>
          <p className="font-bold text-gray-700">{currentRound?.issueNumber || '-'}</p>
          <p className="text-xs text-gray-500 mt-1">Status: {currentRound?.status || '-'}</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500">Issue Number</label>
          <input
            value={issueNumber}
            onChange={(e) => setIssueNumber(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400"
            placeholder="Leave current issue or enter specific issue"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500">Result Number (0-9)</label>
          <input
            type="number"
            min={0}
            max={9}
            value={resultNumber}
            onChange={(e) => setResultNumber(Number(e.target.value || 0))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={settleNow} onChange={(e) => setSettleNow(e.target.checked)} />
          Settle immediately
        </label>

        {message && <p className="text-sm font-bold text-purple-600">{message}</p>}

        <div className="grid grid-cols-2 gap-3">
          <button
            disabled={loading}
            onClick={submitManualResult}
            className="rounded-xl py-3 bg-gradient-to-r from-[#6F8DF8] to-[#D97BE8] text-white text-sm font-black disabled:opacity-60"
          >
            {loading ? 'Please wait...' : 'Set Manual Result'}
          </button>
          <button
            disabled={loading}
            onClick={settleDue}
            className="rounded-xl py-3 border border-gray-300 text-gray-700 text-sm font-black disabled:opacity-60"
          >
            Settle Due Rounds
          </button>
        </div>
      </div>
    </div>
  );
}
