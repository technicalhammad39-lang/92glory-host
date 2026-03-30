'use client';

import React, { useMemo, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { 
  Wallet, 
  ArrowUpCircle,
  ArrowDownCircle,
  ShieldCheck,
  History, 
  FileText, 
  Bell, 
  Gift, 
  BarChart3, 
  Globe, 
  Settings, 
  MessageSquare, 
  HelpCircle, 
  Info, 
  LogOut,
  Copy,
  RefreshCw,
  ChevronRight,
  CircleAlert,
  Gem,
  type LucideIcon
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const uidValue = useMemo(() => {
    if (!user) return '';
    return user.uid || user.inviteCode || user.id.toUpperCase().slice(0, 10);
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) return 'MEMBER0000';
    const fallback = `MEMBER${uidValue.slice(-4) || '0000'}`;
    return (user.name || '').trim() || fallback;
  }, [user, uidValue]);

  const lastLogin = 'Current session';

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    router.replace('/login');
    router.refresh();
  };

  const handleCopyUid = async () => {
    if (!uidValue) return;
    try {
      await navigator.clipboard.writeText(uidValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1300);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFBFE] pb-24">
      <div className="w-full rounded-b-[22px] bg-gradient-to-r from-[#6D8CF6] to-[#DB7BE8] px-4 pt-7 pb-20 overflow-hidden">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-full border-2 border-white/70 overflow-hidden">
              <Image src="/casinocat.png" alt="Avatar" fill sizes="64px" className="object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-white font-semibold text-[21px] leading-none uppercase">{displayName}</h2>
                <div className="bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/30">
                  <Gem className="w-3 h-3 text-white" />
                  <span className="text-[10px] text-white font-semibold">VIP{user.vipLevel || 1}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-white/95">
                <span>UID</span>
                <span>|</span>
                <span>{uidValue}</span>
                <button onClick={handleCopyUid} className="text-white/90">
                  <Copy className="w-3.5 h-3.5 cursor-pointer" />
                </button>
              </div>
              <p className="mt-1 text-[11px] text-white/85">Last login: {lastLogin}</p>
              {copied && <p className="text-[10px] mt-0.5 text-white/90">UID copied</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full border-2 border-white/70 overflow-hidden bg-white/20 flex items-center justify-center">
              <span className="text-white/60 text-xs">No Auth</span>
            </div>
            <div className="flex-1">
              <Link href="/login" className="text-white font-semibold text-lg underline">Log In</Link>
              <p className="text-white/90 text-xs mt-1">Please log in to view account details</p>
            </div>
          </div>
        )}
      </div>

      <div className="mx-4 -mt-10 relative z-10">
        <div className="bg-white rounded-xl p-4 border border-white/80">
          <p className="text-[#65779B] text-[13px] mb-1">Total balance</p>
          <div className="flex items-center gap-2">
            <span className="text-[34px] leading-none font-semibold text-[#0B1B43]">Rs{(user?.balance || 0).toFixed(2)}</span>
            <button className="active:rotate-180 transition-transform duration-300 text-gray-400">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-5">
            <QuickAction href="/wallet" icon={Wallet} label="Wallet" iconClass="text-[#FF5959]" bgClass="bg-[#FFE8E8]" />
            <QuickAction href="/deposit" icon={ArrowUpCircle} label="Deposit" iconClass="text-[#FF9800]" bgClass="bg-[#FFF2DE]" />
            <QuickAction href="/withdraw" icon={ArrowDownCircle} label="Withdraw" iconClass="text-[#519BFF]" bgClass="bg-[#E7F1FF]" />
            <QuickAction href="/vip" icon={ShieldCheck} label="VIP" iconClass="text-[#36C08A]" bgClass="bg-[#E5FAF2]" />
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 grid grid-cols-2 gap-2.5">
        <HistoryCard href="/account/game-history" icon={History} iconClass="text-[#5B9BFF]" bgClass="bg-[#EAF2FF]" title="Game History" subtitle="My game history" />
        <HistoryCard href="/account/transaction" icon={FileText} iconClass="text-[#43C98E]" bgClass="bg-[#E4FAEF]" title="Transaction" subtitle="My transaction history" />
        <HistoryCard href="/deposit" icon={ArrowUpCircle} iconClass="text-[#FF6A6A]" bgClass="bg-[#FFE8E8]" title="Deposit" subtitle="My deposit history" />
        <HistoryCard href="/withdraw" icon={ArrowDownCircle} iconClass="text-[#F5A136]" bgClass="bg-[#FFF1DE]" title="Withdraw" subtitle="My withdraw history" />
      </div>

      <div className="mx-4 mt-4">
        <div className="bg-white rounded-xl overflow-hidden border border-white/80">
          <MenuItem icon={Bell} label="Notification" color="text-[#D77CE8]" badge="7" href="/account/notification" />
          <MenuItem icon={Gift} label="Gifts" color="text-[#D77CE8]" href="/account/gifts" />
          <MenuItem icon={BarChart3} label="Game statistics" color="text-[#D77CE8]" href="/account/game-statistics" />
          <MenuItem icon={Globe} label="Language" value="English" color="text-[#D77CE8]" href="/account/language" />
        </div>
      </div>

      <div className="mx-4 mt-4">
        <div className="bg-white rounded-xl p-4 border border-white/80">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-4 bg-gradient-to-b from-accent-purple to-purple-400 rounded-full"></div>
            <h3 className="text-[15px] font-semibold text-gray-800">Service center</h3>
          </div>
          <div className="grid grid-cols-3 gap-y-6">
            <ServiceItem icon={Settings} label="Settings" href="/account/settings" />
            <ServiceItem icon={FileText} label="Feedback" href="/account/feedback" />
            <ServiceItem icon={Bell} label="Announcement" href="/account/announcement" />
            <ServiceItem icon={MessageSquare} label="Customer Service" href="/account/customer-service" />
            <ServiceItem icon={HelpCircle} label="Beginner's Guide" href="/account/beginners-guide" />
            <ServiceItem icon={Info} label="About us" href="/account/about-us" />
          </div>
        </div>
      </div>

      {isAuthenticated && (
        <div className="mx-4 mt-8 mb-4">
          <button onClick={() => setShowLogoutModal(true)} className="w-full py-3.5 rounded-full border border-[#D694F2] text-[#C86DE9] font-semibold bg-white active:scale-95 transition-transform flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-6">
          <button className="absolute inset-0 bg-black/45" onClick={() => setShowLogoutModal(false)} />
          <div className="relative w-full max-w-[320px] rounded-3xl bg-white p-5">
            <div className="w-14 h-14 rounded-full mx-auto bg-gradient-to-r from-[#7D8EFF] to-[#D66BEE] flex items-center justify-center mb-4">
              <CircleAlert className="w-8 h-8 text-white" />
            </div>
            <p className="text-center text-xl font-bold text-[#1A1A3A] mb-5">Do you want to log out?</p>
            <button
              onClick={handleLogout}
              className="w-full rounded-full py-3 text-white font-bold bg-gradient-to-r from-[#6D8CF6] to-[#E284EA]"
            >
              Confirm
            </button>
            <button
              onClick={() => setShowLogoutModal(false)}
              className="w-full rounded-full py-3 font-bold border border-[#D58AF2] text-[#C26DE9] mt-3"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  iconClass,
  bgClass
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  iconClass: string;
  bgClass: string;
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
      <div className={`w-8 h-8 rounded-full ${bgClass} flex items-center justify-center`}>
        <Icon className={`w-4.5 h-4.5 ${iconClass}`} />
      </div>
      <span className="text-[11px] text-[#17264A] font-medium">{label}</span>
    </Link>
  );
}

