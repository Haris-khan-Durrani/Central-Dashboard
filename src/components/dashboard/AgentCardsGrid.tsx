'use client';

import React, { useState } from 'react';
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
  const [sortBy, setSortBy] = useState<'revenue' | 'conversion' | 'leads'>('revenue');

  const sortedAgents = [...agents].sort((a, b) => {
    if (sortBy === 'revenue') return b.revenue - a.revenue;
    if (sortBy === 'conversion') return parseFloat(b.conversion) - parseFloat(a.conversion);
    return b.leads - a.leads;
  });

  const formatRevenue = (val: number, showZero = false) => {
    if (val >= 1000000) return `${currency} ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${currency} ${(val / 1000).toFixed(0)}K`;
    if (val > 0) return `${currency} ${val.toLocaleString()}`;
    return showZero ? `${currency} 0` : null;
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            SALES TEAM PERFORMANCE & AGENT KPI CARDS
          </h2>
          <p className="text-xs text-gray-500">
            Click any salesperson card to open the 360° deep-dive analytics report.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white text-xs font-medium text-gray-700 rounded-xl px-3 py-1.5 border border-gray-200 focus:outline-none hover:border-blue-500 cursor-pointer shadow-sm"
          >
            <option value="revenue">Revenue (High to Low)</option>
            <option value="conversion">Conversion Rate</option>
            <option value="leads">Total Leads</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        {sortedAgents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-2xl p-5 card-shadow card-shadow-hover border border-gray-100 flex flex-col justify-between group transition-all"
          >
            <div className="flex-1 flex flex-col">
              {/* Header Info: Full width identity */}
              <div className="flex items-start justify-between gap-2.5 mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <img
                      src={
                        agent.avatarUrl ||
                        'https://placehold.co/150x150/e2e8f0/1e293b?text=' + agent.name.slice(0, 2)
                      }
                      alt={agent.name}
                      className="w-10 h-10 rounded-xl object-cover border-2 border-blue-500/20 group-hover:border-blue-500 transition-all shadow-2xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/150x150/e2e8f0/1e293b?text=' + agent.name.slice(0, 2);
                      }}
                    />
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors truncate"
                      title={agent.name}
                    >
                      {agent.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium truncate">{agent.role || 'Sales Consultant'}</p>
                  </div>
                </div>

                {/* Top-Right LIVE status badge */}
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full shrink-0 flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>LIVE</span>
                </span>
              </div>

              {/* Dedicated Leads & Conversion Dual-Metric Bar */}
              <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50/90 p-1.5 rounded-xl border border-gray-100">
                <div className="bg-white rounded-lg px-2.5 py-1.5 border border-gray-200/70 shadow-2xs flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500">Total Leads</span>
                  <span className="text-xs font-black text-gray-900">{agent.leads}</span>
                </div>
                <div className="bg-blue-50/70 rounded-lg px-2.5 py-1.5 border border-blue-200/70 shadow-2xs flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-blue-700">Conversion</span>
                  <span className="text-xs font-black text-blue-700">{agent.conversion}</span>
                </div>
              </div>

              {/* Pipeline Stages Mini-Breakdown + Won / Lost */}
              <div className="my-3 space-y-1.5">
                {/* Won / Lost / Open status strip */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-1.5">
                    <div className="flex items-center justify-center gap-0.5 text-[10px] text-emerald-600 font-semibold">
                      <Award className="w-2.5 h-2.5" /> Won
                    </div>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5">{agent.won}</div>
                    {formatRevenue(agent.revenue) && (
                      <div className="text-[10px] text-emerald-500 font-medium truncate">
                        {formatRevenue(agent.revenue)}
                      </div>
                    )}
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-1.5">
                    <div className="flex items-center justify-center gap-0.5 text-[10px] text-rose-600 font-semibold">
                      <XCircle className="w-2.5 h-2.5" /> Lost
                    </div>
                    <div className="text-sm font-bold text-rose-700 mt-0.5">{agent.lost}</div>
                    <div className="text-[10px] text-rose-400 font-medium">
                      {agent.leads > 0 ? `${Math.round((agent.lost / agent.leads) * 100)}% rate` : '—'}
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-1.5">
                    <div className="flex items-center justify-center gap-0.5 text-[10px] text-blue-600 font-semibold">
                      <GitMerge className="w-2.5 h-2.5" /> Open
                    </div>
                    <div className="text-sm font-bold text-blue-700 mt-0.5">
                      {Math.max(0, agent.leads - agent.won - agent.lost)}
                    </div>
                    <div className="text-[10px] text-blue-400 font-medium">
                      {agent.leads > 0 ? `${agent.conversion} conv` : '—'}
                    </div>
                  </div>
                </div>

                {/* Top pipeline stages */}
                <div className="bg-gray-50 rounded-xl px-2.5 py-2 border border-gray-100 space-y-1 min-h-[80px] flex flex-col justify-center">
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
                    <GitMerge className="w-2.5 h-2.5" /> Pipeline Stages
                  </div>
                  {agent.stageBreakdown && Object.keys(agent.stageBreakdown).length > 0 ? (
                    Object.entries(agent.stageBreakdown as Record<string, number>)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([stage, count]) => {
                        const pct = agent.leads > 0 ? Math.round((count / agent.leads) * 100) : 0;
                        const stageColors: Record<string, string> = {
                          'New Lead': 'bg-blue-500',
                          'Contacted': 'bg-sky-500',
                          'Proposal Sent': 'bg-indigo-500',
                          'High Potential': 'bg-amber-500',
                          'Low Potential': 'bg-orange-400',
                          'On Hold': 'bg-gray-400',
                          'Won Deal': 'bg-emerald-500',
                          'Qualified': 'bg-cyan-500',
                        };
                        const barColor = stageColors[stage] || 'bg-blue-500';
                        return (
                          <div key={stage} className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-600 truncate w-20 shrink-0" title={stage}>
                              {stage}
                            </span>
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${barColor} rounded-full`}
                                style={{ width: `${Math.max(5, pct)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 w-5 text-right shrink-0">
                              {count}
                            </span>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-[10px] text-gray-400 italic text-center py-1">
                      No active pipeline stages
                    </div>
                  )}
                </div>
              </div>

              {/* Target & Progress */}
              <div className="space-y-1.5 my-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Monthly Revenue Target</span>
                  <span className="text-gray-900 font-bold">
                    {formatRevenue(agent.revenue, true)} /{' '}
                    <span className="text-gray-400 font-normal">{formatRevenue(agent.targetRevenue, true)}</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, agent.targetProgress)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-gray-500">
                  <span>
                    Progress: <strong className="text-blue-600">{agent.targetProgress}%</strong>
                  </span>
                  <span
                    className={`font-semibold ${
                      agent.targetProgress >= 100
                        ? 'text-emerald-600'
                        : agent.targetProgress >= 70
                        ? 'text-blue-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {agent.pace}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Pinned Section: Bookings & Activity & Tasks + Action Trigger Button */}
            <div className="mt-auto pt-2 space-y-2">
              {/* Bookings / Appointments Strip if enabled */}
              {showBookings && (
                <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/60 rounded-xl px-2.5 py-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Bookings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-600">
                      Total: <strong className="text-gray-900">{agent.bookingsCount || 0}</strong>
                    </span>
                    {(agent.bookingsToday || 0) > 0 ? (
                      <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold rounded-md shadow-sm">
                        {agent.bookingsToday} Today
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">0 today</span>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-xs text-gray-600">
                {showCallStats ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-600" />
                        <span>
                          Tasks Today: <strong className="text-gray-900">{agent.tasksToday}</strong>
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 font-medium ${
                          agent.tasksOverdue > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {agent.tasksOverdue > 0 ? (
                          <AlertCircle className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>
                          Overdue: <strong>{agent.tasksOverdue} {agent.tasksOverdue === 1 ? 'task' : 'tasks'}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{agent.callsCount} Calls</span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{agent.whatsappCount} WhatsApp</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckSquare className="w-3.5 h-3.5 text-cyan-600" />
                      <span>
                        Tasks Today: <strong className="text-gray-900">{agent.tasksToday}</strong>
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 font-medium ${
                        agent.tasksOverdue > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {agent.tasksOverdue > 0 ? (
                        <AlertCircle className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>
                        Overdue: <strong>{agent.tasksOverdue} {agent.tasksOverdue === 1 ? 'task' : 'tasks'}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Trigger Button */}
              <button
                onClick={() => onViewAgentReport(agent)}
                className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 text-blue-600 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-md active:scale-95"
              >
                <Eye className="w-4 h-4" />
                <span>[ View Full 360° Report ]</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
