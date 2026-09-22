'use client';

import React from 'react';
import { GitMerge } from 'lucide-react';

interface PipelineStageItem {
  id: number;
  name: string;
  leadCount: number;
  percentage: number;
  avgVelocityText: string;
  color: string;
}

interface PipelineVelocityFunnelProps {
  stages: PipelineStageItem[];
}

export default function PipelineVelocityFunnel({ stages }: PipelineVelocityFunnelProps) {
  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-gray-100 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-blue-600" />
            PIPELINE DISTRIBUTION & STAGE VELOCITY
          </h3>
          <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-xl">
            Active Pipelines
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Funnel volume with average time spent in each pipeline stage.
        </p>

        <div className="space-y-3.5">
          {stages.map((stage) => (
            <div key={stage.id}>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-gray-700 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stage.color}`}></span> {stage.name}
                </span>
                <span className="text-gray-900 font-bold">
                  {stage.leadCount.toLocaleString()} {stage.name === 'Won Deal' ? 'closed deals' : 'leads'}{' '}
                  <span className="text-gray-400 font-normal">({stage.avgVelocityText})</span>
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                <div
                  className={`h-full ${stage.color} rounded-xl transition-all duration-500`}
                  style={{ width: `${stage.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
