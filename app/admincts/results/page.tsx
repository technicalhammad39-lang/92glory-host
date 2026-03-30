'use client';

import React, { useState } from 'react';
import { 
  Trophy, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

const results = [
  { id: '202603271415', game: 'Win Go 1Min', result: 'Small / Green', number: '3', status: 'Settled', time: '14:15:00' },
  { id: '202603271414', game: 'Win Go 1Min', result: 'Big / Red', number: '8', status: 'Settled', time: '14:14:00' },
  { id: '202603271413', game: 'Win Go 1Min', result: 'Small / Red', number: '2', status: 'Settled', time: '14:13:00' },
  { id: '202603271412', game: 'Win Go 1Min', result: 'Big / Green', number: '7', status: 'Settled', time: '14:12:00' },
  { id: '202603271416', game: 'Win Go 1Min', result: '-', number: '-', status: 'Pending', time: '14:16:00' },
];

export default function ResultManagement() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 italic uppercase">RESULTS MANAGEMENT</h1>
          <p className="text-gray-400 text-sm font-bold">View and manage game results and outcomes.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-100 px-6 py-3 rounded-2xl flex items-center gap-2 text-gray-600 font-bold hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw className="w-5 h-5" />
            <span>Sync Results</span>
          </button>
          <button className="gradient-bg text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-100 font-bold active:scale-95 transition-transform">
            <Trophy className="w-5 h-5" />
            <span>Manual Result</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
          <Search className="w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by period ID..." className="bg-transparent text-sm outline-none w-full font-medium" />
        </div>
        <div className="flex gap-3">
          <select className="bg-white border border-gray-100 px-4 py-3 rounded-xl text-gray-600 font-bold outline-none focus:ring-2 focus:ring-accent-purple/20">
            <option>All Games</option>
            <option>Win Go 1Min</option>
            <option>Win Go 3Min</option>
            <option>TRX Win 1Min</option>
          </select>
          <select className="bg-white border border-gray-100 px-4 py-3 rounded-xl text-gray-600 font-bold outline-none focus:ring-2 focus:ring-accent-purple/20">
            <option>All Status</option>
            <option>Settled</option>
            <option>Pending</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Period ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Game</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Outcome</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Number</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {results.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-accent-purple">{res.id}</td>
                  <td className="px-6 py-4 text-xs font-black text-gray-800 italic">{res.game}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                      res.result.includes('Green') ? 'bg-green-50 text-green-500' : 
                      res.result.includes('Red') ? 'bg-red-50 text-red-500' : 
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {res.result}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto font-black text-sm text-white ${
                      parseInt(res.number) % 2 === 0 ? 'bg-red-500' : 'bg-green-500'
                    } ${res.number === '-' ? 'bg-gray-200' : ''}`}>
                      {res.number}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                      res.status === 'Settled' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'
                    }`}>
                      {res.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-400">{res.time}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Result">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400 font-bold">Showing 1 to 5 of 14,400 results</p>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-xs shadow-md">1</button>
            <button className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors">2</button>
            <button className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
