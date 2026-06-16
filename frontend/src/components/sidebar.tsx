'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Image, Upload, LogOut, ShieldAlert, Users } from 'lucide-react';
import { useToast } from './ui/toast';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('mock_role');
    localStorage.removeItem('mock_affiliate_id');
    toast('Logged out successfully', 'info');
    router.push('/');
  };

  const navItems = [
    {
      name: 'Graphics List',
      href: '/admin/graphics',
      icon: Image,
    },
    {
      name: 'Bulk Upload',
      href: '/admin/upload',
      icon: Upload,
    },
  ];

  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col h-screen sticky top-0">
      {/* Brand header */}
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
          AG
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-white">Affiliate Graphics</h1>
          <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
            Admin Panel
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5">
        <span className="px-3 text-[10px] font-bold text-muted uppercase tracking-wider block mb-3">
          Management
        </span>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Switch Role */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/60">
          <ShieldAlert className="w-4 h-4 text-indigo-400" />
          <span>Simulated: Admin role</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error/10 border border-transparent hover:border-error/20 transition-all duration-200"
        >
          <LogOut className="w-4.5 h-4.5" />
          Exit Dashboard
        </button>
      </div>
    </aside>
  );
}
