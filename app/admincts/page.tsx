'use client';

import React, { useEffect, useState } from 'react';
import { Users, Wallet, ArrowDownRight, ArrowUpRight, Gamepad2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/overview', { credentials: 'include', cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return null;
        return data;
      })
      .then((data) => setStats(data));
  }, []);

  const cards = [
    { name: 'Total Users', value: stats?.users || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Total Deposits', value: stats?.deposits || 0, icon: Wallet, color: 'text-green-500', bg: 'bg-green-50' },
    { name: 'Total Withdrawals', value: stats?.withdrawals || 0, icon: ArrowDownRight, color: 'text-red-500', bg: 'bg-red-50' },
    { name: 'Total Bets', value: stats?.bets || 0, icon: ArrowUpRight, color: 'text-purple-500', bg: 'bg-purple-50' },
    { name: 'Active Games', value: stats?.games || 0, icon: Gamepad2, color: 'text-orange-500', bg: 'bg-orange-50' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-400 text-sm font-medium">Real-time snapshot of the platform.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
        <div className="flex gap-2">
          <Link
            href="/admincts/approvals?type=DEPOSIT"
            className="px-4 py-2 rounded-xl text-xs font-black bg-accent-purple text-white"
          >
            Deposit Approvals
          </Link>
          <Link
            href="/admincts/approvals?type=WITHDRAW"
            className="px-4 py-2 rounded-xl text-xs font-black bg-gray-100 text-gray-600"
          >
            Withdraw Approvals
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((stat) => (
          <div key={stat.name} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{stat.name}</p>
              <p className="text-xl font-black text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
