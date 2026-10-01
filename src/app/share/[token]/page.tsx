'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap,
  Globe,
  Lock,
  ChevronDown,
  Calendar,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import TopMetricCards from '@/components/dashboard/TopMetricCards';
import UpcomingMeetingsPanel from '@/components/dashboard/UpcomingMeetingsPanel';
import AgentCardsGrid, { AgentData } from '@/components/dashboard/AgentCardsGrid';
import PipelineVelocityFunnel from '@/components/dashboard/PipelineVelocityFunnel';
import LeadSourceMatrix from '@/components/dashboard/LeadSourceMatrix';
import Agent360Modal from '@/components/modals/Agent360Modal';
import CalendarViewModal from '@/components/modals/CalendarViewModal';

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
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState<boolean>(false);
  const [localStart, setLocalStart] = useState<string>('2026-09-01');
  const [localEnd, setLocalEnd] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const customPickerRef = useRef<HTMLDivElement>(null);

  const [dateBasis, setDateBasis] = useState<string>('created');
  const [pipelineId, setPipelineId] = useState<string>('all');
  const [agentId, setAgentId] = useState<string>('all');

  // Modals state
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);

  // Click outside listener for custom date range picker
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (customPickerRef.current && !customPickerRef.current.contains(e.target as Node)) {
        setIsCustomPickerOpen(false);
      }
    }
    if (isCustomPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCustomPickerOpen]);

  // Restore saved filter preferences from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const tokenSaved = localStorage.getItem(`central_public_filter_${token}`);
      if (tokenSaved) {
        const parsed = JSON.parse(tokenSaved);
        if (parsed.dateRange) setDateRange(parsed.dateRange);
        if (parsed.customStartDate) {
          setCustomStartDate(parsed.customStartDate);
          setLocalStart(parsed.customStartDate);
        }
        if (parsed.customEndDate) {
          setCustomEndDate(parsed.customEndDate);
          setLocalEnd(parsed.customEndDate);
        }
        if (parsed.dateBasis) setDateBasis(parsed.dateBasis);
        if (parsed.pipelineId) setPipelineId(parsed.pipelineId);
        if (parsed.agentId) setAgentId(parsed.agentId);
        return;
      }

      const globalSaved = localStorage.getItem('central_public_filter_global');
      if (globalSaved) {
        const parsed = JSON.parse(globalSaved);
        if (parsed.dateRange) setDateRange(parsed.dateRange);
        if (parsed.customStartDate) {
          setCustomStartDate(parsed.customStartDate);
          setLocalStart(parsed.customStartDate);
        }
        if (parsed.customEndDate) {
          setCustomEndDate(parsed.customEndDate);
          setLocalEnd(parsed.customEndDate);
        }
        if (parsed.dateBasis) setDateBasis(parsed.dateBasis);
      }
    } catch (e) {
      console.error('Failed to load public filter from localStorage:', e);
    }
  }, [token]);

  const savePublicFilters = (updated: {
    dateRange?: string;
    customStartDate?: string;
    customEndDate?: string;
    dateBasis?: string;
    pipelineId?: string;
    agentId?: string;
  }) => {
    if (typeof window === 'undefined') return;
    try {
      const current = {
        dateRange: updated.dateRange ?? dateRange,
        customStartDate: updated.customStartDate ?? customStartDate,
        customEndDate: updated.customEndDate ?? customEndDate,
        dateBasis: updated.dateBasis ?? dateBasis,
        pipelineId: updated.pipelineId ?? pipelineId,
        agentId: updated.agentId ?? agentId,
      };
      localStorage.setItem(`central_public_filter_${token}`, JSON.stringify(current));
      localStorage.setItem(
        'central_public_filter_global',
        JSON.stringify({
          dateRange: current.dateRange,
          customStartDate: current.customStartDate,
          customEndDate: current.customEndDate,
          dateBasis: current.dateBasis,
        })
      );
    } catch (e) {
      console.error('Failed to save public filter to localStorage:', e);
    }
  };

  const handleDateRangeChange = (val: string) => {
    if (val === 'custom') {
      setIsCustomPickerOpen(true);
      return;
    }
    setDateRange(val);
    savePublicFilters({ dateRange: val });
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomStartDate(localStart);
    setCustomEndDate(localEnd);
    setDateRange('custom');
    setIsCustomPickerOpen(false);
    savePublicFilters({
      dateRange: 'custom',
      customStartDate: localStart,
      customEndDate: localEnd,
    });
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

      if (dateRange === 'custom') {
        if (customStartDate) params.set('startDate', customStartDate);
        if (customEndDate) params.set('endDate', customEndDate);
      }

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
  }, [token, dateRange, customStartDate, customEndDate, dateBasis, pipelineId, agentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // Auto-refresh every 60 seconds
    const timer = setInterval(() => load(false), 60000);
    return () => clearInterval(timer);
  }, [load]);

  const currency = data?.location?.currency || 'AED';

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

  const {
    summary,
    agents,
    pipelineStages,
    leadSources,
    location,
    bottlenecks,
    upcomingBookings = [],
    appointments = [],
  } = data || {};

  const enableBookings = location?.enableBookings !== false;

  return (
    <div className="min-h-screen w-full flex-1 flex flex-col min-w-0 bg-[#f8f9fc]">
      {/* Public Header — Clean 2-tier or sleek bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-xs">
        <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Sub-Account Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span>{shareTitle}</span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>LIVE DATA</span>
                </span>
                <span>
                  {location?.name} · Synced {lastRefreshed}
                </span>
                {executionMs > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hidden sm:inline-flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 fill-blue-600 text-blue-600" /> {executionMs}ms
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Public Filter Controls & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Calendar View CTA */}
            {enableBookings && (
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all active:scale-95 shadow-2xs"
                title="Open Interactive Calendar View"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Calendar</span>
                {upcomingBookings.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full">
                    {upcomingBookings.length}
                  </span>
                )}
              </button>
            )}

            {/* Date Range Selector with Custom Option */}
            <div className="relative" ref={customPickerRef}>
              <div className="flex items-center">
                <select
                  value={dateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                  className="bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-xl px-2.5 py-1.5 border border-gray-200 focus:outline-none focus:border-blue-500 appearance-none pr-7 cursor-pointer transition-colors shadow-2xs"
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
                  <option value="custom">📆 Custom Range...</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>

              {/* Active Custom Range Indicator Pill */}
              {dateRange === 'custom' && (
                <button
                  type="button"
                  onClick={() => setIsCustomPickerOpen(true)}
                  className="mt-1 flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Click to edit custom date range"
                >
                  <Calendar className="w-3 h-3 text-blue-600" />
                  <span>{customStartDate} – {customEndDate}</span>
                </button>
              )}

              {/* Custom Date Range Popover */}
              {isCustomPickerOpen && (
                <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 z-50 w-72 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" /> Select Custom Date Range
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomPickerOpen(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <form onSubmit={handleApplyCustom} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-gray-600 font-semibold mb-1">Start Date</label>
                      <input
                        type="date"
                        value={localStart}
                        onChange={(e) => setLocalStart(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-semibold mb-1">End Date</label>
                      <input
                        type="date"
                        value={localEnd}
                        onChange={(e) => setLocalEnd(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-800"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCustomPickerOpen(false)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-sm active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Date Basis */}
            <div className="relative">
              <select
                value={dateBasis}
                onChange={(e) => handleDateBasisChange(e.target.value)}
                className="bg-blue-50/70 text-xs font-semibold text-blue-700 rounded-xl px-2.5 py-1.5 border border-blue-200/80 hover:bg-blue-100/70 focus:outline-none focus:border-blue-500 appearance-none pr-7 cursor-pointer transition-colors shadow-2xs"
              >
                <option value="created">📊 Basis: Created Date</option>
                <option value="updated">📊 Basis: Updated Date</option>
                <option value="won">📊 Basis: Won Date</option>
                <option value="assigned">📊 Basis: Assigned Date</option>
                <option value="stage_entered">📊 Basis: Stage Entered</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-blue-500 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Pipeline Selector */}
            {data?.pipelines && data.pipelines.length > 0 && (
              <div className="relative">
                <select
                  value={pipelineId}
                  onChange={(e) => handlePipelineChange(e.target.value)}
                  className="bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-xl px-2.5 py-1.5 border border-gray-200 focus:outline-none focus:border-blue-500 appearance-none pr-7 cursor-pointer transition-colors max-w-[140px] truncate shadow-2xs"
                >
                  <option value="all">⚙️ All Pipelines</option>
                  {data.pipelines.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            )}

            {/* Agent Filter */}
            {agents && agents.length > 0 && (
              <div className="relative">
                <select
                  value={agentId}
                  onChange={(e) => handleAgentChange(e.target.value)}
                  className="bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-xl px-2.5 py-1.5 border border-gray-200 focus:outline-none focus:border-blue-500 appearance-none pr-7 cursor-pointer transition-colors max-w-[140px] truncate shadow-2xs"
                >
                  <option value="all">👥 All Agents</option>
                  {agents.map((ag: any) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            )}

            {/* Public View Badge */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-xl shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>Public View</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => load(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 transition-all active:scale-95 shadow-2xs"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="w-full flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 1. Top 8 KPI Metric Cards */}
        {summary && (
          <div>
            <TopMetricCards summary={summary} currency={currency} />
          </div>
        )}

        {/* 2. Upcoming Client Meetings & Rep Availability Hub */}
        {enableBookings && (
          <div>
            <UpcomingMeetingsPanel
              meetings={upcomingBookings}
              agents={agents || []}
              onOpenCalendar={() => setIsCalendarModalOpen(true)}
              currency={currency}
            />
          </div>
        )}

        {/* 4. Sales Team Performance & Agent KPI Cards */}
        {agents && agents.length > 0 && (
          <div>
            <AgentCardsGrid
              agents={agents}
              currency={currency}
              showCallStats={false}
              showBookings={enableBookings}
              onViewAgentReport={(agent) => setSelectedAgent(agent)}
            />
          </div>
        )}

        {/* 5. Pipeline Funnel & Lead Source Matrix */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {pipelineStages && pipelineStages.length > 0 && (
            <div>
              <PipelineVelocityFunnel stages={pipelineStages} />
            </div>
          )}
          {leadSources && leadSources.length > 0 && (
            <div>
              <LeadSourceMatrix sources={leadSources} currency={currency} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 px-6 text-center text-xs text-gray-400">
        <p>
          {location?.name || 'Sales Command Center'} · Live KPI Intelligence Dashboard · Read-Only Public View
        </p>
      </footer>

      {/* Modals for Public Viewers */}
      {selectedAgent && (
        <Agent360Modal
          agent={selectedAgent}
          currency={currency}
          locationId={location?.locationId}
          shareToken={token}
          dateRangeLabel={dateRange}
          initialDateBasis={dateBasis === 'won' ? 'won' : 'created'}
          showCallStats={false}
          onClose={() => setSelectedAgent(null)}
          onToast={() => {}}
        />
      )}

      <CalendarViewModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        appointments={appointments.length > 0 ? appointments : upcomingBookings}
        agents={
          agents?.map((a: any) => ({
            id: a.id || a.ghlUserId,
            ghlUserId: a.ghlUserId || a.id,
            name: a.name,
            avatarUrl: a.avatarUrl || null,
          })) || []
        }
        locationName={location?.name || shareTitle || 'Sales Command Center'}
        onRefresh={() => load(false)}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}
