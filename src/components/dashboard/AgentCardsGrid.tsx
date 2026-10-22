'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Eye,
  CheckSquare,
  AlertCircle,
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  Award,
  XCircle,
  GitMerge,
  Calendar,
  TrendingUp,
  Target,
  Sparkles,
  Trophy,
  Briefcase,
  Flame,
  ArrowRight,
  Zap,
} from 'lucide-react';

export interface AgentData {
  id: string;
  ghlUserId: string;
  name: string;
  role: string;
  email?: string | null;
  avatarUrl: string | null;
  leads: number;
  worked: number;
  won: number;
  lost: number;
  conversion: string;
  revenue: number;
  targetRevenue: number;
  targetProgress: number;
  pace: string;
  tasksToday: number;
  tasksPending: number;
  tasksOverdue: number;
  callsCount: number;
  whatsappCount: number;
  bookingsCount?: number;
  bookingsToday?: number;
  isLive: boolean;
  stageBreakdown?: Record<string, number>;
  monthLeads?: number;
  monthWon?: number;
  monthLost?: number;
  monthRevenue?: number;
  monthConversion?: string;
  monthExpectedProgress?: number;
  projectedRevenue?: number;
  openDeals?: number;
  pipelineValue?: number;
  rank?: number;
  currentDay?: number;
  daysInMonth?: number;
}

interface AgentCardsGridProps {
  agents: AgentData[];
  currency: string;
  showCallStats?: boolean;
  showBookings?: boolean;
  onViewAgentReport: (agent: AgentData) => void;
}

