'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface BottlenecksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (actionType: string, message: string) => void;
}

export default function BottlenecksModal({
  isOpen,
  onClose,
  onAction,
}: BottlenecksModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 md:p-8 border border-amber-200 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Leads & Pipeline Bottlenecks Requiring Action
            </h3>
            <p className="text-xs text-gray-500">
              Real-time alerts flagged by the KPI Intelligence engine.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {/* Card 1 */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <strong className="text-rose-700 text-sm block mb-1">
                🚨 17 Leads uncontacted &gt; 30 minutes
              </strong>
              <p className="text-gray-600">
                Assigned across sales reps without outbound touch. Re-assignment queue ready.
              </p>
            </div>
            <button
              onClick={() => {
                onAction('reassign', 'Automated lead re-distribution triggered for uncontacted leads.');
                onClose();
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shrink-0 self-start sm:self-auto active:scale-95 shadow-sm transition-all"
            >
              Re-assign
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <strong className="text-amber-800 text-sm block mb-1">
                ⚠️ 24 Leads stuck in &apos;Contacted&apos; stage &gt; 2 days
              </strong>
              <p className="text-gray-600">
                Stalled in pipeline. Recommended automated WhatsApp re-engagement sequence ready.
              </p>
            </div>
            <button
              onClick={() => {
                onAction('sms', 'Automated WhatsApp & SMS follow-up sequence triggered for stalled leads.');
                onClose();
              }}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0 self-start sm:self-auto active:scale-95 shadow-sm transition-all"
            >
              Trigger SMS
            </button>
          </div>

          {/* Card 3 */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <strong className="text-purple-700 text-sm block mb-1">
                🔴 Agents with overdue follow-up tasks
              </strong>
              <p className="text-gray-600">
                Overdue follow-up tasks flagged for managerial review and agent coaching.
              </p>
            </div>
            <button
              onClick={() => {
                onAction('notify', 'Slack and WhatsApp managerial escalation alert dispatched.');
                onClose();
              }}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shrink-0 self-start sm:self-auto active:scale-95 shadow-sm transition-all"
            >
              Notify Mgr
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
