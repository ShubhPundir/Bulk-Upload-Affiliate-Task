'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Trash2, Calendar, FileText, HardDrive, RefreshCw, Eye } from 'lucide-react';
import api from '@/services/api';
import { AffiliateGraphic, PaginatedResponse } from '@/types';
import { useToast } from '@/components/ui/toast';
import { formatBytes } from '@/lib/utils';

export default function GraphicsListPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [graphicType, setGraphicType] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch graphics with React Query
  const { data, isLoading, isError, refetch, isFetching } = useQuery<PaginatedResponse<AffiliateGraphic>>({
    queryKey: ['admin-graphics', page, search, graphicType],
    queryFn: async () => {
      const params: Record<string, any> = { page };
      if (search) {
        // If query is numeric, filter by affiliate ID, otherwise coupon code
        if (/^\d+$/.test(search)) {
          params.affiliate = search;
        } else {
          params.coupon_code = search;
        }
      }
      if (graphicType) {
        params.graphic_type = graphicType;
      }
      const res = await api.get('/api/admin/affiliate-graphics/', { params });
      return res.data;
    },
  });

  // Soft Delete Graphic Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/admin/affiliate-graphics/${id}/`);
    },
    onSuccess: () => {
      toast('Graphic deleted and removed from storage', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-graphics'] });
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.error || 'Failed to delete graphic';
      toast(errMsg, 'error');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this graphic? The physical file will also be removed from storage.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Graphics Inventory</h1>
          <p className="text-sm text-muted">
            Manage promotional graphics, view matched affiliates, and clean up inactive assets.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/5 transition-all duration-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by Affiliate ID (e.g. 101) or Coupon (e.g. SAVE20)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={graphicType}
            onChange={(e) => {
              setGraphicType(e.target.value);
              setPage(1);
            }}
            className="w-full glass-input px-3 py-2.5 rounded-xl text-sm bg-background border border-border"
          >
            <option value="">All Graphic Types</option>
            <option value="banner">Banners</option>
            <option value="logo">Logos</option>
            <option value="graphic">Standard Graphics</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-border">
        {isLoading ? (
          <div className="p-20 text-center text-sm text-muted">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-400" />
            Loading graphics database...
          </div>
        ) : isError ? (
          <div className="p-20 text-center text-sm text-error border border-error/20 bg-error/5 m-4 rounded-xl">
            Failed to load graphics list. Please check that the backend is running.
          </div>
        ) : !data?.results || data.results.length === 0 ? (
          <div className="p-20 text-center text-sm text-muted">
            No graphics found matching the active filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-white/[0.02] text-xs font-bold text-muted uppercase tracking-wider">
                  <th className="p-4 pl-6">Preview</th>
                  <th className="p-4">Original Filename</th>
                  <th className="p-4">Graphic Type</th>
                  <th className="p-4">Affiliate / Coupon</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Uploaded At</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {data.results.map((graphic) => (
                  <tr key={graphic.id} className="hover:bg-white/[0.01] transition-colors group">
                    {/* Preview Image */}
                    <td className="p-4 pl-6">
                      <div className="relative w-12 h-12 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center group-hover:border-indigo-500/40 transition-colors">
                        {/* We use standard HTML img */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={graphic.file_url}
                          alt={graphic.original_filename}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            // fallback placeholder icon if S3 link is not reachable
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <button
                          onClick={() => setSelectedImage(graphic.file_url)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* Original Filename */}
                    <td className="p-4 font-semibold text-white/90">
                      <div className="truncate max-w-[200px]" title={graphic.original_filename}>
                        {graphic.original_filename}
                      </div>
                      <span className="text-[10px] text-muted block truncate max-w-[200px]">
                        {graphic.stored_filename}
                      </span>
                    </td>

                    {/* Graphic Type */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        graphic.graphic_type === 'banner'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : graphic.graphic_type === 'logo'
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {graphic.graphic_type}
                      </span>
                    </td>

                    {/* Affiliate Name & Coupon */}
                    <td className="p-4">
                      <div className="font-semibold text-white/90">
                        {graphic.affiliate_details
                          ? `${graphic.affiliate_details.first_name} ${graphic.affiliate_details.last_name}`
                          : `Affiliate #${graphic.affiliate}`}
                      </div>
                      <span className="text-xs text-indigo-400 font-semibold uppercase">
                        {graphic.affiliate_details?.coupon_code || 'N/A'}
                      </span>
                    </td>

                    {/* File Size */}
                    <td className="p-4 text-muted">
                      <span className="inline-flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-white/30" />
                        {formatBytes(graphic.file_size)}
                      </span>
                    </td>

                    {/* Uploaded Date */}
                    <td className="p-4 text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-white/30" />
                        {new Date(graphic.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => handleDelete(graphic.id)}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-white/40 hover:text-error hover:bg-error/10 border border-transparent hover:border-error/25 transition-all duration-200"
                        title="Soft Delete Graphic"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {data && data.count > 0 && (
          <div className="p-4 border-t border-border flex items-center justify-between gap-4 bg-white/[0.01]">
            <span className="text-xs text-muted">
              Showing <span className="font-bold text-white">{(page - 1) * 10 + 1}</span> to{' '}
              <span className="font-bold text-white">
                {Math.min(page * 10, data.count)}
              </span>{' '}
              of <span className="font-bold text-white">{data.count}</span> graphics
            </span>
            <div className="flex gap-2">
              <button
                disabled={!data.previous || isFetching}
                onClick={() => setPage((p) => p - 1)}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-semibold disabled:opacity-40 disabled:hover:bg-white/5 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={!data.next || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-semibold disabled:opacity-40 disabled:hover:bg-white/5 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[80vh] overflow-hidden glass-card p-2 rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Preview"
              className="object-contain max-h-[75vh] w-full rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/55 text-white hover:bg-black/80 w-8 h-8 rounded-full flex items-center justify-center font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
