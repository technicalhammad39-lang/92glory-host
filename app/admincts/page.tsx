'use client';

import React, { useEffect, useState } from 'react';
import { Users, Wallet, ArrowDownRight, ArrowUpRight, Gamepad2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, [token]);

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
