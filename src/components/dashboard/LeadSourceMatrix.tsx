'use client';

import React from 'react';
import { PieChart } from 'lucide-react';

interface LeadSourceItem {
  source: string;
  leads: number;
  won: number;
  conversionRate: string;
  revenue: number;
  color: string;
}

interface LeadSourceMatrixProps {
  sources: LeadSourceItem[];
  currency: string;
}

export default function LeadSourceMatrix({ sources, currency }: LeadSourceMatrixProps) {
  const formatRevenue = (val: number) => {
    if (val >= 1000) return `${currency} ${(val / 1000).toFixed(0)}K`;
    return `${currency} ${val.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-gray-100 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            LEAD SOURCE PERFORMANCE & CONVERSION
          </h3>
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-xl">
            Attribution Matrix
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Channel acquisition ROI and conversion effectiveness.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Source</th>
                <th className="py-3 px-2">Leads</th>
                <th className="py-3 px-2">Won</th>
                <th className="py-3 px-2">Rate</th>
                <th className="py-3 px-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {sources.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2 font-semibold text-gray-900 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                    {item.source}
                  </td>
                  <td className="py-3 px-2 text-gray-600">{item.leads.toLocaleString()}</td>
                  <td className="py-3 px-2 text-emerald-600 font-semibold">{item.won.toLocaleString()}</td>
                  <td className="py-3 px-2 text-emerald-600 font-semibold">{item.conversionRate}</td>
                  <td className="py-3 px-2 text-right font-bold text-amber-600">
                    {formatRevenue(item.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
