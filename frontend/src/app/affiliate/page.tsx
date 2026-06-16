'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Download, RefreshCw, LogOut, Layout, Image, HardDrive, Tag, Mail, Sparkles, ExternalLink } from 'lucide-react';
import api from '@/services/api';
import { AffiliateGraphic } from '@/types';
import { useToast } from '@/components/ui/toast';
import { formatBytes } from '@/lib/utils';

export default function AffiliateDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [mockAffiliateId, setMockAffiliateId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('mock_role');
      const affId = localStorage.getItem('mock_affiliate_id');
      if (role !== 'affiliate' || !affId) {
        // Redirect if not simulated as affiliate
        router.push('/');
      } else {
        setMockAffiliateId(affId);
      }
    }
  }, [router]);

  // Fetch graphics for this affiliate
  const { data, isLoading, isError, refetch, isFetching } = useQuery<{ graphics: AffiliateGraphic[] }>({
    queryKey: ['affiliate-graphics', mockAffiliateId],
    queryFn: async () => {
      const res = await api.get('/api/affiliate/my-graphics/');
      return res.data;
    },
    enabled: !!mockAffiliateId,
  });

  const handleLogout = () => {
    localStorage.removeItem('mock_role');
    localStorage.removeItem('mock_affiliate_id');
    toast('Exited affiliate portal', 'info');
    router.push('/');
  };

  // Trigger download of one or more graphics
  const triggerDownloads = async (ids: string[]) => {
    if (ids.length === 0) return;
    setDownloading(true);
    try {
      const res = await api.get('/api/affiliate/my-graphics/download/', {
        params: { ids: ids.join(',') },
      });
      
      const downloads = res.data.downloads;
      
      // Trigger browser to open or download each url
      downloads.forEach((dl: any) => {
        const a = document.createElement('a');
        a.href = dl.download_url;
        a.target = '_blank';
        a.download = dl.original_filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
      
      toast(`Started download of ${ids.length} files.`, 'success');
      setSelectedIds([]);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Download request failed.';
      toast(errMsg, 'error');
    } finally {
      setDownloading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (!data?.graphics) return;
    if (selectedIds.length === data.graphics.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.graphics.map((g) => g.id));
    }
  };

  // Extract affiliate profile info from first graphic if available
  const firstGraphic = data?.graphics?.[0];
  const profile = firstGraphic?.affiliate_details;

  return (
    <div className="min-h-screen bg-background text-white pb-12">
      {/* Header NavBar */}
      <header className="border-b border-border bg-card/45 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-bold text-white text-sm">
              AP
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight">Affiliate Hub</h1>
              <span className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider">
                Graphics Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
              title="Refresh Graphics"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-error/10 hover:bg-error/20 text-error font-medium text-xs border border-error/20 transition-all duration-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        {/* Profile Card */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-600/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-violet-600/10">
              {profile ? profile.first_name[0] : 'U'}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-violet-500/30 bg-violet-500/5 text-violet-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                Active Partner
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">
                {profile ? `${profile.first_name} ${profile.last_name}` : `Affiliate Account #${mockAffiliateId}`}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted">
                {profile && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-white/30" />
                    {profile.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-white/30" />
                  Coupon: <span className="font-bold text-violet-400 uppercase">{profile?.coupon_code || 'N/A'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center min-w-[100px]">
              <span className="text-[10px] text-muted uppercase font-bold tracking-wider block mb-1">
                Total Files
              </span>
              <span className="text-2xl font-extrabold text-white">
                {data?.graphics?.length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Graphics Actions Bar */}
        {data?.graphics && data.graphics.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Layout className="w-5 h-5 text-violet-400" />
              Promotional Graphics
            </h3>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold border border-white/5 transition-colors"
              >
                {selectedIds.length === data.graphics.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={() => triggerDownloads(selectedIds)}
                disabled={selectedIds.length === 0 || downloading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white font-semibold text-xs transition-colors"
              >
                {downloading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Download Selected ({selectedIds.length})
              </button>
            </div>
          </div>
        )}

        {/* Grid List */}
        {isLoading ? (
          <div className="p-20 text-center text-sm text-muted">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-violet-400" />
            Loading matched graphics...
          </div>
        ) : isError ? (
          <div className="p-20 text-center text-sm text-error border border-error/25 bg-error/5 rounded-2xl">
            Could not fetch promotional graphics. Please check if the backend is running.
          </div>
        ) : !data?.graphics || data.graphics.length === 0 ? (
          <div className="glass-card p-20 text-center rounded-3xl border border-dashed border-border flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/30 mb-4">
              <Image className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base mb-1">No matched promotional graphics</h4>
            <p className="text-xs text-muted max-w-sm">
              Your coupon code and affiliate ID haven&apos;t been matched to any bulk uploaded files yet. Please contact the administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {data.graphics.map((graphic) => {
              const isSelected = selectedIds.includes(graphic.id);
              return (
                <div
                  key={graphic.id}
                  onClick={() => toggleSelect(graphic.id)}
                  className={`glass-card rounded-2xl overflow-hidden border cursor-pointer hover:scale-[1.01] hover:border-violet-500/40 transition-all duration-300 relative group flex flex-col justify-between ${
                    isSelected ? 'border-violet-500 ring-1 ring-violet-500/50 bg-violet-600/5' : 'border-border'
                  }`}
                >
                  <div>
                    {/* Visual Preview */}
                    <div className="h-44 bg-white/5 border-b border-border relative overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={graphic.file_url}
                        alt={graphic.original_filename}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      
                      {/* Type Badge */}
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-background/80 border border-white/10 backdrop-blur-md">
                        {graphic.graphic_type}
                      </span>

                      {/* Select Indicator */}
                      <div className={`absolute top-3 right-3 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-violet-600 border-violet-500 text-white' 
                          : 'border-white/20 bg-black/40 text-transparent'
                      }`}>
                        ✓
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-sm text-white/90 truncate" title={graphic.original_filename}>
                        {graphic.original_filename}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-muted">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3.5 h-3.5 text-white/20" />
                          {formatBytes(graphic.file_size)}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(graphic.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Individual Download Action Button */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerDownloads([graphic.id]);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-violet-600 hover:text-white transition-all text-xs font-semibold border border-white/5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Image
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
