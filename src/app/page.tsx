'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import TopMetricCards from '@/components/dashboard/TopMetricCards';
import AgentCardsGrid, { AgentData } from '@/components/dashboard/AgentCardsGrid';
import PipelineVelocityFunnel from '@/components/dashboard/PipelineVelocityFunnel';
import LeadSourceMatrix from '@/components/dashboard/LeadSourceMatrix';
import Agent360Modal from '@/components/modals/Agent360Modal';
import BottlenecksModal from '@/components/modals/BottlenecksModal';
import SubAccountSettingsModal from '@/components/modals/SubAccountSettingsModal';
import ShareModal from '@/components/modals/ShareModal';
import CalendarViewModal from '@/components/modals/CalendarViewModal';
import UpcomingMeetingsPanel from '@/components/dashboard/UpcomingMeetingsPanel';
import { useLocationContext } from '@/context/LocationContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { activeLocationId, isSettingsModalOpen, setIsSettingsModalOpen } = useLocationContext();

  const [dateRange, setDateRange] = useState<string>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [dateBasis, setDateBasis] = useState<string>('created');
  const [pipelineId, setPipelineId] = useState<string>('all');
  const [agentId, setAgentId] = useState<string>('all');

  const [kpiData, setKpiData] = useState<any>(null);
  const [executionMs, setExecutionMs] = useState<number>(18);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Modals state
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Restore saved global filters on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedRange = localStorage.getItem('central_filter_dateRange');
      if (savedRange) setDateRange(savedRange);

      const savedBasis = localStorage.getItem('central_filter_dateBasis');
      if (savedBasis) setDateBasis(savedBasis);

      const savedStart = localStorage.getItem('central_filter_customStartDate');
      if (savedStart) setCustomStartDate(savedStart);

      const savedEnd = localStorage.getItem('central_filter_customEndDate');
      if (savedEnd) setCustomEndDate(savedEnd);
    } catch (e) {
      console.error('Error reading filters from localStorage:', e);
    }
  }, []);

  // Restore or reset location-specific pipeline & agent filters when activeLocationId changes
  const prevLocRef = useRef(activeLocationId);
  useEffect(() => {
    if (typeof window === 'undefined' || !activeLocationId) return;
    try {
      const savedPipeline = localStorage.getItem(`central_filter_${activeLocationId}_pipelineId`);
      if (savedPipeline) {
        setPipelineId(savedPipeline);
      } else if (prevLocRef.current !== activeLocationId) {
        setPipelineId('all');
      }

      const savedAgent = localStorage.getItem(`central_filter_${activeLocationId}_agentId`);
      if (savedAgent) {
        setAgentId(savedAgent);
      } else if (prevLocRef.current !== activeLocationId) {
        setAgentId('all');
      }
    } catch (e) {
      console.error('Error reading location filters from localStorage:', e);
    }
    prevLocRef.current = activeLocationId;
  }, [activeLocationId]);

  // Handlers that update state and persist to localStorage
  const handleDateRangeChange = (val: string) => {
    setDateRange(val);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('central_filter_dateRange', val);
      } catch (e) {}
    }
  };

  const handleDateBasisChange = (val: string) => {
    setDateBasis(val);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('central_filter_dateBasis', val);
      } catch (e) {}
    }
  };

  const handlePipelineIdChange = (val: string) => {
    setPipelineId(val);
    if (typeof window !== 'undefined' && activeLocationId) {
      try {
        localStorage.setItem(`central_filter_${activeLocationId}_pipelineId`, val);
      } catch (e) {}
    }
  };

  const handleAgentIdChange = (val: string) => {
    setAgentId(val);
    if (typeof window !== 'undefined' && activeLocationId) {
      try {
        localStorage.setItem(`central_filter_${activeLocationId}_agentId`, val);
      } catch (e) {}
    }
  };

  // Auto-refresh configuration & live background ticker
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(15);
  const [autoSyncGhl, setAutoSyncGhl] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(15);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(Date.now());
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState<boolean>(false);
  const lastBackgroundSyncAt = useRef<number>(Date.now());

  const fetchKpiData = useCallback(async (showSpin = false) => {
    if (!activeLocationId) return;
    if (showSpin) setIsRefreshing(true);

    try {
      const params = new URLSearchParams({
        location_id: activeLocationId,
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

      const res = await fetch(`/api/kpi/command-center?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      const json = await res.json();

      if (json.success && json.data) {
        setKpiData(json.data);
        if (json.executionMs !== undefined) {
          setExecutionMs(json.executionMs);
        }
        const now = new Date();
        setLastSyncTime(now.toLocaleTimeString());
        setLastSyncTimestamp(now.getTime());
      }
    } catch (err) {
      console.error('Error fetching KPI command center data:', err);
    } finally {
      setIsLoading(false);
      if (showSpin) {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  }, [activeLocationId, dateRange, customStartDate, customEndDate, dateBasis, pipelineId, agentId]);

  useEffect(() => {
    fetchKpiData();
  }, [fetchKpiData]);

  // Reset countdown whenever autoRefreshSec changes
  useEffect(() => {
    setCountdown(autoRefreshSec);
  }, [autoRefreshSec]);

  // 1-second live countdown ticker
  useEffect(() => {
    if (autoRefreshSec === 0) return; // Paused

    const ticker = setInterval(async () => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger poll asynchronously
          (async () => {
            const now = Date.now();
            // If GHL sync is enabled, run fast incremental sync every 20s or every cycle
            if (autoSyncGhl && activeLocationId && now - lastBackgroundSyncAt.current >= 20000) {
              setIsBackgroundSyncing(true);
              try {
                await fetch(`/api/locations/${activeLocationId}/sync?mode=incremental`, {
                  method: 'POST',
                  cache: 'no-store',
                });
                lastBackgroundSyncAt.current = Date.now();
              } catch (e) {
                console.warn('Background GHL sync error:', e);
              } finally {
                setIsBackgroundSyncing(false);
              }
            }
            await fetchKpiData(false);
          })();

          return autoRefreshSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [autoRefreshSec, autoSyncGhl, activeLocationId, fetchKpiData]);

  // Real GoHighLevel Live Sync trigger (Full manual sync)
  const handleLiveGhlSync = async () => {
    if (!activeLocationId) return;
    setIsRefreshing(true);
    showToast('Connecting to GoHighLevel API to fetch live updates...', 'info');

    try {
      const res = await fetch(`/api/locations/${activeLocationId}/sync?mode=full`, { method: 'POST' });
      const json = await res.json();

      if (json.success) {
        showToast(json.message || 'GoHighLevel data synchronized successfully!', 'success');
        await fetchKpiData(false);
      } else {
        showToast(json.message || 'Sync encountered an issue. Checked local data.', 'error');
        await fetchKpiData(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Sync network error. Refreshing local views.', 'error');
      await fetchKpiData(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApplyCustomDates = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setDateRange('custom');
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('central_filter_dateRange', 'custom');
        localStorage.setItem('central_filter_customStartDate', start);
        localStorage.setItem('central_filter_customEndDate', end);
      } catch (e) {}
    }
    showToast(`Filtering for custom date range: ${start} to ${end}`);
  };

  const [activeNavSection, setActiveNavSection] = useState<string>('dashboard');
  const currency = kpiData?.location?.currency || 'AED';

  return (
    <div className="min-h-screen flex w-full" id="dashboard-top">
      {/* Left Navigation Rail */}
      <Sidebar
        activeSection={activeNavSection}
        onNavigate={(sec) => {
          setActiveNavSection(sec);
          if (sec === 'dashboard') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            const el = document.getElementById(`${sec}-section`);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header with Dynamic Pipelines & Custom Date Picker */}
        <Header
          dateRange={dateRange}
          setDateRange={handleDateRangeChange}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          onApplyCustomDates={handleApplyCustomDates}
          dateBasis={dateBasis}
          setDateBasis={handleDateBasisChange}
          pipelineId={pipelineId}
          setPipelineId={handlePipelineIdChange}
          pipelinesList={kpiData?.pipelines || []}
          agentId={agentId}
          setAgentId={handleAgentIdChange}
          agentsList={
            kpiData?.agents?.map((a: any) => ({ id: a.ghlUserId, name: a.name })) || []
          }
          onRefresh={handleLiveGhlSync}
          onOpenShare={() => setIsShareModalOpen(true)}
          onOpenCalendar={() => setIsCalendarModalOpen(true)}
          isRefreshing={isRefreshing}
          lastSyncTime={lastSyncTime}
          lastSyncTimestamp={lastSyncTimestamp}
          executionMs={executionMs}
          autoRefreshSec={autoRefreshSec}
          setAutoRefreshSec={setAutoRefreshSec}
          countdown={countdown}
          autoSyncGhl={autoSyncGhl}
          setAutoSyncGhl={setAutoSyncGhl}
          isBackgroundSyncing={isBackgroundSyncing}
          upcomingBookings={kpiData?.upcomingBookings || []}
          enableBookings={kpiData?.location?.enableBookings !== false}
        />

        {/* Top loading line indicator when fetching in background */}
        {(isRefreshing || isBackgroundSyncing) && (
          <div className="h-0.5 w-full bg-blue-100 overflow-hidden">
            <div className="w-full h-full bg-blue-600 animate-pulse"></div>
          </div>
        )}

        {/* Dashboard Main Grid */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 w-full flex-1">
          {kpiData ? (
            <>
              {/* 1. Top 8 KPI Summary Cards */}
              <div id="metrics-section">
                <TopMetricCards summary={kpiData.summary} currency={currency} />
              </div>


              {/* 3. Upcoming Client Meetings & Agent Availability Hub */}
              {kpiData?.location?.enableBookings !== false && (
                <div id="meetings-section">
                  <UpcomingMeetingsPanel
                    meetings={kpiData.upcomingBookings || []}
                    agents={kpiData.agents || []}
                    onOpenCalendar={() => setIsCalendarModalOpen(true)}
                    currency={currency}
                  />
                </div>
              )}

              {/* 4. Sales Team Performance & Agent Cards */}
              <div id="team-section">
                <AgentCardsGrid
                  agents={kpiData.agents || []}
                  currency={currency}
                  showCallStats={false}
                  showBookings={kpiData?.location?.enableBookings !== false}
                  onViewAgentReport={(agent) => setSelectedAgent(agent)}
                />
              </div>

              {/* 4. Pipeline Velocity & Lead Source Performance */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div id="pipelines-section">
                  <PipelineVelocityFunnel stages={kpiData.pipelineStages || []} />
                </div>
                <div id="analytics-section">
                  <LeadSourceMatrix sources={kpiData.leadSources || []} currency={currency} />
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-semibold text-gray-600">
                  {isLoading ? 'Loading Sales Command Center...' : 'No sub-account data available.'}
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white py-4 px-6 text-center text-xs text-gray-400">
          <p>
            CRM Command Center · GoHighLevel CRM Intelligence Engine · Powered by GHL API v3 &amp; MySQL Sync Layer
          </p>
        </footer>
      </div>

      {/* Modals */}
      <Agent360Modal
        agent={selectedAgent}
        currency={currency}
        locationId={activeLocationId}
        dateRangeLabel={dateRange}
        showCallStats={false}
        onClose={() => setSelectedAgent(null)}
        onToast={(msg) => showToast(msg, 'info')}
      />


      <SubAccountSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onToast={(msg) => showToast(msg, 'success')}
      />

      {/* Share Dashboard Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        locationId={activeLocationId}
        locationName={kpiData?.location?.name || activeLocationId || ''}
        dateRange={dateRange}
        dateBasis={dateBasis}
        pipelineId={pipelineId}
        onClose={() => setIsShareModalOpen(false)}
        onToast={(msg, type) => showToast(msg, type || 'success')}
      />

      {/* Interactive Calendar Schedule Modal */}
      <CalendarViewModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        appointments={kpiData?.appointments || kpiData?.upcomingBookings || []}
        agents={kpiData?.agents || []}
        locationName={kpiData?.location?.name || activeLocationId || 'Sub-Account'}
        onRefresh={handleLiveGhlSync}
        isRefreshing={isRefreshing}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-300 ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 text-white'
              : toastMessage.type === 'info'
              ? 'bg-blue-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
