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
  Video,
  Phone,
  ExternalLink,
  User,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useLocationContext } from '@/context/LocationContext';

export interface UpcomingBookingItem {
  id: number;
  title: string;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  assignedTo: string | null;
  agentName: string;
  agentAvatar: string | null;
  startTime: string;
  endTime: string | null;
  status: string;
  meetingLocationType: string;
  meetingUrl: string | null;
  calendarName: string | null;
}

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
  upcomingBookings?: UpcomingBookingItem[];
  enableBookings?: boolean;
  onOpenCalendar?: () => void;
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
  upcomingBookings = [],
  enableBookings = true,
  onOpenCalendar,
}: HeaderProps) {
  const { locations, activeLocation, setActiveLocationId, setIsSettingsModalOpen } = useLocationContext();
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState<boolean>(false);
  const [isAutoRefreshMenuOpen, setIsAutoRefreshMenuOpen] = useState<boolean>(false);
  const [isBookingsPopupOpen, setIsBookingsPopupOpen] = useState<boolean>(false);
  const [localStart, setLocalStart] = useState(customStartDate);
  const [localEnd, setLocalEnd] = useState(customEndDate);
  const [timeAgo, setTimeAgo] = useState<string>('just now');
  const customPickerRef = useRef<HTMLDivElement>(null);
  const autoRefreshMenuRef = useRef<HTMLDivElement>(null);
  const bookingsPopupRef = useRef<HTMLDivElement>(null);

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

  // Click outside listener for bookings popup
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bookingsPopupRef.current && !bookingsPopupRef.current.contains(e.target as Node)) {
        setIsBookingsPopupOpen(false);
      }
    }
    if (isBookingsPopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBookingsPopupOpen]);

  // Meeting time & countdown formatter
  const formatMeetingTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (60 * 1000));

    let relative = '';
    if (diffMins < 0 && diffMins >= -30) {
      relative = 'Happening now';
    } else if (diffMins >= 0 && diffMins < 60) {
      relative = `In ${diffMins}m`;
    } else if (diffMins >= 60 && diffMins < 1440) {
      relative = `In ${Math.round(diffMins / 60)}h`;
    }

    const timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isToday = d.toDateString() === now.toDateString();
    const dateFormatted = isToday ? 'Today' : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

    return { dateFormatted, timeFormatted, relative };
  };

  const renderBookingModeBadge = (mode: string) => {
    const m = (mode || '').toLowerCase().replace(/[_\-\s]/g, '');
    if (m.includes('zoom')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 flex items-center gap-1 border border-blue-200">
          <Video className="w-3 h-3 text-blue-600" /> Zoom
        </span>
      );
    }
    if (m.includes('google') || m === 'meet' || m === 'googlemeet') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 flex items-center gap-1 border border-emerald-200">
          <Video className="w-3 h-3 text-emerald-600" /> Google Meet
        </span>
      );
    }
    if (m.includes('teams') || m.includes('microsoft')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 flex items-center gap-1 border border-indigo-200">
          <Video className="w-3 h-3 text-indigo-600" /> MS Teams
        </span>
      );
    }
    if (m.includes('phone') || m.includes('call')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 flex items-center gap-1 border border-purple-200">
          <Phone className="w-3 h-3 text-purple-600" /> Phone Call
        </span>
      );
    }
    if (m.includes('person') || m.includes('office') || m.includes('site') || m.includes('address') || m === 'inperson') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 flex items-center gap-1 border border-amber-200">
          <Building2 className="w-3 h-3 text-amber-600" /> In-Person
        </span>
      );
    }
    // GHL values 'custom', 'default', 'none' etc → Direct Meeting
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 flex items-center gap-1 border border-gray-200">
        <Calendar className="w-3 h-3 text-gray-500" /> {mode && !['custom','default','none',''].includes(mode.toLowerCase()) ? mode : 'Direct Meeting'}
      </span>
    );
  };

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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-xs">
      {/* Tier 1: Main Header (Workspace identity & Primary Actions) */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand & Active Workspace */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-500/25 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <h1 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight shrink-0">
              CRM Command Center
            </h1>
          </div>

          <div className="hidden sm:block h-5 w-px bg-gray-200" />

          {/* Prominent Sub-Account Switcher */}
          <div className="relative">
            <div className="flex items-center bg-gray-50 hover:bg-gray-100/80 border border-gray-200 rounded-xl px-2.5 py-1.5 transition-all shadow-2xs focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
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
                className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none appearance-none pr-6 cursor-pointer max-w-[190px] sm:max-w-[240px] truncate"
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

          {/* Live Status Pill */}
          <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>LIVE</span>
          </span>
        </div>

        {/* Right: Primary Actions (Calendar, Share, Full Sync, Settings, Avatar) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Calendar View Button */}
          {enableBookings && (
            <button
              onClick={onOpenCalendar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all active:scale-95 shadow-2xs"
              title="Open Interactive Calendar & Schedule"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Calendar</span>
              {upcomingBookings.length > 0 && (
                <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full">
                  {upcomingBookings.length}
                </span>
              )}
            </button>
          )}

          {/* Share Dashboard Button */}
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all active:scale-95 shadow-sm shadow-blue-500/20"
            title="Share Dashboard Publicly"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold border border-gray-200 transition-all active:scale-95 shadow-2xs relative"
            title="Sync Now with GoHighLevel API"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden md:inline">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <div className="h-5 w-px bg-gray-200 mx-1" />

          {/* Settings / Notifications */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors relative"
            title="Sub-Account & Integration Settings"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600"></span>
          </button>

          {/* Profile Avatar & Logout */}
          <div className="flex items-center gap-2">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"
              alt="Admin Profile"
              className="w-8 h-8 rounded-full object-cover border border-gray-300 shadow-xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://placehold.co/100x100/cbd5e1/1e293b?text=Admin';
              }}
            />
            <button
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                } catch {
                  window.location.href = '/login';
                }
              }}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 text-gray-500 hover:text-rose-600 transition-colors border border-gray-200"
              title="Sign Out of Central Dashboard"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2: Dedicated Filter & Telemetry Bar */}
      <div className="bg-slate-50/70 border-t border-gray-100 px-4 sm:px-6 lg:px-8 py-2 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs">
        {/* Left: Filter Controls Group */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Filters:
          </span>

          {/* Date Range Selector with Custom Option */}
          <div className="relative" ref={customPickerRef}>
            <div className="flex items-center">
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="bg-white text-xs font-semibold text-gray-700 rounded-xl px-2.5 py-1.5 border border-gray-200 hover:border-gray-300 focus:outline-none focus:border-blue-500 appearance-none pr-7 cursor-pointer transition-colors shadow-2xs"
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
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Custom Date Range Popover */}
            {isCustomPickerOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 z-50 w-72 animate-in fade-in slide-in-from-top-2 duration-150">
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

          {/* Dynamic Pipeline Selector */}
          <div className="relative">
            <select
              value={pipelineId}
              onChange={(e) => setPipelineId(e.target.value)}
              className="bg-white text-xs font-semibold text-gray-700 rounded-xl px-2.5 py-1.5 border border-gray-200 hover:border-gray-300 focus:outline-none focus:border-blue-500 appearance-none pr-7 cursor-pointer transition-colors max-w-[170px] truncate shadow-2xs"
            >
              <option value="all">⚙ All Pipelines</option>
              {pipelinesList.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Agent / User Selector */}
          <div className="relative">
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="bg-white text-xs font-semibold text-gray-700 rounded-xl px-2.5 py-1.5 border border-gray-200 hover:border-gray-300 focus:outline-none focus:border-blue-500 appearance-none pr-7 cursor-pointer transition-colors max-w-[160px] truncate shadow-2xs"
            >
              <option value="all">👥 All Agents</option>
              {agentsList.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Date Basis Selector */}
          <div className="relative">
            <select
              value={dateBasis}
              onChange={(e) => setDateBasis(e.target.value)}
              className="bg-blue-50/70 text-xs font-semibold text-blue-700 rounded-xl px-2.5 py-1.5 border border-blue-200/80 hover:bg-blue-100/70 focus:outline-none focus:border-blue-500 appearance-none pr-7 cursor-pointer transition-colors shadow-2xs"
            >
              <option value="created">📊 Basis: Created Date</option>
              <option value="updated">📊 Basis: Updated Date</option>
              <option value="won">📊 Basis: Won Date</option>
              <option value="assigned">📊 Basis: Assigned Date</option>
              <option value="stage_entered">📊 Basis: Stage Entered</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-blue-500 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Right: Live Telemetry, Bookings Popup, Auto-Refresh Status */}
        <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
          {/* Upcoming Bookings Status Bar Pill & Popup */}
          {enableBookings && (
            <div className="relative" ref={bookingsPopupRef}>
              <button
                type="button"
                onClick={() => setIsBookingsPopupOpen(!isBookingsPopupOpen)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all shadow-2xs ${
                  upcomingBookings.length > 0
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
                title="Click to view upcoming client bookings, meeting times and channels"
              >
                <Calendar className="w-3 h-3 text-indigo-600" />
                <span>Bookings</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    upcomingBookings.length > 0
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {upcomingBookings.length}
                </span>
                <ChevronDown className="w-3 h-3 text-indigo-500" />
              </button>

              {/* Upcoming Bookings Dropdown Popover */}
              {isBookingsPopupOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-100">
                    <div>
                      <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upcoming Client Bookings</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded-full border border-indigo-100">
                          {upcomingBookings.length} scheduled
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Appointments and meetings booked for this sub-account.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBookingsPopupOpen(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {upcomingBookings.length === 0 ? (
                    <div className="py-6 text-center space-y-1.5">
                      <Calendar className="w-8 h-8 text-gray-300 mx-auto" />
                      <div className="font-semibold text-gray-700 text-xs">
                        No upcoming bookings scheduled
                      </div>
                      <p className="text-[11px] text-gray-400 max-w-[240px] mx-auto">
                        When appointments are booked in GoHighLevel calendars, they will appear here live with meeting modes.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {upcomingBookings.map((b) => {
                        const timeInfo = formatMeetingTime(b.startTime);
                        return (
                          <div
                            key={b.id}
                            className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-100/70 transition-all space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-gray-900 text-xs truncate">
                                  {b.contactName}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate">
                                  {b.title} {b.calendarName ? `• ${b.calendarName}` : ''}
                                </div>
                              </div>
                              {renderBookingModeBadge(b.meetingLocationType)}
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1 border-t border-gray-200/50">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="font-semibold text-gray-800">
                                  {timeInfo.dateFormatted}, {timeInfo.timeFormatted}
                                </span>
                                {timeInfo.relative && (
                                  <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded font-bold text-[10px]">
                                    {timeInfo.relative}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 text-gray-500">
                                <User className="w-3 h-3 text-gray-400" />
                                <span className="truncate max-w-[90px] font-medium" title={b.agentName}>
                                  {b.agentName}
                                </span>
                              </div>
                            </div>

                            {b.meetingUrl && (
                              <div className="pt-1">
                                <a
                                  href={b.meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Join Meeting Room</span>
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* View Calendar Full Schedule Button */}
                  <div className="pt-2 mt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBookingsPopupOpen(false);
                        if (onOpenCalendar) onOpenCalendar();
                      }}
                      className="w-full py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Open Interactive Calendar & Schedule</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Auto-Refresh Status Pill & Dropdown */}
          <div className="relative" ref={autoRefreshMenuRef}>
            <button
              type="button"
              onClick={() => setIsAutoRefreshMenuOpen(!isAutoRefreshMenuOpen)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all shadow-2xs ${
                autoRefreshSec === 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : isBackgroundSyncing
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
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
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {isAutoRefreshMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-50 text-xs space-y-3 animate-in fade-in zoom-in-95">
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

          {/* Latency badge */}
          {executionMs !== undefined && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hidden sm:flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-600 fill-blue-600" /> {executionMs}ms
            </span>
          )}

          {/* Last sync time */}
          <span className="text-[11px] text-gray-500 font-medium hidden md:inline">
            Synced <span className="font-semibold text-gray-700">{timeAgo}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