function HistoryCard({
  href,
  icon: Icon,
  iconClass,
  bgClass,
  title,
  subtitle
}: {
  href: string;
  icon: LucideIcon;
  iconClass: string;
  bgClass: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="bg-white rounded-lg p-3 flex items-center gap-2.5 border border-white/80 active:scale-[0.99] transition-transform text-left">
      <div className={`w-8 h-8 shrink-0 rounded-md ${bgClass} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconClass}`} />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-[#0D1B42] leading-tight">{title}</p>
        <p className="text-[11px] text-[#7B8AAE] mt-0.5 leading-tight">{subtitle}</p>
      </div>
    </Link>
  );
}

function MenuItem({
  icon: Icon,
  label,
  value,
  color,
  href,
  badge
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  color: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link href={href} className="w-full flex items-center justify-between px-4 py-4 border-b border-[#F4F4FB] last:border-0 active:scale-[0.99] transition-all">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-[15px] font-medium text-[#0D1B42]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-[14px] font-medium text-[#6D7C9F]">{value}</span>}
        {badge && <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#F15A5A] text-white text-[11px] flex items-center justify-center">{badge}</span>}
        <ChevronRight className="w-4 h-4 text-[#9AA5BF]" />
      </div>
    </Link>
  );
}

function ServiceItem({ icon: Icon, label, href }: { icon: LucideIcon; label: string; href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
      <Icon className="w-6 h-6 text-[#D77CE8]" />
      <span className="text-[11px] text-[#5B6788] font-medium text-center leading-tight">{label}</span>
    </Link>
  );
}
