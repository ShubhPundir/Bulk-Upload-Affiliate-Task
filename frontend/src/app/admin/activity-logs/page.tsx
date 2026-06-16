'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Calendar, User, Database, RefreshCw, ChevronDown, ChevronUp, Info, Globe, Shield } from 'lucide-react';
import api from '@/services/api';
import { ActivityLog, PaginatedResponse } from '@/types';
import { useToast } from '@/components/ui/toast';

interface MetaOptions {
  actions: string[];
  entity_types: string[];
  users: string[];
}

export default function ActivityLogsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Fetch unique options for dropdown filters
  const { data: optionsData } = useQuery<MetaOptions>({
    queryKey: ['admin-activity-logs-options'],
    queryFn: async () => {
      const res = await api.get('/api/admin/activity-logs/options/');
      return res.data;
    },
  });

  // Fetch logs with filters and pagination
  const { data, isLoading, isError, refetch, isFetching } = useQuery<PaginatedResponse<ActivityLog>>({
    queryKey: ['admin-activity-logs', page, search, actionFilter, entityTypeFilter],
    queryFn: async () => {
      const params: Record<string, any> = { page };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (entityTypeFilter) params.entity_type = entityTypeFilter;

      const res = await api.get('/api/admin/activity-logs/', { params });
      return res.data;
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('');
    setEntityTypeFilter('');
    setPage(1);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'admin_login':
      case 'login':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'graphic_upload':
      case 'upload':
      case 'bulk_upload_completion':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'graphic_delete':
      case 'delete':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'affiliate_created':
      case 'affiliate_update':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
  };

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Activity Audit Logs</h1>
          <p className="text-sm text-muted">
            Track and audit system activities, uploaded materials, administrative actions, and logins.
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
      <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-end lg:items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by Action, User, or Entity ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-2 min-w-[200px] w-full lg:w-auto">
          <Filter className="w-4 h-4 text-muted flex-shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full glass-input px-3 py-2.5 rounded-xl text-sm bg-background border border-border"
          >
            <option value="">All Actions</option>
            {optionsData?.actions.map((act) => (
              <option key={act} value={act}>
                {formatActionName(act)}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Type Filter */}
        <div className="flex items-center gap-2 min-w-[200px] w-full lg:w-auto">
          <Database className="w-4 h-4 text-muted flex-shrink-0" />
          <select
            value={entityTypeFilter}
            onChange={(e) => {
              setEntityTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full glass-input px-3 py-2.5 rounded-xl text-sm bg-background border border-border"
          >
            <option value="">All Entity Types</option>
            {optionsData?.entity_types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        {(search || actionFilter || entityTypeFilter) && (
          <button
            onClick={handleResetFilters}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/5 w-full lg:w-auto text-center"
          >
            Reset
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-border">
        {isLoading ? (
          <div className="p-20 text-center text-sm text-muted">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-400" />
            Loading system activity logs...
          </div>
        ) : isError ? (
          <div className="p-20 text-center text-sm text-error border border-error/20 bg-error/5 m-4 rounded-xl">
            Failed to load audit logs. Please make sure the backend server is running correctly.
          </div>
        ) : !data?.results || data.results.length === 0 ? (
          <div className="p-20 text-center text-sm text-muted">
            No activity logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-white/[0.02] text-xs font-bold text-muted uppercase tracking-wider">
                  <th className="p-4 pl-6 w-[80px]">Details</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Entity Type</th>
                  <th className="p-4">Entity ID</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {data.results.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => toggleExpand(log.id)}
                        className="hover:bg-white/[0.01] transition-colors cursor-pointer group"
                      >
                        {/* Expand Button */}
                        <td className="p-4 pl-6 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(log.id);
                            }}
                            className="inline-flex items-center justify-center p-1 rounded-md text-white/40 group-hover:text-indigo-400 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Action Badge */}
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {formatActionName(log.action)}
                          </span>
                        </td>

                        {/* User */}
                        <td className="p-4 font-semibold text-white/90">
                          <div className="flex items-center gap-1.5">
                            {log.user.toLowerCase().startsWith('admin') ? (
                              <Shield className="w-3.5 h-3.5 text-indigo-400" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-white/40" />
                            )}
                            <span>{log.user}</span>
                          </div>
                        </td>

                        {/* Entity Type */}
                        <td className="p-4 text-muted">
                          {log.entity_type ? (
                            <span className="font-mono text-xs">{log.entity_type}</span>
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </td>

                        {/* Entity ID */}
                        <td className="p-4 text-muted font-mono text-xs max-w-[150px] truncate" title={log.entity_id || ''}>
                          {log.entity_id ? (
                            <span>{log.entity_id}</span>
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="p-4 text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-white/30" />
                            {new Date(log.created_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </td>
                      </tr>

                      {/* Expandable Metadata Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-white/[0.015] border-b border-border/60 p-6">
                            <div className="space-y-4 max-w-4xl mx-auto">
                              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                                <Info className="w-4 h-4" />
                                <span>Activity Details & Metadata</span>
                              </div>

                              {/* Structured Metadata Rendering */}
                              {Object.keys(log.metadata).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Left Panel: Common Contextual Info */}
                                  <div className="space-y-3">
                                    {log.metadata.ip_address && (
                                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                        <span className="text-xs text-muted flex items-center gap-1.5">
                                          <Globe className="w-3.5 h-3.5" /> IP Address
                                        </span>
                                        <span className="text-xs font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded">
                                          {log.metadata.ip_address}
                                        </span>
                                      </div>
                                    )}
                                    {log.metadata.user_agent && (
                                      <div className="flex flex-col gap-1 border-b border-border/40 pb-2">
                                        <span className="text-xs text-muted">User Agent</span>
                                        <span className="text-xs text-white/80 bg-white/5 p-2 rounded leading-relaxed break-all font-mono">
                                          {log.metadata.user_agent}
                                        </span>
                                      </div>
                                    )}
                                    {log.metadata.status && (
                                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                        <span className="text-xs text-muted">Status</span>
                                        <span className={`text-xs font-bold uppercase ${
                                          log.metadata.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                                        }`}>
                                          {log.metadata.status}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right Panel: Event Specific Metadata */}
                                  <div className="space-y-2">
                                    <div className="text-xs text-muted mb-2">Payload Data</div>
                                    <div className="max-h-[200px] overflow-y-auto rounded-xl bg-black/40 border border-border/60 p-4 font-mono text-xs text-indigo-200">
                                      <pre className="whitespace-pre-wrap word-break-all">
                                        {JSON.stringify(
                                          // Filter out ip_address and user_agent if already rendered to keep it clean
                                          Object.fromEntries(
                                            Object.entries(log.metadata).filter(
                                              ([key]) => !['ip_address', 'user_agent'].includes(key)
                                            )
                                          ),
                                          null,
                                          2
                                        )}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-muted italic">
                                  No additional metadata available for this activity log.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
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
              of <span className="font-bold text-white">{data.count}</span> logs
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
    </div>
  );
}
