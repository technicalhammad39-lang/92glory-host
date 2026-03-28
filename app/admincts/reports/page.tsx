'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Wallet, 
  Gamepad2, 
  Download,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

const reports = [
  { id: 1, name: 'Daily Financial Report', description: 'Summary of deposits, withdrawals, and net profit.', icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 2, name: 'User Growth Report', description: 'New registrations, active users, and retention rates.', icon: Users, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 3, name: 'Betting Activity Report', description: 'Total bets, win/loss ratio, and popular games.', icon: Gamepad2, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 4, name: 'Agent & Commission Report', description: 'Referral bonuses, agent earnings, and hierarchy stats.', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 5, name: 'Game Performance Report', description: 'RTP analysis, house edge, and game-specific stats.', icon: BarChart3, color: 'text-teal-500', bg: 'bg-teal-50' },
];

export default function ReportManagement() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 italic uppercase">REPORTS & ANALYTICS</h1>
          <p className="text-gray-400 text-sm font-bold">Generate and download detailed system reports.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-100 px-6 py-3 rounded-2xl flex items-center gap-2 text-gray-600 font-bold hover:bg-gray-50 transition-colors shadow-sm">
            <Calendar className="w-5 h-5" />
            <span>Select Range</span>
          </button>
          <button className="gradient-bg text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-100 font-bold active:scale-95 transition-transform">
            <Download className="w-5 h-5" />
            <span>Download All</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Monthly Revenue</p>
          <div className="flex items-center justify-between">
            <p className="text-xl font-black text-gray-800 italic">₨ 4.2M</p>
            <span className="text-green-500 text-[10px] font-black bg-green-50 px-2 py-1 rounded-full">+18%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Monthly Payouts</p>
          <div className="flex items-center justify-between">
            <p className="text-xl font-black text-gray-800 italic">₨ 1.8M</p>
            <span className="text-red-500 text-[10px] font-black bg-red-50 px-2 py-1 rounded-full">-5%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Commission</p>
          <div className="flex items-center justify-between">
            <p className="text-xl font-black text-gray-800 italic">₨ 450k</p>
            <span className="text-blue-500 text-[10px] font-black bg-blue-50 px-2 py-1 rounded-full">+12%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">House Edge (Avg)</p>
          <div className="flex items-center justify-between">
            <p className="text-xl font-black text-gray-800 italic">4.2%</p>
            <span className="text-teal-500 text-[10px] font-black bg-teal-50 px-2 py-1 rounded-full">Stable</span>
          </div>
        </div>
      </div>

      {/* Report List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <motion.div 
            key={report.id}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6 group cursor-pointer"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${report.bg}`}>
              <report.icon className={`w-8 h-8 ${report.color}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-gray-800 italic group-hover:text-accent-purple transition-colors uppercase">{report.name}</h3>
              <p className="text-gray-400 text-xs font-bold mt-1">{report.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-accent-purple hover:text-white transition-all shadow-sm">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
