'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@92glory786.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (loading) return;
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password })
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data?.error || 'Login failed.');
      return;
    }

    router.replace('/admincts');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#9499A7] flex justify-center px-3">
      <div className="w-full max-w-[420px] bg-[#EFEFF2] min-h-screen">
        <div className="h-[156px] bg-gradient-to-r from-[#6F8AF4] to-[#E285EA] px-4 pt-4">
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-[120px] h-7">
              <Image src="/92glory-logo.png" alt="92 Glory0" fill sizes="120px" className="object-contain" />
            </div>
          </div>
          <h1 className="text-white text-[28px] font-black leading-none">Admin Login</h1>
          <p className="text-white/95 text-xs mt-2 leading-tight">
            Sign in to access the admin control panel.
            <br />
            This page only supports login.
          </p>
        </div>

        <div className="px-4 pb-6 pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-[#151D39] text-lg font-bold flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-[#DF84EF]" /> Email
              </label>
              <input
                type="email"
                className="h-11 w-full bg-white border border-[#E2E2E8] rounded-xl px-3 text-base outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Please enter admin email"
              />
            </div>

            <div>
              <label className="text-[#151D39] text-lg font-bold flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-[#DF84EF]" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="h-11 w-full bg-white border border-[#E2E2E8] rounded-xl px-3 pr-10 text-base outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onLogin();
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B2B5C1]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

            <button
              onClick={onLogin}
              disabled={loading}
              className="w-full h-12 rounded-full bg-gradient-to-r from-[#6F8AF4] to-[#E285EA] text-white text-2xl font-black tracking-widest disabled:opacity-70"
            >
              {loading ? 'Please wait...' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
