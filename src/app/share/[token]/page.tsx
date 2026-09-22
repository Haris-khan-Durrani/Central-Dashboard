'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Users,
  Award,
  XCircle,
  Clock,
  DollarSign,
  PieChart,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  GitMerge,
  BarChart3,
  RefreshCw,
  Globe,
  Lock,
  ChevronDown,
  Eye,
  Calendar,
  Filter,
} from 'lucide-react';
import Agent360Modal from '@/components/modals/Agent360Modal';

interface PublicSharePageProps {
  params: { token: string };
}

export default function PublicSharePage({ params }: PublicSharePageProps) {
  const { token } = params;
  const [data, setData] = useState<any>(null);
  const [shareTitle, setShareTitle] = useState<string>('Sales Command Center');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [executionMs, setExecutionMs] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Dynamic filter states
  const [dateRange, setDateRange] = useState<string>('this_month');
  const [dateBasis, setDateBasis] = useState<string>('created');
  const [pipelineId, setPipelineId] = useState<string>('all');
  const [agentId, setAgentId] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

  // Restore saved filter preferences from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // 1. Try token-specific saved filters first
      const tokenSaved = localStorage.getItem(`central_public_filter_${token}`);
      if (tokenSaved) {
        const parsed = JSON.parse(tokenSaved);
        if (parsed.dateRange) setDateRange(parsed.dateRange);
        if (parsed.dateBasis) setDateBasis(parsed.dateBasis);
        if (parsed.pipelineId) setPipelineId(parsed.pipelineId);
        if (parsed.agentId) setAgentId(parsed.agentId);
        return;
      }

      // 2. Fallback to global public filter preferences
      const globalSaved = localStorage.getItem('central_public_filter_global');
      if (globalSaved) {
        const parsed = JSON.parse(globalSaved);
        if (parsed.dateRange) setDateRange(parsed.dateRange);
        if (parsed.dateBasis) setDateBasis(parsed.dateBasis);
      }
    } catch (e) {
      console.error('Failed to load public filter from localStorage:', e);
    }
  }, [token]);

  const savePublicFilters = (updated: {
    dateRange?: string;
    dateBasis?: string;
    pipelineId?: string;
    agentId?: string;
  }) => {
    if (typeof window === 'undefined') return;
    try {
      const current = {
        dateRange: updated.dateRange ?? dateRange,
        dateBasis: updated.dateBasis ?? dateBasis,
        pipelineId: updated.pipelineId ?? pipelineId,
        agentId: updated.agentId ?? agentId,
      };
      localStorage.setItem(`central_public_filter_${token}`, JSON.stringify(current));
      localStorage.setItem(
        'central_public_filter_global',
        JSON.stringify({ dateRange: current.dateRange, dateBasis: current.dateBasis })
      );
    } catch (e) {
      console.error('Failed to save public filter to localStorage:', e);
    }
  };

  const handleDateRangeChange = (val: string) => {
    setDateRange(val);
    savePublicFilters({ dateRange: val });
  };

  const handleDateBasisChange = (val: string) => {
    setDateBasis(val);
    savePublicFilters({ dateBasis: val });
  };

  const handlePipelineChange = (val: string) => {
    setPipelineId(val);
    savePublicFilters({ pipelineId: val });
  };

  const handleAgentChange = (val: string) => {
    setAgentId(val);
    savePublicFilters({ agentId: val });
  };

  const load = useCallback(async (showSpin = false) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const params = new URLSearchParams({
        dateRange,
        dateBasis,
        pipelineId,
        agentId,
        _t: Date.now().toString(),
      });

      const res = await fetch(`/api/shares/${token}?${params.toString()}`, {
        cache: 'no-store',
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Failed to load dashboard data.');
        return;
      }

      setData(json.data);
      setShareTitle(json.shareTitle || 'Sales Command Center');
      setExecutionMs(json.executionMs || 0);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
      if (showSpin) setTimeout(() => setIsRefreshing(false), 300);
    }
  }, [token, dateRange, dateBasis, pipelineId, agentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // Auto-refresh every 60 seconds
    const timer = setInterval(() => load(false), 60000);
    return () => clearInterval(timer);
  }, [load]);

  const currency = data?.location?.currency || 'AED';

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `${currency} ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${currency} ${(val / 1000).toFixed(0)}K`;
    return `${currency} ${val.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-gray-600">Loading KPI Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-gray-100 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-rose-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard Unavailable</h1>
          <p className="text-sm text-gray-500">{error}</p>
          <p className="text-xs text-gray-400">
            This link may have been revoked or has expired. Contact the dashboard owner for a new link.
          </p>
        </div>
      </div>
    );
  }

  const { summary, agents, pipelineStages, leadSources, location, bottlenecks } = data || {};

  return (
    <div className="min-h-screen w-full flex-1 flex flex-col min-w-0 bg-[#f8f9fc]">
      {/* Public Header — NO settings, NO private data */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">
              {shareTitle}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE DATA
              </span>
              <span className="text-xs text-gray-400">
                {location?.name} · Last updated: {lastRefreshed}
              </span>
              {executionMs > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" /> {executionMs}ms
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Public Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 rounded-xl px-3 py-1.5 border border-gray-200 focus:outline-none focus:border-blue-500 appearance-none pr-8 cursor-pointer transition-colors"
            >
              <option value="today">📅 Today</option>
              <option value="yesterday">📅 Yesterday</option>
              <option value="last_7">📅 Last 7 Days</option>
              <option value="this_month">📅 This Month</option>
              <option value="last_month">📅 Last Month</option>
              <option value="last_30">📅 Last 30 Days</option>
              <option value="this_quarter">📅 This Quarter</option>
              <option value="this_year">📅 This Year</option>
              <option value="all">📅 All Time</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>

          {/* Date Basis */}
          <div className="relative">
            <select
              value={dateBasis}
              onChange={(e) => handleDateBasisChange(e.target.value)}
              className="bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 rounded-xl px-3 py-1.5 border border-gray-200 focus:outline-none focus:border-blue-500 appearance-none pr-8 cursor-pointer transition-colors"
            >
              <option value="created">📊 Basis: Created Date</option>
              <option value="updated">🔄 Basis: Updated Date</option>
              <option value="won_lost">🏆 Basis: Won/Lost Date</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>

          {/* Pipeline Selector */}
          {data?.pipelines && data.pipelines.length > 0 && (
            <div className="relative">
              <select
                value={pipelineId}
                onChange={(e) => handlePipelineChange(e.target.value)}
                className="bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 rounded-xl px-3 py-1.5 border border-gray-200 focus:outline-none focus:border-blue-500 appearance-none pr-8 cursor-pointer transition-colors max-w-[150px] truncate"
              >
                <option value="all">⚙️ Pipeline: All</option>
                {data.pipelines.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2 pointer-events-none" />
            </div>
          )}

          {/* Agent Filter */}
          {agents && agents.length > 0 && (
            <div className="relative">
              <select
                value={agentId}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-700 rounded-xl px-3 py-1.5 border border-gray-200 focus:outline-none focus:border-blue-500 appearance-none pr-8 cursor-pointer transition-colors max-w-[150px] truncate"
              >
                <option value="all">👥 User: All Agents</option>
                {agents.map((ag: any) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2 pointer-events-none" />
            </div>
          )}

          {/* Read-only badge */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>Public View</span>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => load(true)}
            className="p-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200 transition-all"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="w-full flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Summary KPI Cards */}
        {summary && (
          <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 w-full">
            {[
              {
                label: 'Total Leads',
                value: summary.totalLeads.toLocaleString(),
                icon: Users,
                color: 'blue',
                sub: '+Live sync',
                trend: 'up',
              },
              {
                label: 'Open Deals',
                value: summary.openDeals.toLocaleString(),
                icon: Clock,
                color: 'amber',
                sub: '⚡ Active',
                trend: null,
              },
              {
                label: 'Won Deals',
                value: summary.wonDeals.toLocaleString(),
                icon: Award,
                color: 'emerald',
                sub: 'Closed won',
                trend: null,
              },
              {
                label: 'Lost Deals',
                value: summary.lostDeals.toLocaleString(),
                icon: XCircle,
                color: 'rose',
                sub: 'Unqualified',
                trend: 'down',
              },
              {
                label: 'Conversion',
                value: summary.conversionRate,
                icon: PieChart,
                color: 'violet',
                sub: '🎯 Target 15%',
                trend: null,
              },
              {
                label: 'Pipeline Val',
                value: formatCurrency(summary.pipelineValue),
                icon: DollarSign,
                color: 'blue',
                sub: '💰 Weighted',
                trend: null,
              },
              {
                label: 'Tasks Pend',
                value: summary.tasksPending.toLocaleString(),
                icon: CheckSquare,
                color: 'cyan',
                sub: '📋 Active tasks',
                trend: null,
              },
              {
                label: 'Overdue',
                value: summary.tasksOverdue.toLocaleString(),
                icon: AlertTriangle,
                color: 'rose',
                sub: '⚠️ Action needed',
                trend: summary.tasksOverdue > 0 ? 'down' : null,
              },
            ].map((card) => {
              const Icon = card.icon;
              const colorMap: Record<string, string> = {
                blue: 'bg-blue-50 text-blue-600',
                amber: 'bg-amber-50 text-amber-600',
                emerald: 'bg-emerald-50 text-emerald-600',
                rose: 'bg-rose-50 text-rose-600',
                violet: 'bg-violet-50 text-violet-600',
                cyan: 'bg-cyan-50 text-cyan-600',
              };
              const textColorMap: Record<string, string> = {
                blue: 'text-gray-900',
                amber: 'text-gray-900',
                emerald: 'text-emerald-600',
                rose: 'text-rose-600',
                violet: 'text-violet-600',
                cyan: 'text-gray-900',
              };
              return (
                <div
                  key={card.label}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between text-gray-500 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider">{card.label}</span>
                    <div className={`p-1.5 rounded-xl ${colorMap[card.color]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${textColorMap[card.color]}`}>{card.value}</div>
                  <div className="mt-1 text-[11px] font-medium flex items-center gap-1 text-gray-500">
                    {card.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                    {card.trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-500" />}
                    {card.trend === null && <CheckCircle2 className="w-3 h-3 text-gray-300" />}
                    {card.sub}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* 2. Agent KPI Grid */}
        {agents && agents.length > 0 && (
          <section className="space-y-3 w-full">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              SALES TEAM PERFORMANCE
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full items-stretch">
              {agents.map((agent: any) => {
                const initials = agent.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={agent.id}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group"
                  >
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{agent.name}</div>
                          <div className="text-[11px] text-gray-500">{agent.role}</div>
                        </div>
                        <div className="ml-auto text-right">
                          <div className="text-xs text-blue-600 font-bold">{agent.conversion}</div>
                          <div className="text-[10px] text-gray-400">Conv Rate</div>
                        </div>
                      </div>

                      {/* Won / Lost / Open Status Row */}
                      {(() => {
                        const openDeals = Math.max(0, (agent.leads || 0) - (agent.won || 0) - (agent.lost || 0));
                        const stageEntries = agent.stageBreakdown ? Object.entries(agent.stageBreakdown as Record<string, number>) : [];
                        const topStages = stageEntries
                          .filter(([_, count]) => count > 0)
                          .sort((a, b) => (b[1] as number) - (a[1] as number))
                          .slice(0, 3) as [string, number][];

                        return (
                          <>
                            <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                              <div className="bg-emerald-50/80 border border-emerald-100/80 rounded-xl py-1.5 px-1 flex flex-col items-center justify-center">
                                <div className="text-[10px] font-semibold text-emerald-700 flex items-center gap-0.5 justify-center">
                                  <Award className="w-2.5 h-2.5" />
                                  Won
                                </div>
                                <div className="text-sm font-extrabold text-emerald-600 leading-tight">
                                  {agent.won}
                                </div>
                                <div className="text-[9px] text-emerald-600/80 font-medium">
                                  {agent.revenue > 0 ? formatCurrency(agent.revenue) : `${agent.conversion}`}
                                </div>
                              </div>

                              <div className="bg-rose-50/80 border border-rose-100/80 rounded-xl py-1.5 px-1 flex flex-col items-center justify-center">
                                <div className="text-[10px] font-semibold text-rose-700 flex items-center gap-0.5 justify-center">
                                  <XCircle className="w-2.5 h-2.5" />
                                  Lost
                                </div>
                                <div className="text-sm font-extrabold text-rose-600 leading-tight">
                                  {agent.lost || 0}
                                </div>
                                <div className="text-[9px] text-rose-500 font-medium">
                                  {agent.leads > 0 ? `${Math.round(((agent.lost || 0) / agent.leads) * 100)}% rate` : '0%'}
                                </div>
                              </div>

                              <div className="bg-blue-50/80 border border-blue-100/80 rounded-xl py-1.5 px-1 flex flex-col items-center justify-center">
                                <div className="text-[10px] font-semibold text-blue-700 flex items-center gap-0.5 justify-center">
                                  <GitMerge className="w-2.5 h-2.5" />
                                  Open
                                </div>
                                <div className="text-sm font-extrabold text-blue-600 leading-tight">
                                  {openDeals}
                                </div>
                                <div className="text-[9px] text-blue-500 font-medium">
                                  {agent.conversion} conv
                                </div>
                              </div>
                            </div>

                            {/* Pipeline Stages Mini Breakdown with min-height for perfect alignment */}
                            <div className="mb-3 p-2 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1.5 min-h-[88px] flex flex-col justify-center">
                              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <GitMerge className="w-2.5 h-2.5 text-gray-400" />
                                Pipeline Stages
                              </div>
                              {topStages.length > 0 ? (
                                <div className="space-y-1">
                                  {topStages.map(([stageName, count], idx) => {
                                    const pct = Math.min(100, Math.round((count / (agent.leads || 1)) * 100));
                                    const colors = ['bg-blue-500', 'bg-sky-500', 'bg-amber-500', 'bg-purple-500', 'bg-emerald-500'];
                                    const barColor = colors[idx % colors.length];
                                    return (
                                      <div key={stageName} className="space-y-0.5">
                                        <div className="flex justify-between items-center text-[10px]">
                                          <span className="text-gray-600 truncate max-w-[120px] font-medium" title={stageName}>
                                            {stageName}
                                          </span>
                                          <span className="font-bold text-gray-800">{count}</span>
                                        </div>
                                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full ${barColor} rounded-full transition-all duration-300`}
                                            style={{ width: `${Math.max(8, pct)}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-[10px] text-gray-400 italic text-center py-2">
                                  No active pipeline stages
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-500">
                          <span>Revenue Progress</span>
                          <span className="font-semibold text-blue-600">{agent.targetProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, agent.targetProgress)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Pinned Section: Tasks & Action Button */}
                    <div className="mt-auto pt-3">
                      {/* Clean Task Stats */}
                      <div className="flex items-center justify-between text-[11px] text-gray-600 bg-gray-50 rounded-xl p-2 mb-2.5 border border-gray-100">
                        <div className="flex items-center gap-1">
                          <CheckSquare className="w-3 h-3 text-cyan-600" />
                          <span>Tasks: <strong className="text-gray-900">{agent.tasksToday || 0}</strong></span>
                        </div>
                        <div className={`flex items-center gap-1 font-semibold ${
                          (agent.tasksOverdue || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {(agent.tasksOverdue || 0) > 0 ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          <span>{agent.tasksOverdue || 0} Overdue</span>
                        </div>
                      </div>

                      {/* View 360 Report Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedAgent(agent)}
                        className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 text-blue-600 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>[ View Full 360° Report ]</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. Pipeline + Lead Source side by side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Pipeline Distribution */}
          {pipelineStages && pipelineStages.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
                <GitMerge className="w-4 h-4 text-blue-600" />
                PIPELINE STAGE DISTRIBUTION
              </h3>
              <div className="space-y-3">
                {pipelineStages.map((stage: any, idx: number) => {
                  const colors = ['bg-blue-600', 'bg-sky-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-amber-500', 'bg-emerald-500'];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={stage.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
                          <span className="font-semibold text-gray-800">{stage.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-[11px]">{stage.avgVelocityText}</span>
                          <span className="font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-200">
                            {stage.leadCount} leads
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all duration-500`}
                          style={{ width: `${stage.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lead Source Matrix */}
          {leadSources && leadSources.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                LEAD SOURCE PERFORMANCE
              </h3>
              <div className="space-y-3">
                {leadSources.slice(0, 8).map((src: any) => {
                  const maxLeads = Math.max(...leadSources.map((s: any) => s.leads), 1);
                  const pct = Math.round((src.leads / maxLeads) * 100);
                  return (
                    <div key={src.source} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800 truncate max-w-[160px]" title={src.source}>
                          {src.source}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-600 font-semibold">{src.conversionRate}</span>
                          <span className="text-gray-900 font-bold bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-200">
                            {src.leads} leads
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${src.color} rounded-full`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 px-6 mt-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span>Sales Command Center · Powered by GoHighLevel API v3</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <Globe className="w-3.5 h-3.5" />
            <span>Public Read-Only Dashboard · API keys never shared</span>
          </div>
        </div>
      </footer>

      {/* Public Agent 360 Report Modal */}
      <Agent360Modal
        agent={selectedAgent}
        currency={currency}
        shareToken={token}
        dateRangeLabel={dateRange}
        showCallStats={false}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
}
