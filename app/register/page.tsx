'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CaptchaModal } from '@/components/CaptchaModal';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ChevronLeft, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, UserPlus } from 'lucide-react';

type RegisterType = 'phone' | 'email';

export default function RegisterPage() {
  const [registerType, setRegisterType] = useState<RegisterType>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { setUser, setToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const payload = useMemo(() => {
    if (registerType === 'phone') {
      return { phone: phone.trim(), email: '', password, inviteCode };
    }
    return { phone: '', email: email.trim().toLowerCase(), password, inviteCode };
  }, [email, inviteCode, password, phone, registerType]);

  const onRegister = () => {
    setError('');

    if (!payload.phone && !payload.email) {
      setError('Please enter phone or email.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreed) {
      setError('Please agree to Privacy Agreement.');
      return;
    }

    setShowCaptcha(true);
  };

  const onCaptchaSuccess = async () => {
    setShowCaptcha(false);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Register failed');
      return;
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    router.replace('/');
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
          <h1 className="text-white text-[28px] font-black leading-none">Register</h1>
          <p className="text-white/95 text-xs mt-2 leading-tight">Please register by phone number or email</p>
        </div>

        <div className="px-4 pb-6">
          <div className="flex border-b border-[#D9D9DE] mb-5">
            <button
              onClick={() => setRegisterType('phone')}
              className={`flex-1 pt-3 pb-2.5 text-sm font-bold flex flex-col items-center gap-1 ${registerType === 'phone' ? 'text-[#DB79EE] border-b border-[#E38CEC]' : 'text-[#65708B]'}`}
            >
              <Phone className="w-4 h-4" />
              Register your phone
            </button>
            <button
              onClick={() => setRegisterType('email')}
              className={`flex-1 pt-3 pb-2.5 text-sm font-bold flex flex-col items-center gap-1 ${registerType === 'email' ? 'text-[#DB79EE] border-b border-[#E38CEC]' : 'text-[#65708B]'}`}
            >
              <Mail className="w-4 h-4" />
              Register with email
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[#151D39] text-lg font-bold flex items-center gap-2 mb-2">
                {registerType === 'phone' ? <Phone className="w-4 h-4 text-[#DF84EF]" /> : <Mail className="w-4 h-4 text-[#DF84EF]" />}
                {registerType === 'phone' ? 'Phone number' : 'Email'}
              </label>
              {registerType === 'phone' ? (
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
              {registerType === 'phone' && (
                <p className="text-[11px] text-[#E08AEF] mt-1">The phone number cannot start with 0 when registering.</p>
              )}
            </div>

            <div>
              <label className="text-[#151D39] text-lg font-bold flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-[#DF84EF]" /> Set password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="h-11 w-full bg-white border border-[#E2E2E8] rounded-xl px-3 pr-10 text-base outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set password"
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B2B5C1]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[#151D39] text-lg font-bold flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-[#DF84EF]" /> Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="h-11 w-full bg-white border border-[#E2E2E8] rounded-xl px-3 pr-10 text-base outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
                <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B2B5C1]">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[#151D39] text-lg font-bold flex items-center gap-2 mb-2">
                <UserPlus className="w-4 h-4 text-[#DF84EF]" /> Invite code
              </label>
              <input
                type="text"
                className="h-11 w-full bg-white border border-[#E2E2E8] rounded-xl px-3 text-base outline-none"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <button type="button" onClick={() => setAgreed((prev) => !prev)} className="flex items-center gap-2 text-sm text-[#8A8EA3]">
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${agreed ? 'border-[#E38CEC] bg-[#F6DBFA]' : 'border-[#C4C6CF]'}`}>
                {agreed && <ShieldCheck className="w-3 h-3 text-[#D77BEF]" />}
              </span>
              <span>
                I have read and agree{' '}
                <Link href="/privacy-agreement" onClick={(e) => e.stopPropagation()} className="text-[#E06BED] underline">
                  [Privacy Agreement]
                </Link>
              </span>
            </button>

            {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

            <button onClick={onRegister} className="w-full h-12 rounded-full bg-gradient-to-r from-[#6F8AF4] to-[#E285EA] text-white text-2xl font-black tracking-widest">
              Register
            </button>

            <Link href="/login" className="block w-full h-12 rounded-full border border-[#E18BEE] text-[#8E93A4] text-[17px] font-bold text-center leading-[48px]">
              I have an account <span className="text-[#D97DEA]">Login</span>
            </Link>
          </div>
        </div>
      </div>

      <CaptchaModal isOpen={showCaptcha} onClose={() => setShowCaptcha(false)} onSuccess={onCaptchaSuccess} />
    </div>
  );
}
