'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  RefreshCw,
  Bell,
  Building2,
  Zap,
  Calendar,
  Check,
  X,
  Share2,
  Clock,
  Play,
  Pause,
  CheckCircle2,
} from 'lucide-react';
import { useLocationContext } from '@/context/LocationContext';

interface HeaderProps {
  dateRange: string;
  setDateRange: (val: string) => void;
  customStartDate: string;
  setCustomStartDate: (val: string) => void;
  customEndDate: string;
  setCustomEndDate: (val: string) => void;
  onApplyCustomDates: (start: string, end: string) => void;
  dateBasis: string;
  setDateBasis: (val: string) => void;
  pipelineId: string;
  setPipelineId: (val: string) => void;
  pipelinesList: Array<{ id: number; name: string }>;
  agentId: string;
  setAgentId: (val: string) => void;
  agentsList: Array<{ id: string; name: string }>;
  onRefresh: () => void;
  onOpenShare: () => void;
  isRefreshing: boolean;
  lastSyncTime: string;
  lastSyncTimestamp?: number;
  executionMs?: number;
  autoRefreshSec?: number;
  setAutoRefreshSec?: (sec: number) => void;
  countdown?: number;
  autoSyncGhl?: boolean;
  setAutoSyncGhl?: (val: boolean) => void;
  isBackgroundSyncing?: boolean;
}

