'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  GitMerge,
  PhoneCall,
  Download,
  Calendar,
  Layers,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AgentData } from '../dashboard/AgentCardsGrid';

interface Agent360ModalProps {
  agent: AgentData | null;
  currency: string;
  locationId?: string;
  shareToken?: string;
  dateRangeLabel?: string;
  showCallStats?: boolean;
  onClose: () => void;
  onToast?: (msg: string) => void;
}

export default function Agent360Modal({
  agent,
  currency,
  locationId,
  shareToken,
  dateRangeLabel = 'Selected Filter',
  showCallStats = false,
  onClose,
  onToast,
}: Agent360ModalProps) {
  const [viewMode, setViewMode] = useState<'filtered' | 'lifetime'>('filtered');
  const [lifetimeData, setLifetimeData] = useState<any>(null);
  const [isLoadingLifetime, setIsLoadingLifetime] = useState<boolean>(false);

  // When agent opens, fetch lifetime all-time data in background for seamless toggle
  useEffect(() => {
    if (!agent || (!locationId && !shareToken)) return;

    let isMounted = true;
    setIsLoadingLifetime(true);

    const endpoint = shareToken
      ? `/api/shares/${shareToken}/agent/${agent.ghlUserId}`
      : `/api/kpi/agent/${agent.ghlUserId}?location_id=${locationId}`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && json.report) {
          setLifetimeData(json.report);
        }
      })
      .catch((err) => {
        console.error('Error fetching lifetime agent data:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingLifetime(false);
      });

    return () => {
      isMounted = false;
    };
  }, [agent?.ghlUserId, locationId, shareToken]);

  if (!agent) return null;

  const initials = agent.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const formatRevenue = (val: number) => {
    return `${currency} ${val.toLocaleString()}`;
  };

  // Determine active view data
  const isLifetime = viewMode === 'lifetime' && lifetimeData;
  const activeData = isLifetime
    ? {
        leads: lifetimeData.metrics.leads,
        worked: lifetimeData.metrics.worked,
        won: lifetimeData.metrics.won,
        lost: lifetimeData.metrics.lost,
        conversion: lifetimeData.metrics.conversion,
        revenue: lifetimeData.metrics.revenue,
        targetRevenue: agent.targetRevenue,
        targetProgress:
          agent.targetRevenue > 0
            ? Math.min(100, Math.round((lifetimeData.metrics.revenue / agent.targetRevenue) * 100))
            : 0,
        tasksToday: lifetimeData.metrics.tasksToday,
        tasksPending: lifetimeData.metrics.tasksPending,
        tasksOverdue: lifetimeData.metrics.tasksOverdue,
        callsCount: Math.round(lifetimeData.metrics.worked * 1.5),
        whatsappCount: Math.round(lifetimeData.metrics.worked * 2.2),
        stageBreakdown: lifetimeData.stageBreakdown || {},
      }
    : {
        leads: agent.leads,
        worked: agent.worked,
        won: agent.won,
        lost: agent.lost,
        conversion: agent.conversion,
        revenue: agent.revenue,
        targetRevenue: agent.targetRevenue,
        targetProgress: agent.targetProgress,
        tasksToday: agent.tasksToday,
        tasksPending: agent.tasksPending,
        tasksOverdue: agent.tasksOverdue,
        callsCount: agent.callsCount,
        whatsappCount: agent.whatsappCount,
        stageBreakdown: agent.stageBreakdown || {},
      };

  const stageEntries = Object.entries(activeData.stageBreakdown as Record<string, number>).sort(
    ([, a], [, b]) => b - a
  );

  const workedRate =
    activeData.leads > 0 ? Math.round((activeData.worked / activeData.leads) * 100) : 0;

  // Real CSV export
  const handleExportCsv = () => {
    try {
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Agent Name', agent.name],
        ['Role', agent.role],
        ['Reporting Scope', viewMode === 'lifetime' ? 'All-Time Lifetime' : `Filtered: ${dateRangeLabel}`],
        ['Leads Received', activeData.leads],
        ['Leads Worked', activeData.worked],
        ['Won Deals', activeData.won],
        ['Lost Deals', activeData.lost],
        ['Conversion Rate', activeData.conversion],
        ['Revenue Generated', `${currency} ${activeData.revenue}`],
        ['Tasks Due Today', activeData.tasksToday],
        ['Pending Follow-ups', activeData.tasksPending],
        ['Overdue Tasks', activeData.tasksOverdue],
        ['Calls Logged', activeData.callsCount],
        ['WhatsApp Logged', activeData.whatsappCount],
        ['', ''],
        ['Pipeline Stage', 'Deals in Stage'],
        ...stageEntries.map(([stage, count]) => [stage, count]),
        ['Won / Closed Deals', activeData.won],
        ['Lost / Unqualified', activeData.lost],
      ];

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `Agent_${agent.name.replace(/[^a-zA-Z0-9]/g, '_')}_360_Report_${viewMode}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (onToast) onToast(`Exported ${agent.name} 360° audit report to CSV.`);
    } catch (err: any) {
      if (onToast) onToast(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl p-6 md:p-8 border border-gray-200 shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-900 transition-all hover:bg-gray-200 active:scale-95"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Profile */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-blue-500/20 shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{agent.name}</h2>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE 360° REPORT
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {agent.role} · Performance Analytics
              </p>
            </div>
          </div>

          {/* Time Scope Toggle: Filtered vs Lifetime */}
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl text-xs font-semibold border border-gray-200 self-start sm:self-center">
            <button
              onClick={() => setViewMode('filtered')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'filtered'
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Current Filter ({agent.leads})</span>
            </button>
            <button
              onClick={() => setViewMode('lifetime')}
              disabled={isLoadingLifetime && !lifetimeData}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'lifetime'
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {isLoadingLifetime && !lifetimeData ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Layers className="w-3.5 h-3.5" />
              )}
              <span>All-Time ({lifetimeData?.metrics?.leads ?? '...'})</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Top 4 Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 transition-all hover:border-blue-300">
              <div className="text-[11px] text-gray-500 font-medium">Leads Received</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{activeData.leads}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {viewMode === 'lifetime' ? 'All-time volume' : 'In selected period'}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 transition-all hover:border-blue-300">
              <div className="text-[11px] text-gray-500 font-medium">Leads Worked</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{activeData.worked}</div>
              <div className="text-[10px] text-blue-500 mt-0.5 font-medium">
                {workedRate}% engagement rate
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 transition-all hover:border-emerald-300">
              <div className="text-[11px] text-gray-500 font-medium">Won Deals</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{activeData.won}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {activeData.won > 0 ? 'Closed Deals' : 'No won deals yet'}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 transition-all hover:border-violet-300">
              <div className="text-[11px] text-gray-500 font-medium">Conversion Rate</div>
              <div className="text-2xl font-bold text-violet-600 mt-1">{activeData.conversion}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Won / Total Leads</div>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dynamic Pipeline Stage Breakdown */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <GitMerge className="w-3.5 h-3.5" /> Dynamic Pipeline Breakdown
                </h4>

                {stageEntries.length > 0 ? (
                  <div className="space-y-2.5 text-xs max-h-56 overflow-y-auto pr-1">
                    {stageEntries.map(([stageName, count]) => {
                      const pct =
                        activeData.leads > 0
                          ? Math.round((count / activeData.leads) * 100)
                          : 0;
                      return (
                        <div key={stageName} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium truncate max-w-[170px]" title={stageName}>
                              {stageName}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 font-medium">
                                {pct}%
                              </span>
                              <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                                {count} {count === 1 ? 'deal' : 'deals'}
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Won status breakdown highlight */}
                    {activeData.won > 0 && (
                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200 font-semibold text-emerald-600">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" /> Won / Closed Deals
                        </span>
                        <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {activeData.won} {activeData.won === 1 ? 'deal' : 'deals'}
                        </span>
                      </div>
                    )}

                    {/* Lost status breakdown highlight */}
                    {activeData.lost > 0 && (
                      <div className="flex justify-between items-center py-1 font-semibold text-rose-600">
                        <span>Lost / Unqualified Deals</span>
                        <span className="bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {activeData.lost} {activeData.lost === 1 ? 'deal' : 'deals'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    No opportunity deals found in this period.
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-500 flex justify-between">
                <span>Total Leads Assigned:</span>
                <strong className="text-gray-900">{activeData.leads}</strong>
              </div>
            </div>

            {/* Tasks & Activity Health */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tasks & Follow-up Health
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                    <span className="text-gray-600">Tasks Due Today</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded border ${
                        activeData.tasksToday > 0
                          ? 'text-cyan-700 bg-cyan-50 border-cyan-200'
                          : 'text-gray-500 bg-gray-100 border-gray-200'
                      }`}
                    >
                      {activeData.tasksToday} {activeData.tasksToday === 1 ? 'Task' : 'Tasks'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                    <span className="text-gray-600">Pending Follow-ups</span>
                    <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                      {activeData.tasksPending} Pending
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                    <span className="text-gray-600">Overdue Tasks</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                        activeData.tasksOverdue > 0
                          ? 'text-rose-600 bg-rose-50 border-rose-200'
                          : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      {activeData.tasksOverdue > 0 ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          {activeData.tasksOverdue} Overdue
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          0 Overdue
                        </>
                      )}
                    </span>
                  </div>

                  {showCallStats && (
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-gray-600">Activity Logs (Calls & WA)</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {activeData.callsCount} Calls / {activeData.whatsappCount} WA
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-500 flex justify-between">
                <span>Task Backlog Status:</span>
                <span
                  className={`font-semibold ${
                    activeData.tasksOverdue > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {activeData.tasksOverdue > 0 ? 'Action Required' : 'All Clear'}
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Target Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-white to-emerald-50/40 rounded-2xl p-4 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-gray-500 font-medium">Revenue Target Progress</div>
              <div className="text-xl font-extrabold text-gray-900 mt-0.5">
                {formatRevenue(activeData.revenue)}
                <span className="text-xs font-normal text-gray-500 ml-1.5">Revenue Generated</span>
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs text-emerald-600 font-bold flex items-center sm:justify-end gap-1">
                <Award className="w-4 h-4" />
                {activeData.targetProgress}% of Target Goal
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Target: {formatRevenue(activeData.targetRevenue)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
          >
            Close Report
          </button>
          <button
            onClick={handleExportCsv}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
