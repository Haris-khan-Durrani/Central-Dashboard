'use client';

import React from 'react';
import {
  Users,
  Clock,
  Award,
  XCircle,
  PieChart,
  DollarSign,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';

interface TopMetricCardsProps {
  summary: {
    totalLeads: number;
    openDeals: number;
    wonDeals: number;
    lostDeals: number;
    conversionRate: string;
    pipelineValue: number;
    tasksPending: number;
    tasksOverdue: number;
  };
  currency: string;
}

export default function TopMetricCards({ summary, currency }: TopMetricCardsProps) {
  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return `${currency} ${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${currency} ${(val / 1000).toFixed(0)}K`;
    }
    return `${currency} ${val.toLocaleString()}`;
  };

  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
      {/* 1. Total Leads */}
      <div className="bg-white rounded-2xl p-4 card-shadow card-shadow-hover border border-gray-100">
        <div className="flex items-center justify-between text-gray-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Total Leads</span>
          <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-gray-900">{summary.totalLeads.toLocaleString()}</div>
        <div className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> +12% MoM
        </div>
      </div>

      {/* 2. Open Deals */}
      <div className="bg-white rounded-2xl p-4 card-shadow card-shadow-hover border border-gray-100">
        <div className="flex items-center justify-between text-gray-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Open Deals</span>
          <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-gray-900">{summary.openDeals.toLocaleString()}</div>
        <div className="mt-1 text-[11px] text-gray-500 font-medium">
          <span>⚡ Active in pipeline</span>
        </div>
      </div>

      {/* 3. Won Deals */}
      <div className="bg-white rounded-2xl p-4 card-shadow card-shadow-hover border border-gray-100">
        <div className="flex items-center justify-between text-gray-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Won Deals</span>
          <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-emerald-600">{summary.wonDeals.toLocaleString()}</div>
        <div className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Closed won
        </div>
      </div>

      {/* 4. Lost Deals */}
      <div className="bg-white rounded-2xl p-4 card-shadow card-shadow-hover border border-gray-100">
        <div className="flex items-center justify-between text-gray-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Lost Deals</span>
          <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-rose-600">{summary.lostDeals.toLocaleString()}</div>
        <div className="mt-1 text-[11px] text-rose-600 font-medium flex items-center gap-1">
          <TrendingDown className="w-3 h-3" /> Unqualified
        </div>
      </div>

      {/* 5. Conversion */}
      <div className="bg-white rounded-2xl p-4 card-shadow card-shadow-hover border border-gray-100">
        <div className="flex items-center justify-between text-gray-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Conversion</span>
          <div className="p-1.5 rounded-xl bg-violet-50 text-violet-600">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-violet-600">{summary.conversionRate}</div>
        <div className="mt-1 text-[11px] text-gray-500 font-medium">
          <span>🎯 Target 15%</span>
        </div>
      </div>

      {/* 6. Pipeline Value */}
      <div className="bg-white rounded-2xl p-4 card-shadow card-shadow-hover border border-gray-100">
        <div className="flex items-center justify-between text-gray-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Pipeline Val</span>
          <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-lg font-bold text-gray-900 truncate">
          {formatCurrency(summary.pipelineValue)}
        </div>
        <div className="mt-1 text-[11px] text-gray-500 font-medium">
          <span>💰 Weighted val</span>
        </div>
      </div>

      {/* 7. Tasks Pending */}
      <div className="bg-white rounded-2xl p-4 card-shadow card-shadow-hover border border-gray-100">
        <div className="flex items-center justify-between text-gray-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Tasks Pend</span>
          <div className="p-1.5 rounded-xl bg-cyan-50 text-cyan-600">
            <CheckSquare className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-gray-900">{summary.tasksPending.toLocaleString()}</div>
        <div className="mt-1 text-[11px] text-cyan-600 font-medium">
          <span>📋 Active tasks</span>
        </div>
      </div>

      {/* 8. Overdue Tasks */}
      <div className="bg-white rounded-2xl p-4 card-shadow card-shadow-hover border border-gray-100 bg-gradient-to-br from-rose-50/50 to-white">
        <div className="flex items-center justify-between text-rose-600 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Overdue</span>
          <div className="p-1.5 rounded-xl bg-rose-100 text-rose-600 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-rose-600">{summary.tasksOverdue.toLocaleString()}</div>
        <div className="mt-1 text-[11px] text-rose-600 font-medium">
          <span>⚠️ Action needed</span>
        </div>
      </div>
    </section>
  );
}