export default function Header({
  dateRange,
  setDateRange,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  onApplyCustomDates,
  dateBasis,
  setDateBasis,
  pipelineId,
  setPipelineId,
  pipelinesList,
  agentId,
  setAgentId,
  agentsList,
  onRefresh,
  onOpenShare,
  isRefreshing,
  lastSyncTime,
  lastSyncTimestamp,
  executionMs,
  autoRefreshSec = 15,
  setAutoRefreshSec,
  countdown = 15,
  autoSyncGhl = true,
  setAutoSyncGhl,
  isBackgroundSyncing = false,
}: HeaderProps) {
  const { locations, activeLocation, setActiveLocationId, setIsSettingsModalOpen } = useLocationContext();
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState<boolean>(false);
  const [isAutoRefreshMenuOpen, setIsAutoRefreshMenuOpen] = useState<boolean>(false);
  const [localStart, setLocalStart] = useState(customStartDate);
  const [localEnd, setLocalEnd] = useState(customEndDate);
  const [timeAgo, setTimeAgo] = useState<string>('just now');
  const customPickerRef = useRef<HTMLDivElement>(null);
  const autoRefreshMenuRef = useRef<HTMLDivElement>(null);

  // Dynamic live seconds ago calculator
  useEffect(() => {
    const updateAgo = () => {
      if (!lastSyncTimestamp) {
        setTimeAgo('just now');
        return;
      }
      const diffSec = Math.max(0, Math.floor((Date.now() - lastSyncTimestamp) / 1000));
      if (diffSec < 3) {
        setTimeAgo('just now');
      } else if (diffSec < 60) {
        setTimeAgo(`${diffSec}s ago`);
      } else {
        const mins = Math.floor(diffSec / 60);
        setTimeAgo(`${mins}m ago`);
      }
    };

    updateAgo();
    const interval = setInterval(updateAgo, 1000);
    return () => clearInterval(interval);
  }, [lastSyncTimestamp]);

  // Click outside listener for auto refresh menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (autoRefreshMenuRef.current && !autoRefreshMenuRef.current.contains(e.target as Node)) {
        setIsAutoRefreshMenuOpen(false);
      }
    }
    if (isAutoRefreshMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAutoRefreshMenuOpen]);

  // Sync local inputs when props change
  useEffect(() => {
    setLocalStart(customStartDate);
    setLocalEnd(customEndDate);
  }, [customStartDate, customEndDate]);

  // Click outside custom picker to close
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

  const handleDateRangeChange = (val: string) => {
    if (val === 'custom') {
      setIsCustomPickerOpen(true);
      setDateRange('custom');
    } else {
      setIsCustomPickerOpen(false);
      setDateRange(val);
    }
  };

  const handleApplyCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!localStart || !localEnd) return;
    setCustomStartDate(localStart);
    setCustomEndDate(localEnd);
    onApplyCustomDates(localStart, localEnd);
    setIsCustomPickerOpen(false);
  };

  const getDateRangeLabel = () => {
    if (dateRange === 'custom') {
      if (customStartDate && customEndDate) {
        return `📆 ${customStartDate} to ${customEndDate}`;
      }
      return '📆 Custom Range...';
    }
    if (dateRange === 'today') return '📅 Today';
    if (dateRange === 'yesterday') return '📅 Yesterday';
    if (dateRange === 'last_7') return '📅 Last 7 Days';
    if (dateRange === 'this_month') return '📅 This Month';
    if (dateRange === 'last_month') return '📅 Last Month';
    if (dateRange === 'last_30') return '📅 Last 30 Days';
    if (dateRange === 'this_quarter') return '📅 This Quarter';
    if (dateRange === 'this_year') return '📅 This Year';
    if (dateRange === 'all') return '📅 All Time';
    return '📅 Date Range';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-0 z-20 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3">
      {/* Title & Live Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between w-full xl:w-auto">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              Sales Command Center
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
            </span>

            {/* Auto-Refresh Status Pill & Dropdown */}
            <div className="relative" ref={autoRefreshMenuRef}>
              <button
                type="button"
                onClick={() => setIsAutoRefreshMenuOpen(!isAutoRefreshMenuOpen)}
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-all shadow-sm ${
                  autoRefreshSec === 0
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : isBackgroundSyncing
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                }`}
                title="Click to configure Auto-Refresh frequency or pause"
              >
                <RefreshCw
                  className={`w-3 h-3 text-blue-600 ${
                    isBackgroundSyncing || isRefreshing ? 'animate-spin' : ''
                  }`}
                />
                <span>
                  {autoRefreshSec === 0
                    ? 'Paused'
                    : isBackgroundSyncing
                    ? 'Syncing GHL...'
                    : `Auto: ${countdown}s`}
                </span>
                <ChevronDown className="w-3 h-3 text-blue-500" />
              </button>

              {/* Dropdown Menu */}
              {isAutoRefreshMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-50 text-xs space-y-3 animate-in fade-in zoom-in-95">
                  <div>
                    <div className="font-bold text-gray-900 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        Auto-Refresh Interval
                      </span>
                      {autoRefreshSec > 0 && (
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                          Ticking: {countdown}s
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { sec: 10, label: '⚡ 10 seconds' },
                        { sec: 15, label: '⏱️ 15s (Default)' },
                        { sec: 30, label: '⏳ 30 seconds' },
                        { sec: 60, label: '🕒 1 minute' },
                      ].map((item) => (
                        <button
                          key={item.sec}
                          type="button"
                          onClick={() => {
                            if (setAutoRefreshSec) setAutoRefreshSec(item.sec);
                            setIsAutoRefreshMenuOpen(false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-left font-medium transition-colors text-[11px] ${
                            autoRefreshSec === item.sec
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (setAutoRefreshSec) setAutoRefreshSec(autoRefreshSec === 0 ? 15 : 0);
                        setIsAutoRefreshMenuOpen(false);
                      }}
                      className={`w-full mt-1.5 px-2 py-1.5 rounded-lg text-left font-semibold transition-colors text-[11px] flex items-center justify-between ${
                        autoRefreshSec === 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{autoRefreshSec === 0 ? '▶ Resume Auto-Refresh' : '⏸ Pause Auto-Refresh'}</span>
                      {autoRefreshSec === 0 ? <Play className="w-3 h-3 text-amber-700" /> : <Pause className="w-3 h-3 text-gray-500" />}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-gray-100 space-y-1.5">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSyncGhl}
                        onChange={(e) => setAutoSyncGhl && setAutoSyncGhl(e.target.checked)}
                        className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-semibold text-gray-800 text-[11px]">
                          Live GoHighLevel API Sync
                        </div>
                        <div className="text-[10px] text-gray-500 leading-tight">
                          Pulls newly added/updated leads from GoHighLevel without clicking sync
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        onRefresh();
                        setIsAutoRefreshMenuOpen(false);
                      }}
                      className="w-full py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3 text-blue-600" />
                      Sync GoHighLevel Now (Full)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {executionMs !== undefined && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-600 fill-blue-600" /> {executionMs}ms
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>Last synced:</span>
            <span className="font-medium text-gray-800">{lastSyncTime}</span>
            <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
              {timeAgo}
            </span>
            <span className="text-gray-400">·</span>
            <span>GoHighLevel API v3 · {activeLocation?.name || 'Central'}</span>
          </p>
        </div>
      </div>

      {/* Controls & Filters Bar */}
      <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-end">
        {/* Multi-Sub-Account Switcher */}
        <div className="relative">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 focus-within:border-blue-500 hover:bg-gray-100 transition-colors">
            <Building2 className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
            <select
              value={activeLocation?.locationId || ''}
              onChange={(e) => {
                if (e.target.value === '__manage__') {
                  setIsSettingsModalOpen(true);
                } else {
                  setActiveLocationId(e.target.value);
                }
              }}
              className="bg-transparent text-xs font-semibold text-gray-800 focus:outline-none appearance-none pr-6 cursor-pointer max-w-[210px] truncate"
            >
              {locations.map((loc) => (
                <option key={loc.locationId} value={loc.locationId}>
                  🏢 {loc.name} ({loc.currency})
                </option>
              ))}
              <option value="__manage__">⚙️ + Manage Sub-Accounts...</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 pointer-events-none -ml-4" />
          </div>
        </div>

        {/* Date Range Selector with Custom Option */}
        <div className="relative" ref={customPickerRef}>
          <div className="flex items-center">
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="bg-gray-50 text-xs font-medium text-gray-700 rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-500 appearance-none pr-8 cursor-pointer hover:bg-gray-100 transition-colors"
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
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Custom Date Range Popover */}
          {isCustomPickerOpen && (
            <div className="absolute top-full mt-2 left-0 sm:right-0 sm:left-auto bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 z-50 w-72 animate-in fade-in slide-in-from-top-2 duration-150">
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
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    value={localEnd}
                    onChange={(e) => setLocalEnd(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
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

        {/* Multi-Level Date Basis Selector */}
        <div className="relative">
          <select
            value={dateBasis}
            onChange={(e) => setDateBasis(e.target.value)}
            className="bg-blue-50 text-xs font-semibold text-blue-700 rounded-xl px-3 py-2 border border-blue-200 focus:outline-none focus:border-blue-500 appearance-none pr-8 cursor-pointer hover:bg-blue-100/70 transition-colors shadow-sm shadow-blue-500/5"
          >
            <option value="created">📊 Basis: Created Date</option>
            <option value="updated">📊 Basis: Updated Date</option>
            <option value="won">📊 Basis: Won Date</option>
            <option value="assigned">📊 Basis: Assigned Date</option>
            <option value="stage_entered">📊 Basis: Stage Entered</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-blue-500 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Dynamic Pipeline Selector */}
        <div className="relative">
          <select
            value={pipelineId}
            onChange={(e) => setPipelineId(e.target.value)}
            className="bg-gray-50 text-xs font-medium text-gray-700 rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-500 appearance-none pr-8 cursor-pointer hover:bg-gray-100 transition-colors max-w-[180px] truncate"
          >
            <option value="all">⚙ Pipeline: All</option>
            {pipelinesList.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Agent / User Selector */}
        <div className="relative">
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="bg-gray-50 text-xs font-medium text-gray-700 rounded-xl px-3 py-2 border border-gray-200 focus:outline-none focus:border-blue-500 appearance-none pr-8 cursor-pointer hover:bg-gray-100 transition-colors max-w-[170px] truncate"
          >
            <option value="all">👥 User: All Agents</option>
            {agentsList.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Share Dashboard Button */}
        <button
          onClick={onOpenShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold border border-blue-700 transition-all active:scale-95 shadow-sm shadow-blue-500/20"
          title="Share Dashboard Publicly"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        {/* Instant Sync Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-all active:scale-95 relative"
          title="Sync Now with GoHighLevel API"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          {isRefreshing && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
          )}
        </button>

        {/* Profile Avatar & Notifications */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 relative transition-colors"
            title="Manage Sub-Accounts & Settings"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600"></span>
          </button>
          <div className="flex items-center gap-2.5">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"
              alt="Admin Profile"
              className="w-9 h-9 rounded-full object-cover border border-gray-300 shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://placehold.co/100x100/cbd5e1/1e293b?text=Admin';
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
