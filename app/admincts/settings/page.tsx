'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Globe, 
  Shield, 
  Wallet, 
  Bell, 
  Database, 
  Lock, 
  Save,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

const settingsTabs = [
  { id: 'site', name: 'Site Config', icon: Globe },
  { id: 'payment', name: 'Payment Methods', icon: Wallet },
  { id: 'security', name: 'Security & Auth', icon: Shield },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'system', name: 'System Logs', icon: Database },
];

export default function SettingManagement() {
  const [activeTab, setActiveTab] = useState('site');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 italic uppercase">SYSTEM SETTINGS</h1>
          <p className="text-gray-400 text-sm font-bold">Configure your platform, payment gateways, and security.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-100 px-6 py-3 rounded-2xl flex items-center gap-2 text-gray-600 font-bold hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw className="w-5 h-5" />
            <span>Reset Cache</span>
          </button>
          <button className="gradient-bg text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-100 font-bold active:scale-95 transition-transform">
            <Save className="w-5 h-5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Settings Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="w-full lg:w-64 shrink-0 space-y-2">
          {settingsTabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
                activeTab === tab.id ? 'gradient-bg text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 border border-gray-100'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span className="text-sm font-black uppercase tracking-tight">{tab.name}</span>
            </button>
          ))}
        </aside>

        {/* Settings Content */}
        <div className="flex-1 space-y-8">
          {/* Site Config Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
              <Globe className="w-6 h-6 text-accent-purple" />
              <h3 className="text-lg font-black text-gray-800 italic uppercase">SITE CONFIGURATION</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Site Name</label>
                <input type="text" defaultValue="92 Glory0" className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-accent-purple/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Support Telegram</label>
                <input type="text" defaultValue="@92Glory0_Support" className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-accent-purple/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Maintenance Mode</label>
                <div className="flex items-center gap-4 mt-2">
                  <button className="flex-1 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-xs font-black text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">ENABLE</button>
                  <button className="flex-1 gradient-bg px-4 py-3 rounded-xl text-xs font-black text-white shadow-md">DISABLE</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Default Currency</label>
                <select className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-accent-purple/20">
                  <option>PKR (₨)</option>
                  <option>USDT ($)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Config Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
              <Wallet className="w-6 h-6 text-accent-purple" />
              <h3 className="text-lg font-black text-gray-800 italic uppercase">PAYMENT GATEWAYS</h3>
            </div>

            <div className="space-y-4">
              {['JazzCash', 'Easypaisa', 'USDT (TRC20)'].map((method) => (
                <div key={method} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-accent-purple transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <Wallet className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-800 italic">{method}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Active & Functional</p>
                    </div>
                  </div>
                  <button className="text-accent-purple text-xs font-bold hover:underline">Configure</button>
                </div>
              ))}
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
              <Lock className="w-6 h-6 text-accent-purple" />
              <h3 className="text-lg font-black text-gray-800 italic uppercase">SECURITY SETTINGS</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-accent-purple/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Two-Factor Auth</label>
                <div className="flex items-center gap-4 mt-2">
                  <button className="flex-1 gradient-bg px-4 py-3 rounded-xl text-xs font-black text-white shadow-md">ENABLED</button>
                  <button className="flex-1 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-xs font-black text-gray-400 hover:bg-gray-100 transition-colors">DISABLE</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
