import React from 'react';
import Sidebar from '@/components/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
