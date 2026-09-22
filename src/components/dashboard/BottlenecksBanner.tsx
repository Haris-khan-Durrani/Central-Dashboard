'use client';

import React from 'react';
import { Flame, ArrowRight } from 'lucide-react';

interface BottlenecksBannerProps {
  uncontactedCount: number;
  stuckCount: number;
  agentsOverdueCount: number;
  onOpenModal: () => void;
}

export default function BottlenecksBanner({
  uncontactedCount,
  stuckCount,
  agentsOverdueCount,
  onOpenModal,
}: BottlenecksBannerProps) {
  return (
    <section className="bg-white rounded-2xl p-5 card-shadow border border-amber-200 bg-gradient-to-r from-amber-50/60 via-white to-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-amber-500 text-white mt-0.5 shadow-sm shadow-amber-500/20">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            LEADS NEEDING ATTENTION & BOTTLENECK ALERTS
            <span className="px-2 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded-full font-semibold">
              Priority Action
            </span>
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-y-2 gap-x-3 text-xs text-gray-700 font-medium">
            <span className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-xl border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              🚨 {uncontactedCount} uncontacted &gt; 30 mins
            </span>
            <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-xl border border-amber-200">
              ⚠️ {stuckCount} stuck in &apos;Contacted&apos; &gt; 2 days
            </span>
            <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1 rounded-xl border border-purple-200">
              🔴 {agentsOverdueCount} agents with overdue tasks
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={onOpenModal}
        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 shrink-0 active:scale-95"
      >
        <span>Review Bottlenecks</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </section>
  );
}
