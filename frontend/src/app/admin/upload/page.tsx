'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, CheckCircle, AlertCircle, Edit2, Search, Sparkles, RefreshCw, Layers } from 'lucide-react';
import api from '@/services/api';
import { PreviewResult, Affiliate } from '@/types';
import { useToast } from '@/components/ui/toast';
import { formatBytes } from '@/lib/utils';

interface FileMatch extends PreviewResult {
  file: File;
  previewUrl: string;
}

export default function BulkUploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [matches, setMatches] = useState<FileMatch[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reassignment state
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [affiliateSearchQuery, setAffiliateSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Affiliate[]>([]);
  const [searchingAffiliates, setSearchingAffiliates] = useState(false);

  // Handle Drag Over / Leave / Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFiles(Array.from(e.target.files));
    }
  };

  // Analyze filenames with backend preview-upload API
  const processFiles = async (files: File[]) => {
    setAnalyzing(true);
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    try {
      const res = await api.post<PreviewResult[]>('/api/admin/affiliate-graphics/preview-upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const previewResults = res.data;
      const fileMatches: FileMatch[] = files.map((file, idx) => {
        const matchInfo = previewResults[idx] || {
          file_name: file.name,
          affiliate_id: null,
          affiliate_name: null,
          coupon_code: null,
          graphic_type: 'graphic',
          status: 'ERROR',
          errors: ['Analysis failed.'],
        };

        return {
          ...matchInfo,
          file,
          previewUrl: URL.createObjectURL(file),
        };
      });

      setMatches((prev) => [...prev, ...fileMatches]);
      toast(`Analyzed ${files.length} file(s) successfully.`, 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to analyze filenames.';
      toast(errMsg, 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  // Remove row from list
  const handleRemoveRow = (index: number) => {
    setMatches((prev) => {
      const updated = [...prev];
      // Revoke preview object URL to free memory
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Search affiliates for manual assignment
  const handleSearchAffiliates = async (query: string) => {
    setAffiliateSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    setSearchingAffiliates(true);
    try {
      const res = await api.get<Affiliate[]>('/api/admin/affiliates/search/', {
        params: { q: query },
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error('Error searching affiliates:', err);
    } finally {
      setSearchingAffiliates(false);
    }
  };

  // Assign affiliate to active row
  const handleAssignAffiliate = (index: number, affiliate: Affiliate) => {
    setMatches((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        affiliate_id: affiliate.id,
        affiliate_name: `${affiliate.first_name} ${affiliate.last_name}`,
        coupon_code: affiliate.coupon_code,
        status: 'MATCHED',
        errors: [],
      };
      return updated;
    });
    setEditingRowIndex(null);
    setAffiliateSearchQuery('');
    setSearchResults([]);
    toast(`Assigned ${affiliate.first_name} to file.`, 'success');
  };

  // Change graphic type manually
  const handleGraphicTypeChange = (index: number, type: string) => {
    setMatches((prev) => {
      const updated = [...prev];
      updated[index].graphic_type = type;
      return updated;
    });
  };

  // Confirm and Save Mappings
  const handleConfirmSave = async () => {
    const errorCount = matches.filter((m) => m.status === 'ERROR').length;
    if (errorCount > 0) {
      toast('Please resolve all matching errors or remove invalid files before saving.', 'warning');
      return;
    }

    if (matches.length === 0) {
      toast('No files to save.', 'warning');
      return;
    }

    setSaving(true);
    const formData = new FormData();

    // Prepare JSON mapping list
    const mappings = matches.map((m) => ({
      file_name: m.file_name,
      affiliate_id: m.affiliate_id,
      graphic_type: m.graphic_type,
    }));

    formData.append('mappings', JSON.stringify(mappings));

    // Append actual file objects
    matches.forEach((m) => {
      formData.append('files', m.file, m.file_name);
    });

    try {
      await api.post('/api/admin/affiliate-graphics/bulk-save/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast(`Successfully saved ${matches.length} graphics to storage!`, 'success');
      // Clean up previews
      matches.forEach((m) => URL.revokeObjectURL(m.previewUrl));
      setMatches([]);
      router.push('/admin/graphics');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to complete bulk save.';
      toast(errMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Bulk Upload Graphics</h1>
          <p className="text-sm text-muted">
            Drag files, analyze names automatically, adjust assignments manually, and upload straight to S3 storage.
          </p>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-card p-12 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/5'
            : 'border-border hover:border-indigo-500/40 hover:bg-white/[0.01]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
          <Upload className="w-8 h-8" />
        </div>
        
        <h3 className="text-lg font-bold mb-1">Drag and drop files here</h3>
        <p className="text-xs text-muted max-w-md">
          Supported formats: <span className="text-white/80 font-medium">JPG, JPEG, PNG, WEBP</span> (Max size: <span className="text-white/80 font-medium">5MB</span> per file). Filenames will be parsed for affiliate matches.
        </p>

        {analyzing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl z-10">
            <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
            <h4 className="font-bold text-sm">Analyzing filenames...</h4>
            <p className="text-xs text-muted">Matching numeric IDs and coupon codes</p>
          </div>
        )}
      </div>

      {/* Preview Table Section */}
      {matches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Upload Queue ({matches.length} files)
            </h2>
            <button
              onClick={() => setMatches([])}
              className="text-xs text-muted hover:text-white transition-colors"
            >
              Clear Queue
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-white/[0.02] text-xs font-bold text-muted uppercase tracking-wider">
                    <th className="p-4 pl-6">Preview</th>
                    <th className="p-4">Filename / Size</th>
                    <th className="p-4">Graphic Type</th>
                    <th className="p-4">Mapped Affiliate</th>
                    <th className="p-4">Coupon</th>
                    <th className="p-4">Match Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-sm">
                  {matches.map((match, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01] transition-colors relative">
                      {/* Image Preview */}
                      <td className="p-4 pl-6">
                        <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={match.previewUrl}
                            alt="preview"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </td>

                      {/* Name / Size */}
                      <td className="p-4 font-semibold text-white/90">
                        <div className="truncate max-w-[200px]" title={match.file_name}>
                          {match.file_name}
                        </div>
                        <span className="text-[10px] text-muted block">
                          {formatBytes(match.file.size)}
                        </span>
                      </td>

                      {/* Graphic Type dropdown */}
                      <td className="p-4">
                        <select
                          value={match.graphic_type}
                          onChange={(e) => handleGraphicTypeChange(idx, e.target.value)}
                          className="glass-input px-2 py-1 text-xs rounded-lg bg-background border border-border"
                        >
                          <option value="graphic">Graphic</option>
                          <option value="banner">Banner</option>
                          <option value="logo">Logo</option>
                        </select>
                      </td>

                      {/* Mapped Affiliate */}
                      <td className="p-4 font-semibold">
                        {match.affiliate_name ? (
                          <div className="text-white/95">
                            {match.affiliate_name}
                            <span className="text-[10px] text-muted block">ID: {match.affiliate_id}</span>
                          </div>
                        ) : (
                          <span className="text-error font-medium">Unassigned</span>
                        )}
                      </td>

                      {/* Coupon */}
                      <td className="p-4 font-semibold text-indigo-400 uppercase">
                        {match.coupon_code || '-'}
                      </td>

                      {/* Status badge & error text */}
                      <td className="p-4">
                        {match.status === 'MATCHED' ? (
                          <div className="inline-flex items-center gap-1 text-success text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Matched
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1 text-error text-xs font-semibold px-2 py-0.5 rounded-full bg-error/10 border border-error/20">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Error
                            </div>
                            {match.errors.map((err, errIdx) => (
                              <span key={errIdx} className="text-[10px] text-error/80 block leading-tight max-w-[180px]">
                                {err}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right space-x-1">
                        <button
                          onClick={() => setEditingRowIndex(idx)}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-white/40 hover:text-indigo-400 hover:bg-indigo-600/10 border border-transparent hover:border-indigo-500/25 transition-all duration-200"
                          title="Manually Assign Affiliate"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveRow(idx)}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-white/40 hover:text-error hover:bg-error/10 border border-transparent hover:border-error/25 transition-all duration-200"
                          title="Remove File"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setMatches([])}
              className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 font-semibold text-sm transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold text-sm transition-all duration-200"
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              Confirm & Save Uploads
            </button>
          </div>
        </div>
      )}

      {/* Manual Reassignment Dialog */}
      {editingRowIndex !== null && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card rounded-2xl p-6 border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base">Assign Affiliate</h3>
              <button
                onClick={() => {
                  setEditingRowIndex(null);
                  setSearchResults([]);
                  setAffiliateSearchQuery('');
                }}
                className="text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Search by name, email or coupon code to manually map{' '}
              <span className="text-white font-semibold">
                {matches[editingRowIndex]?.file_name}
              </span>.
            </p>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search affiliates..."
                value={affiliateSearchQuery}
                onChange={(e) => handleSearchAffiliates(e.target.value)}
                className="w-full glass-input pl-9 pr-3 py-2 text-xs rounded-xl"
                autoFocus
              />
            </div>

            {/* Search Results */}
            <div className="max-h-[200px] overflow-y-auto space-y-1 divide-y divide-border/40">
              {searchingAffiliates ? (
                <div className="text-center py-6 text-xs text-muted">
                  <RefreshCw className="w-4.5 h-4.5 animate-spin mx-auto mb-2 text-indigo-400" />
                  Searching affiliates database...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((affiliate) => (
                  <button
                    key={affiliate.id}
                    onClick={() => handleAssignAffiliate(editingRowIndex, affiliate)}
                    className="w-full text-left p-3 rounded-lg hover:bg-indigo-600/10 hover:border-indigo-500/20 border border-transparent transition-all flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {affiliate.first_name} {affiliate.last_name}
                      </span>
                      <span className="text-[10px] text-muted block">{affiliate.email}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-400 uppercase block">
                        {affiliate.coupon_code}
                      </span>
                      <span className="text-[9px] text-muted block">ID: {affiliate.id}</span>
                    </div>
                  </button>
                ))
              ) : affiliateSearchQuery ? (
                <div className="text-center py-6 text-xs text-muted">
                  No affiliates found matching search.
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted">
                  Start typing to search active affiliates.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
