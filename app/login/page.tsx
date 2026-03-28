'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CaptchaModal } from '@/components/CaptchaModal';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ChevronLeft, Eye, EyeOff, Lock, Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-react';

const REMEMBER_KEY = 'auth_remember_credentials';
type LoginType = 'phone' | 'email';

function getRememberedCredentials() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(REMEMBER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      loginType?: LoginType;
      phone?: string;
      email?: string;
      password?: string;
    };
  } catch {
    localStorage.removeItem(REMEMBER_KEY);
    return null;
  }
}

export default function LoginPage() {
  const remembered = getRememberedCredentials();
  const [loginType, setLoginType] = useState<LoginType>(remembered?.loginType || 'phone');
  const [phone, setPhone] = useState(remembered?.phone || '');
  const [email, setEmail] = useState(remembered?.email || '');
  const [password, setPassword] = useState(remembered?.password || '');
  const [remember, setRemember] = useState(!!remembered);
  const [showPassword, setShowPassword] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { setUser, setToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const identifier = useMemo(() => (loginType === 'phone' ? phone.trim() : email.trim().toLowerCase()), [email, loginType, phone]);

  const onLogin = () => {
    setError('');
    if (!identifier || !password) {
      setError('Please enter your credentials.');
      return;
    }
    setShowCaptcha(true);
  };

  const onCaptchaSuccess = async () => {
    setShowCaptcha(false);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      if (remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ loginType, phone, email, password }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      router.replace('/');
    } catch {
      setError('Unable to connect. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#9499A7] flex justify-center px-3 py-0">
      <div className="w-full max-w-[420px] bg-[#EFEFF2] min-h-screen">
        <div className="h-[156px] bg-gradient-to-r from-[#6F8AF4] to-[#E285EA] px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => router.back()} className="text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="relative w-[90px] h-7">
              <Image src="/92glory-logo.png" alt="92GO" fill className="object-contain" />
            </div>
            <button className="text-white text-sm flex items-center gap-1">
              <span>US</span>
              <span>EN</span>
            </button>
          </div>
          <h1 className="text-white text-[28px] font-black leading-none">Log in</h1>
          <p className="text-white/95 text-xs mt-2 leading-tight">
            Please log in with your phone number or email
            <br />
            If you forget your password, please contact customer service
          </p>
        </div>

        <div className="px-4 pb-6">
          <div className="flex border-b border-[#D9D9DE] mb-5">
            <button
              onClick={() => setLoginType('phone')}
              className={`flex-1 pt-3 pb-2.5 text-sm font-bold flex flex-col items-center gap-1 ${loginType === 'phone' ? 'text-[#DB79EE] border-b border-[#E38CEC]' : 'text-[#65708B]'}`}
            >
              <Phone className="w-4 h-4" />
              phone number
            </button>
            <button
              onClick={() => setLoginType('email')}
              className={`flex-1 pt-3 pb-2.5 text-sm font-bold flex flex-col items-center gap-1 ${loginType === 'email' ? 'text-[#DB79EE] border-b border-[#E38CEC]' : 'text-[#65708B]'}`}
            >
              <Mail className="w-4 h-4" />
              Email Login
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[#151D39] text-lg font-bold flex items-center gap-2 mb-2">
                {loginType === 'phone' ? <Phone className="w-4 h-4 text-[#DF84EF]" /> : <Mail className="w-4 h-4 text-[#DF84EF]" />}
                {loginType === 'phone' ? 'Phone number' : 'Email'}
              </label>

              {loginType === 'phone' ? (
                <div className="flex gap-2">
                  <div className="h-11 w-[78px] bg-white border border-[#E2E2E8] rounded-xl flex items-center justify-center text-base text-[#65708B]">
                    +92
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </div>
                  <input
                    type="tel"
                    className="h-11 flex-1 bg-white border border-[#E2E2E8] rounded-xl px-3 text-base outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Please enter the phone number"
                  />
                </div>
              ) : (
                <input
                  type="email"
                  className="h-11 w-full bg-white border border-[#E2E2E8] rounded-xl px-3 text-base outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Please enter the email"
                />
              )}
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
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B2B5C1]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="button" onClick={() => setRemember((prev) => !prev)} className="flex items-center gap-2 text-sm text-[#8A8EA3]">
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${remember ? 'border-[#E38CEC] bg-[#F6DBFA]' : 'border-[#C4C6CF]'}`}>
                {remember && <ShieldCheck className="w-3 h-3 text-[#D77BEF]" />}
              </span>
              Remember password
            </button>

            {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

            <button onClick={onLogin} className="w-full h-12 rounded-full bg-gradient-to-r from-[#6F8AF4] to-[#E285EA] text-white text-2xl font-black tracking-widest">
              Log in
            </button>

            <Link href="/register" className="block w-full h-12 rounded-full border border-[#E18BEE] text-[#DE86EE] text-2xl font-black tracking-widest text-center leading-[48px]">
              Register
            </Link>
          </div>

          <div className="mt-9 flex items-center justify-around">
            <button className="flex flex-col items-center gap-2 text-[#10193A] text-sm font-bold">
              <Lock className="w-7 h-7 text-[#D77BEF]" />
              Forgot password
            </button>
            <button className="flex flex-col items-center gap-2 text-[#10193A] text-sm font-bold">
              <MessageCircle className="w-7 h-7 text-[#D77BEF]" />
              Customer Service
            </button>
          </div>
        </div>
      </div>

      <CaptchaModal isOpen={showCaptcha} onClose={() => setShowCaptcha(false)} onSuccess={onCaptchaSuccess} />
    </div>
  );
}
