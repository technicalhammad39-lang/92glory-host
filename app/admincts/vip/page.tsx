'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

export default function AdminVip() {
  const { token } = useAuthStore();
  const [levels, setLevels] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);

  const [levelForm, setLevelForm] = useState({ level: 1, title: 'VIP1', expRequired: 0, payoutDays: 5, betToExp: 100, isOpen: true });
  const [benefitForm, setBenefitForm] = useState({ level: 1, group: 'LEVEL', title: '', description: '', image: '', value: '', secondaryValue: '', order: 0 });

  const load = () => {
    fetch('/api/vip/levels').then((res) => res.json()).then((data) => setLevels(data.levels || []));
    fetch('/api/vip/benefits').then((res) => res.json()).then((data) => setBenefits(data.benefits || []));
  };

  useEffect(() => {
    load();
  }, []);

  const addLevel = async () => {
    await fetch('/api/vip/levels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(levelForm)
    });
    load();
  };

  const addBenefit = async () => {
    await fetch('/api/vip/benefits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(benefitForm)
    });
    load();
  };

  const deleteLevel = async (id: string) => {
    await fetch(`/api/vip/levels/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const deleteBenefit = async (id: string) => {
    await fetch(`/api/vip/benefits/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">VIP Content</h1>
        <p className="text-gray-400 text-sm">Manage VIP levels and benefits.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <h2 className="text-sm font-black text-gray-700">Add VIP Level</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="number" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Level" value={levelForm.level} onChange={(e) => setLevelForm({ ...levelForm, level: Number(e.target.value) })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Title" value={levelForm.title} onChange={(e) => setLevelForm({ ...levelForm, title: e.target.value })} />
          <input type="number" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="EXP Required" value={levelForm.expRequired} onChange={(e) => setLevelForm({ ...levelForm, expRequired: Number(e.target.value) })} />
          <input type="number" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Payout Days" value={levelForm.payoutDays} onChange={(e) => setLevelForm({ ...levelForm, payoutDays: Number(e.target.value) })} />
          <input type="number" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Bet to EXP" value={levelForm.betToExp} onChange={(e) => setLevelForm({ ...levelForm, betToExp: Number(e.target.value) })} />
        </div>
        <button onClick={addLevel} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold">Add Level</button>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <h2 className="text-sm font-black text-gray-700">Add VIP Benefit</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="number" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Level" value={benefitForm.level} onChange={(e) => setBenefitForm({ ...benefitForm, level: Number(e.target.value) })} />
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm" value={benefitForm.group} onChange={(e) => setBenefitForm({ ...benefitForm, group: e.target.value })}>
            <option value="LEVEL">LEVEL</option>
            <option value="MY">MY</option>
          </select>
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Title" value={benefitForm.title} onChange={(e) => setBenefitForm({ ...benefitForm, title: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Description" value={benefitForm.description} onChange={(e) => setBenefitForm({ ...benefitForm, description: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Image path" value={benefitForm.image} onChange={(e) => setBenefitForm({ ...benefitForm, image: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Value" value={benefitForm.value} onChange={(e) => setBenefitForm({ ...benefitForm, value: e.target.value })} />
          <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Secondary Value" value={benefitForm.secondaryValue} onChange={(e) => setBenefitForm({ ...benefitForm, secondaryValue: e.target.value })} />
          <input type="number" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Order" value={benefitForm.order} onChange={(e) => setBenefitForm({ ...benefitForm, order: Number(e.target.value) })} />
        </div>
        <button onClick={addBenefit} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold">Add Benefit</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {levels.map((lvl) => (
          <div key={lvl.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800">VIP{lvl.level}</p>
              <p className="text-xs text-gray-400">EXP {lvl.expRequired}</p>
            </div>
            <button onClick={() => deleteLevel(lvl.id)} className="text-xs font-bold text-red-500">Delete</button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800">{item.title}</p>
              <p className="text-xs text-gray-400">VIP{item.level} • {item.group}</p>
            </div>
            <button onClick={() => deleteBenefit(item.id)} className="text-xs font-bold text-red-500">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
