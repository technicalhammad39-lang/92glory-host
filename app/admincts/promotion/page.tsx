'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

export default function AdminPromotion() {
  const { token } = useAuthStore();
  const [setting, setSetting] = useState<any>(null);
  const [form, setForm] = useState({ commissionRate: 0.1, rebateRate: 0.15, customerService: '' });

  const load = () => {
    fetch('/api/promotion/settings')
      .then((res) => res.json())
      .then((data) => {
        setSetting(data.setting);
        if (data.setting) {
          setForm({
            commissionRate: data.setting.commissionRate,
            rebateRate: data.setting.rebateRate,
            customerService: data.setting.customerService || ''
          });
        }
      });
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    await fetch('/api/promotion/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Promotion Settings</h1>
        <p className="text-gray-400 text-sm">Manage commission and rebate settings.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            step="0.01"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Commission Rate"
            value={form.commissionRate}
            onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })}
          />
          <input
            type="number"
            step="0.01"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Rebate Rate"
            value={form.rebateRate}
            onChange={(e) => setForm({ ...form, rebateRate: Number(e.target.value) })}
          />
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Customer Service Contact"
            value={form.customerService}
            onChange={(e) => setForm({ ...form, customerService: e.target.value })}
          />
        </div>
        <button onClick={submit} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold">
          Save Settings
        </button>
      </div>
    </div>
  );
}
