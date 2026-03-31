'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Image as ImageIcon,
  LayoutGrid,
  Gamepad2,
  Activity,
  Crown,
  Percent,
  Settings,
  Users,
  Wallet,
  FileText,
  CircleDot,
  MessageSquare,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/admincts' },
  { name: 'Home Banners', icon: ImageIcon, path: '/admincts/banners' },
  { name: 'Popups', icon: ImageIcon, path: '/admincts/popups' },
  { name: 'Categories', icon: LayoutGrid, path: '/admincts/categories' },
  { name: 'Games', icon: Gamepad2, path: '/admincts/games' },
  { name: 'Activities', icon: Activity, path: '/admincts/activities' },
  { name: 'VIP', icon: Crown, path: '/admincts/vip' },
  { name: 'Promotion', icon: Percent, path: '/admincts/promotion' },
  { name: 'Branding', icon: Settings, path: '/admincts/branding' },
  { name: 'Users', icon: Users, path: '/admincts/users' },
  { name: 'Approvals', icon: Wallet, path: '/admincts/approvals' },
  { name: 'Support Tickets', icon: MessageSquare, path: '/admincts/support-tickets' },
  { name: 'Content Pages', icon: FileText, path: '/admincts/content-pages' },
  { name: 'Wingo Control', icon: CircleDot, path: '/admincts/wingo' }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isLoginRoute = pathname === '/admincts/login';

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admincts/login');
    router.refresh();
  };

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F6F6F6] text-gray-800">
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-5 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsOpen(true)} className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-black text-lg tracking-tight text-gray-800">92 Glory0 Admin</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-bold text-gray-500 flex items-center gap-1.5 hover:text-gray-700"
          disabled={loggingOut}
        >
          <LogOut className="w-4 h-4" />
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </header>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsOpen(false)} />
          <aside className="relative w-72 max-w-[80%] bg-white h-full shadow-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <span className="font-black text-lg text-gray-800">Menu</span>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <nav className="space-y-2">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold',
                      isActive ? 'bg-purple-100 text-accent-purple' : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className={cn('w-4 h-4', isActive ? 'text-accent-purple' : 'text-gray-500')} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <main className="p-6">{children}</main>
    </div>
  );
}
