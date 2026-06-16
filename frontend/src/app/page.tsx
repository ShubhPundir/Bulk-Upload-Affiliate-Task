'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, User, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [affiliateId, setAffiliateId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = () => {
    setLoading(true);
    localStorage.setItem('mock_role', 'admin');
    localStorage.removeItem('mock_affiliate_id');
    toast('Logged in as Administrator', 'success');
    router.push('/admin/graphics');
  };

  const handleAffiliateLogin = (idToUse?: string) => {
    const finalId = idToUse || affiliateId;
    if (!finalId) {
      toast('Please enter or select an Affiliate ID', 'warning');
      return;
    }
    setLoading(true);
    localStorage.setItem('mock_role', 'affiliate');
    localStorage.setItem('mock_affiliate_id', finalId);
    toast(`Logged in as Affiliate (ID: ${finalId})`, 'success');
    router.push('/affiliate');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl p-8 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Affiliate Graphics System
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/50">
            Select Access Role
          </h1>
          <p className="mt-2 text-sm text-muted">
            Choose a role to simulate permissions. No password required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Admin Selector */}
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-indigo-500/40 transition-all duration-300 group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-white">Administrator</h2>
              <p className="text-xs text-muted leading-relaxed mb-6">
                Full access to upload bulk graphics, auto-match affiliates, edit assignments, and delete files.
              </p>
            </div>
            <button
              onClick={handleAdminLogin}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200"
            >
              Enter Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Affiliate Selector */}
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between hover:border-violet-500/40 transition-all duration-300 group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-white">Affiliate</h2>
              <p className="text-xs text-muted leading-relaxed mb-4">
                View assigned promotional banners and generate presigned download links for your specific account.
              </p>

              {/* ID Input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Enter Affiliate ID (e.g. 101)"
                  value={affiliateId}
                  onChange={(e) => setAffiliateId(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-xs rounded-xl"
                />
              </div>

              {/* Seeded Quick Select */}
              <div className="mb-6">
                <span className="text-[10px] text-muted uppercase font-bold tracking-wider block mb-2">
                  Quick Select (Seeded)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: '101', name: 'John (SAVE20)' },
                    { id: '102', name: 'Jane (WINTER50)' },
                    { id: '104', name: 'Alice (SUMMER15)' },
                  ].map((aff) => (
                    <button
                      key={aff.id}
                      onClick={() => handleAffiliateLogin(aff.id)}
                      className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[10px] text-white/80 transition-colors border border-white/5"
                    >
                      {aff.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleAffiliateLogin()}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200"
            >
              Sign In as Affiliate
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