export default function AgentCardsGrid({
  agents,
  currency,
  showCallStats = false,
  showBookings = true,
  onViewAgentReport,
}: AgentCardsGridProps) {
  // Horizon view mode: 'month' (MTD - Default) vs 'period' (Filtered Period)
  const [viewMode, setViewMode] = useState<'month' | 'period'>('month');
  const [sortBy, setSortBy] = useState<'revenue' | 'conversion' | 'leads' | 'won' | 'target'>(
    'revenue'
  );

  const formatRevenue = (val: number, showZero = false) => {
    if (val >= 1000000) return `${currency} ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${currency} ${(val / 1000).toFixed(0)}K`;
    if (val > 0) return `${currency} ${val.toLocaleString()}`;
    return showZero ? `${currency} 0` : null;
  };

  // Sort agents dynamically based on active view mode and chosen sort metric
  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      if (sortBy === 'revenue') {
        const revA = viewMode === 'month' ? (a.monthRevenue ?? a.revenue) : a.revenue;
        const revB = viewMode === 'month' ? (b.monthRevenue ?? b.revenue) : b.revenue;
        return revB - revA;
      }
      if (sortBy === 'won') {
        const wonA = viewMode === 'month' ? (a.monthWon ?? a.won) : a.won;
        const wonB = viewMode === 'month' ? (b.monthWon ?? b.won) : b.won;
        return wonB - wonA;
      }
      if (sortBy === 'conversion') {
        const convA =
          viewMode === 'month'
            ? parseFloat(a.monthConversion ?? a.conversion)
            : parseFloat(a.conversion);
        const convB =
          viewMode === 'month'
            ? parseFloat(b.monthConversion ?? b.conversion)
            : parseFloat(b.conversion);
        return (isNaN(convB) ? 0 : convB) - (isNaN(convA) ? 0 : convA);
      }
      if (sortBy === 'target') {
        return (b.targetProgress || 0) - (a.targetProgress || 0);
      }
      // 'leads'
      const leadsA = viewMode === 'month' ? (a.monthLeads ?? a.leads) : a.leads;
      const leadsB = viewMode === 'month' ? (b.monthLeads ?? b.leads) : b.leads;
      return leadsB - leadsA;
    });
  }, [agents, sortBy, viewMode]);

  // Aggregate Team Summary Totals for executive birds-eye visibility
  const teamTotals = useMemo(() => {
    let totalReceivedMonth = 0;
    let totalReceivedPeriod = 0;
    let totalWonMonth = 0;
    let totalWonPeriod = 0;
    let totalRevMonth = 0;
    let totalRevPeriod = 0;
    let totalOpenDeals = 0;
    let totalOpenValue = 0;
    let agentsAheadOrOnTrack = 0;

    for (const a of agents) {
      totalReceivedMonth += a.monthLeads ?? a.leads;
      totalReceivedPeriod += a.leads;
      totalWonMonth += a.monthWon ?? a.won;
      totalWonPeriod += a.won;
      totalRevMonth += a.monthRevenue ?? a.revenue;
      totalRevPeriod += a.revenue;
      totalOpenDeals += a.openDeals ?? Math.max(0, a.leads - a.won - a.lost);
      totalOpenValue += a.pipelineValue ?? 0;
      if (a.pace.includes('Ahead') || a.pace.includes('On Track') || a.pace.includes('Exceeded')) {
        agentsAheadOrOnTrack++;
      }
    }

    const avgConv =
      totalReceivedMonth > 0 ? ((totalWonMonth / totalReceivedMonth) * 100).toFixed(1) : '0.0';

    return {
      activeAgents: agents.length,
      totalReceived: viewMode === 'month' ? totalReceivedMonth : totalReceivedPeriod,
      totalWon: viewMode === 'month' ? totalWonMonth : totalWonPeriod,
      totalRevenue: viewMode === 'month' ? totalRevMonth : totalRevPeriod,
      totalOpenDeals,
      totalOpenValue,
      avgConv,
      agentsAheadOrOnTrack,
    };
  }, [agents, viewMode]);

  return (
    <section className="space-y-4">
      {/* 1. Header & Horizon Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 shadow-2xs">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
              SALES TEAM PERFORMANCE & KPI PROGRESSION
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time tracking of leads received, deals won, quota pacing, and active pipeline for
            each salesperson.
          </p>
        </div>

        {/* Action Controls: View Horizon Switcher & Sorting */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
          {/* Horizon Toggle */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Show Month-To-Date progression and performance"
            >
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>This Month (MTD)</span>
            </button>
            <button
              onClick={() => setViewMode('period')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'period'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Show performance filtered by current top date range"
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Active Filter Period</span>
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <span className="text-xs text-gray-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="revenue">Won Revenue</option>
              <option value="won">Deals Won</option>
              <option value="leads">Leads Received</option>
              <option value="conversion">Conversion Rate</option>
              <option value="target">Quota Attainment %</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Team High-Altitude Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="px-3 py-1.5 border-r border-slate-200/60 last:border-r-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Active Team
          </span>
          <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{teamTotals.activeAgents} Salespeople</span>
          </div>
        </div>

        <div className="px-3 py-1.5 border-r border-slate-200/60 last:border-r-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {viewMode === 'month' ? 'MTD Intake' : 'Period Intake'}
          </span>
          <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
            <span className="text-blue-600 font-black">{teamTotals.totalReceived}</span>
            <span className="text-xs text-slate-500 font-medium">Leads Received</span>
          </div>
        </div>

        <div className="px-3 py-1.5 border-r border-slate-200/60 last:border-r-0">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
            {viewMode === 'month' ? 'MTD Closed Won' : 'Period Closed Won'}
          </span>
          <div className="text-sm sm:text-base font-black text-emerald-700 mt-0.5 flex items-center gap-1">
            <Award className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{teamTotals.totalWon} Won</span>
            {teamTotals.totalRevenue > 0 && (
              <span className="text-xs text-emerald-600 font-bold ml-1">
                ({formatRevenue(teamTotals.totalRevenue)})
              </span>
            )}
          </div>
        </div>

        <div className="px-3 py-1.5 border-r border-slate-200/60 last:border-r-0">
          <span className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider block">
            Active Pipeline
          </span>
          <div className="text-sm sm:text-base font-black text-sky-900 mt-0.5 flex items-center gap-1">
            <Briefcase className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{teamTotals.totalOpenDeals} Open</span>
            {teamTotals.totalOpenValue > 0 && (
              <span className="text-xs text-sky-600 font-bold ml-1">
                ({formatRevenue(teamTotals.totalOpenValue)})
              </span>
            )}
          </div>
        </div>

        <div className="px-3 py-1.5 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">
            Team Win Rate
          </span>
          <div className="text-sm sm:text-base font-black text-indigo-700 mt-0.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>{teamTotals.avgConv}% Win Rate</span>
          </div>
        </div>
      </div>

      {/* 3. Salesperson KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        {sortedAgents.map((agent) => {
          // Resolve metrics according to current view mode
          const activeReceived =
            viewMode === 'month' ? (agent.monthLeads ?? agent.leads) : agent.leads;
          const activeWon = viewMode === 'month' ? (agent.monthWon ?? agent.won) : agent.won;
          const activeLost = viewMode === 'month' ? (agent.monthLost ?? agent.lost) : agent.lost;
          const activeRevenue =
            viewMode === 'month' ? (agent.monthRevenue ?? agent.revenue) : agent.revenue;
          const activeConversion =
            viewMode === 'month' ? (agent.monthConversion ?? agent.conversion) : agent.conversion;

          const openDealsCount =
            agent.openDeals ?? Math.max(0, activeReceived - activeWon - activeLost);
          const activePipelineVal = agent.pipelineValue ?? 0;

          // Quota calculations
          const mtdRevenue = agent.monthRevenue ?? agent.revenue;
          const targetRev = agent.targetRevenue || 50000;
          const progressPct =
            targetRev > 0 ? Math.min(200, Math.round((mtdRevenue / targetRev) * 100)) : 0;
          const expectedPct = agent.monthExpectedProgress ?? 74;
          const curDay = agent.currentDay ?? new Date().getDate();
          const totalDays = agent.daysInMonth ?? 31;

          // Rank styling
          const rank = agent.rank || 1;
          const rankBadge =
            rank === 1
              ? {
                  label: '🥇 #1 Top',
                  bg: 'bg-amber-100 text-amber-900 border-amber-300 font-black',
                }
              : rank === 2
              ? {
                  label: '🥈 #2',
                  bg: 'bg-slate-200 text-slate-800 border-slate-300 font-extrabold',
                }
              : rank === 3
              ? {
                  label: '🥉 #3',
                  bg: 'bg-orange-100 text-orange-800 border-orange-300 font-extrabold',
                }
              : {
                  label: `#${rank}`,
                  bg: 'bg-slate-100 text-slate-600 border-slate-200 font-bold',
                };

          // Pace badge styling
          const paceStatus = agent.pace || 'On Track ⚡';
          const paceClass =
            progressPct >= 100 || paceStatus.includes('Exceeded')
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : paceStatus.includes('Ahead')
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : paceStatus.includes('On Track')
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : paceStatus.includes('Behind')
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200';

          return (
            <div
              key={agent.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-500/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Subtle top card accent line */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  rank === 1
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400'
                    : rank <= 3
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-r from-slate-200 to-slate-300 group-hover:from-blue-400 group-hover:to-indigo-500'
                } transition-all`}
              />

              <div className="flex-1 flex flex-col pt-1">
                {/* A. Header: Rank, Avatar, Identity & Pace Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <img
                        src={
                          agent.avatarUrl ||
                          'https://placehold.co/150x150/e2e8f0/1e293b?text=' +
                            agent.name.slice(0, 2)
                        }
                        alt={agent.name}
                        className="w-11 h-11 rounded-xl object-cover border-2 border-slate-200 group-hover:border-blue-500 transition-all shadow-2xs"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/150x150/e2e8f0/1e293b?text=' +
                            agent.name.slice(0, 2);
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] rounded-md border shrink-0 ${rankBadge.bg}`}
                        >
                          {rankBadge.label}
                        </span>
                        <h3
                          className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors truncate"
                          title={agent.name}
                        >
                          {agent.name}
                        </h3>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                        {agent.role === 'admin'
                          ? 'Sales Lead / Admin'
                          : agent.role === 'user'
                          ? 'Sales Consultant'
                          : agent.role || 'Sales Consultant'}
                      </p>
                    </div>
                  </div>

                  {/* Top-Right Pace Badge */}
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 border flex items-center gap-1 shadow-2xs ${paceClass}`}
                    title={`Pace status: ${paceStatus}`}
                  >
                    <span>{paceStatus}</span>
                  </span>
                </div>

                {/* B. The 4-Pillar Performance Grid (Received, Won, Pipeline, Win Rate) */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {/* Tile 1: RECEIVED (Lead Intake) */}
                  <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/80 hover:bg-slate-100/80 transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>📥 Received</span>
                      <span className="text-[9px] text-slate-400 font-semibold">
                        {viewMode === 'month' ? 'MTD' : 'Period'}
                      </span>
                    </div>
                    <div className="text-lg font-black text-slate-900 mt-1">
                      {activeReceived}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {viewMode === 'month'
                        ? `Period: ${agent.leads} leads`
                        : `MTD: ${agent.monthLeads ?? agent.leads} leads`}
                    </div>
                  </div>

                  {/* Tile 2: WON DEALS */}
                  <div className="bg-emerald-50/70 rounded-xl p-2.5 border border-emerald-200/80 hover:bg-emerald-50 transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-emerald-600" /> Won
                      </span>
                      <span className="text-[9px] text-emerald-600 font-bold">
                        {activeConversion}
                      </span>
                    </div>
                    <div className="text-lg font-black text-emerald-700 mt-1 flex items-baseline gap-1">
                      <span>{activeWon}</span>
                      <span className="text-xs font-bold text-emerald-600">
                        {activeWon === 1 ? 'deal' : 'deals'}
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold truncate mt-0.5">
                      {formatRevenue(activeRevenue, true)}
                    </div>
                  </div>

                  {/* Tile 3: ACTIVE PIPELINE */}
                  <div className="bg-sky-50/70 rounded-xl p-2.5 border border-sky-200/80 hover:bg-sky-50 transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-bold text-sky-700 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <GitMerge className="w-3 h-3 text-sky-600" /> Pipeline
                      </span>
                      <span className="text-[9px] text-sky-500 font-semibold">In Flight</span>
                    </div>
                    <div className="text-lg font-black text-sky-800 mt-1 flex items-baseline gap-1">
                      <span>{openDealsCount}</span>
                      <span className="text-xs font-bold text-sky-600">open</span>
                    </div>
                    <div className="text-[10px] text-sky-600 font-medium truncate mt-0.5">
                      {activePipelineVal > 0 ? formatRevenue(activePipelineVal) : 'Active deals'}
                    </div>
                  </div>

                  {/* Tile 4: WIN CONVERSION & LOSS */}
                  <div className="bg-indigo-50/70 rounded-xl p-2.5 border border-indigo-200/80 hover:bg-indigo-50 transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-indigo-600" /> Win Rate
                      </span>
                      <span className="text-[9px] text-indigo-500 font-semibold">Conv</span>
                    </div>
                    <div className="text-lg font-black text-indigo-800 mt-1">
                      {activeConversion}
                    </div>
                    <div className="text-[10px] text-indigo-600/80 font-medium truncate mt-0.5">
                      {activeLost} lost ({activeReceived > 0 ? Math.round((activeLost / activeReceived) * 100) : 0}%)
                    </div>
                  </div>
                </div>

                {/* C. Monthly Quota Target Progress with "Day of Month" Benchmark Pin */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 mb-3 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-semibold flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-blue-600" />
                      <span>Monthly Quota (MTD)</span>
                    </span>
                    <span className="text-slate-900 font-bold">
                      {formatRevenue(mtdRevenue, true)} /{' '}
                      <span className="text-slate-400 font-normal">
                        {formatRevenue(targetRev, true)}
                      </span>
                    </span>
                  </div>

                  {/* Gauge bar with Day-of-Month Expected Benchmark Pin */}
                  <div className="relative w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                    {/* Actual revenue progress bar */}
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progressPct >= 100
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : progressPct >= expectedPct
                          ? 'bg-gradient-to-r from-blue-600 to-emerald-500'
                          : 'bg-gradient-to-r from-amber-500 to-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(progressPct, 4))}%` }}
                    />

                    {/* Vertical Benchmark Pin: expected pace for current day of month */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-900/70 z-10"
                      style={{ left: `${Math.min(99, Math.max(1, expectedPct))}%` }}
                      title={`Today's pace target: Day ${curDay} of ${totalDays} (${expectedPct}%)`}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
                    <span>
                      Attainment:{' '}
                      <strong
                        className={
                          progressPct >= expectedPct
                            ? 'text-emerald-600 font-bold'
                            : 'text-amber-600 font-bold'
                        }
                      >
                        {progressPct}%
                      </strong>{' '}
                      <span className="text-slate-400">
                        (Day {curDay}/{totalDays} target: {expectedPct}%)
                      </span>
                    </span>
                    {agent.projectedRevenue && agent.projectedRevenue > 0 ? (
                      <span className="font-semibold text-slate-600">
                        Forecast: {formatRevenue(agent.projectedRevenue)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* D. Pipeline Stages Mini Breakdown */}
                <div className="bg-slate-50/60 rounded-xl px-2.5 py-2 border border-slate-200/60 space-y-1 mb-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      <GitMerge className="w-2.5 h-2.5 text-slate-400" /> Active Stage Distribution
                    </span>
                    <span className="text-[9px] text-slate-400">Top stages</span>
                  </div>

                  {agent.stageBreakdown && Object.keys(agent.stageBreakdown).length > 0 ? (
                    Object.entries(agent.stageBreakdown as Record<string, number>)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([stage, count]) => {
                        const totalActive = activeReceived > 0 ? activeReceived : 1;
                        const pct = Math.round((count / totalActive) * 100);
                        const stageColors: Record<string, string> = {
                          'New Lead': 'bg-blue-500',
                          'Contacted': 'bg-sky-500',
                          'Proposal Sent': 'bg-indigo-500',
                          'High Potential': 'bg-amber-500',
                          'Low Potential': 'bg-orange-400',
                          'On Hold': 'bg-slate-400',
                          'Won Deal': 'bg-emerald-500',
                          'Qualified': 'bg-cyan-500',
                        };
                        const barColor = stageColors[stage] || 'bg-blue-500';
                        return (
                          <div key={stage} className="flex items-center gap-1.5">
                            <span
                              className="text-[10px] text-slate-600 truncate w-24 shrink-0 font-medium"
                              title={stage}
                            >
                              {stage}
                            </span>
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${barColor} rounded-full`}
                                style={{ width: `${Math.max(6, pct)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 w-6 text-right shrink-0">
                              {count}
                            </span>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-[10px] text-slate-400 italic text-center py-1">
                      No active pipeline stages
                    </div>
                  )}
                </div>
              </div>

              {/* E. Pinned Bottom Section: Bookings, Urgency Tasks & Modern Action Button */}
              <div className="mt-auto space-y-2 pt-1 border-t border-slate-100">
                {/* Bookings Strip if enabled */}
                {showBookings && (
                  <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/60 rounded-xl px-2.5 py-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Bookings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-600">
                        Total: <strong className="text-slate-900">{agent.bookingsCount || 0}</strong>
                      </span>
                      {(agent.bookingsToday || 0) > 0 ? (
                        <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold rounded-md shadow-2xs">
                          {agent.bookingsToday} Today
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">0 today</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Tasks & Follow-up Urgency Pill */}
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/60 text-xs">
                  {showCallStats ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                          <CheckSquare className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span>
                            Today: <strong className="text-slate-900">{agent.tasksToday}</strong>
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 text-[11px] font-bold ${
                            agent.tasksOverdue > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {agent.tasksOverdue > 0 ? (
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>
                            Overdue:{' '}
                            <span
                              className={
                                agent.tasksOverdue > 0
                                  ? 'bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-md font-extrabold'
                                  : ''
                              }
                            >
                              {agent.tasksOverdue}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 text-right text-[11px] text-slate-600">
                        <div className="flex items-center justify-end gap-1">
                          <PhoneCall className="w-3 h-3 text-emerald-600" />
                          <span>{agent.callsCount} Calls</span>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>{agent.whatsappCount} WhatsApp</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span>
                          Tasks Today: <strong className="text-slate-900">{agent.tasksToday}</strong>
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1 font-bold ${
                          agent.tasksOverdue > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {agent.tasksOverdue > 0 ? (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>
                          Overdue:{' '}
                          <span
                            className={
                              agent.tasksOverdue > 0
                                ? 'bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-extrabold'
                                : 'font-semibold'
                            }
                          >
                            {agent.tasksOverdue}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modern Action Button */}
                <button
                  onClick={() => onViewAgentReport(agent)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 group/btn active:scale-98 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-white/90" />
                  <span>View 360° Analytics Report</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/80 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
