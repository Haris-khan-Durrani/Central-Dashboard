'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Video,
  Phone,
  MapPin,
  Clock,
  User,
  Users,
  Search,
  ExternalLink,
  Filter,
  CheckCircle2,
  CalendarDays,
  List,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export interface CalendarAppointment {
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

interface CalendarViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: CalendarAppointment[];
  agents: Array<{ id: string; ghlUserId: string; name: string; avatarUrl: string | null }>;
  locationName: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type CalendarViewMode = 'month' | 'week' | 'agenda';

export default function CalendarViewModal({
  isOpen,
  onClose,
  appointments = [],
  agents = [],
  locationName,
  onRefresh,
  isRefreshing = false,
}: CalendarViewModalProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('agenda');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [selectedCalendarName, setSelectedCalendarName] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(new Date());

  // Extract distinct calendar names
  const availableCalendars = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => {
      if (a.calendarName) set.add(a.calendarName);
    });
    return Array.from(set);
  }, [appointments]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      if (selectedAgentId !== 'all' && appt.assignedTo !== selectedAgentId) {
        return false;
      }
      if (selectedCalendarName !== 'all' && appt.calendarName !== selectedCalendarName) {
        return false;
      }
      if (selectedStatus !== 'all') {
        const st = (appt.status || '').toLowerCase();
        if (selectedStatus === 'confirmed' && !['confirmed', 'booked', 'approved'].includes(st)) {
          return false;
        }
        if (selectedStatus === 'cancelled' && !['cancelled', 'canceled', 'no-show'].includes(st)) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = appt.contactName.toLowerCase().includes(q);
        const matchesTitle = appt.title.toLowerCase().includes(q);
        const matchesAgent = appt.agentName.toLowerCase().includes(q);
        const matchesPhone = appt.contactPhone ? appt.contactPhone.includes(q) : false;
        if (!matchesName && !matchesTitle && !matchesAgent && !matchesPhone) {
          return false;
        }
      }
      return true;
    });
  }, [appointments, selectedAgentId, selectedCalendarName, selectedStatus, searchQuery]);

  // Helpers for Month View
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateFilter(today);
  };

  const formatMeetingMode = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('zoom')) {
      return { label: 'Zoom Video', icon: Video, color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
    if (t.includes('meet') || t.includes('google')) {
      return { label: 'Google Meet', icon: Video, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    if (t.includes('phone') || t.includes('call')) {
      return { label: 'Phone Call', icon: Phone, color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    if (t.includes('person') || t.includes('office') || t.includes('face')) {
      return { label: 'In-Person', icon: MapPin, color: 'bg-purple-100 text-purple-700 border-purple-200' };
    }
    return { label: 'Video Call', icon: Video, color: 'bg-blue-100 text-blue-700 border-blue-200' };
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '12:00 PM';
    }
  };

  const formatDateLabel = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Group appointments for Agenda view
  const groupedAgenda = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const tomorrowStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const groups: Record<string, CalendarAppointment[]> = {
      Today: [],
      Tomorrow: [],
      'This Week': [],
      Upcoming: [],
      Past: [],
    };

    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    filteredAppointments.forEach((appt) => {
      const apptDate = new Date(appt.startTime);
      const apptDateStr = appt.startTime.slice(0, 10);

      if (apptDate < new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
        groups.Past.push(appt);
      } else if (apptDateStr === todayStr) {
        groups.Today.push(appt);
      } else if (apptDateStr === tomorrowStr) {
        groups.Tomorrow.push(appt);
      } else if (apptDate <= oneWeekFromNow) {
        groups['This Week'].push(appt);
      } else {
        groups.Upcoming.push(appt);
      }
    });

    return groups;
  }, [filteredAppointments]);

  // Appointments for selected date in month view
  const selectedDayAppointments = useMemo(() => {
    if (!selectedDateFilter) return [];
    const dateStr = selectedDateFilter.toISOString().slice(0, 10);
    return filteredAppointments.filter((a) => a.startTime.slice(0, 10) === dateStr);
  }, [filteredAppointments, selectedDateFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden text-gray-900">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                  Appointment Calendar & Schedule
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                  {filteredAppointments.length} Bookings
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Live synced appointments for <span className="font-semibold text-gray-800">{locationName}</span>
              </p>
            </div>
          </div>

          {/* Controls: Mode Switcher & Date Navigation */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200/80">
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'agenda'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'month'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Month</span>
              </button>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
              <button
                onClick={handlePrev}
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-bold text-gray-700 hover:text-blue-600 transition-colors"
              >
                Today
              </button>
              <span className="text-xs font-bold text-gray-900 px-2 min-w-[110px] text-center">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={handleNext}
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 transition-all shadow-sm"
                title="Refresh Calendar"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/70 flex flex-wrap items-center gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search lead, agent, phone or meeting title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Filter by Agent */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-gray-400" />
              Agent:
            </span>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Agents ({agents.length})</option>
              {agents.map((agent) => (
                <option key={agent.ghlUserId} value={agent.ghlUserId}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Calendar */}
          {availableCalendars.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-semibold flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                Calendar:
              </span>
              <select
                value={selectedCalendarName}
                onChange={(e) => setSelectedCalendarName(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Calendars</option>
                {availableCalendars.map((cal) => (
                  <option key={cal} value={cal}>
                    {cal}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              Status:
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed / Booked</option>
              <option value="cancelled">Cancelled / No-Show</option>
            </select>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {viewMode === 'agenda' ? (
            /* AGENDA / LIST VIEW */
            <div className="space-y-6">
              {['Today', 'Tomorrow', 'This Week', 'Upcoming', 'Past'].map((groupKey) => {
                const list = groupedAgenda[groupKey as keyof typeof groupedAgenda];
                if (!list || list.length === 0) return null;

                return (
                  <div key={groupKey} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                        {groupKey}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-extrabold rounded-full">
                        {list.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {list.map((appt) => {
                        const mode = formatMeetingMode(appt.meetingLocationType);
                        const ModeIcon = mode.icon;
                        const isPast = new Date(appt.startTime) < new Date();

                        return (
                          <div
                            key={appt.id}
                            className={`bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                              isPast ? 'opacity-85' : 'hover:border-blue-300'
                            }`}
                          >
                            <div className="space-y-2.5">
                              {/* Top row: Mode badge & Status */}
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border flex items-center gap-1.5 ${mode.color}`}
                                >
                                  <ModeIcon className="w-3 h-3" />
                                  <span>{mode.label}</span>
                                </span>

                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                    ['cancelled', 'canceled'].includes(appt.status.toLowerCase())
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {appt.status || 'Booked'}
                                </span>
                              </div>

                              {/* Time & Date */}
                              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>{formatDateLabel(appt.startTime)}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-blue-700">{formatTime(appt.startTime)}</span>
                                {appt.endTime && (
                                  <>
                                    <span className="text-gray-400">-</span>
                                    <span>{formatTime(appt.endTime)}</span>
                                  </>
                                )}
                              </div>

                              {/* Lead Info */}
                              <div>
                                <div className="text-sm font-extrabold text-gray-900 truncate">
                                  {appt.contactName}
                                </div>
                                <div className="text-xs text-gray-500 font-medium truncate">
                                  {appt.title}
                                </div>
                                {appt.calendarName && (
                                  <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                                    📅 {appt.calendarName}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Bottom row: Agent & Actions */}
                            <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                              {/* Agent */}
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={
                                    appt.agentAvatar ||
                                    `https://placehold.co/80x80/e2e8f0/1e293b?text=${appt.agentName.slice(0, 2)}`
                                  }
                                  alt={appt.agentName}
                                  className="w-6 h-6 rounded-full object-cover border border-gray-200 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://placehold.co/80x80/e2e8f0/1e293b?text=${appt.agentName.slice(0, 2)}`;
                                  }}
                                />
                                <span className="text-[11px] font-bold text-gray-700 truncate">
                                  {appt.agentName}
                                </span>
                              </div>

                              {/* Meeting Button */}
                              {appt.meetingUrl ? (
                                <a
                                  href={appt.meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all shrink-0 active:scale-95"
                                >
                                  <span>Join</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : appt.contactPhone ? (
                                <a
                                  href={`tel:${appt.contactPhone}`}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all shrink-0"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>Call</span>
                                </a>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredAppointments.length === 0 && (
                <div className="py-16 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                  <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-700">No appointments found</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    No bookings match your current filter settings or date range. Try switching filters or syncing data.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* MONTH VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Grid (2 cols on large screen) */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-gray-500 pb-2 border-b border-gray-100 mb-2">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for leading days */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[72px] bg-gray-50/50 rounded-xl" />
                  ))}

                  {/* Month days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateObj = new Date(year, month, dayNum);
                    const dateStr = dateObj.toISOString().slice(0, 10);
                    const isToday =
                      new Date().toISOString().slice(0, 10) === dateStr;
                    const isSelected =
                      selectedDateFilter &&
                      selectedDateFilter.toISOString().slice(0, 10) === dateStr;

                    const dayAppts = filteredAppointments.filter(
                      (a) => a.startTime.slice(0, 10) === dateStr
                    );

                    return (
                      <div
                        key={dayNum}
                        onClick={() => setSelectedDateFilter(dateObj)}
                        className={`min-h-[74px] p-1.5 rounded-xl cursor-pointer transition-all border flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20'
                            : isToday
                            ? 'bg-blue-50/30 border-blue-200 hover:bg-blue-50'
                            : 'bg-white border-gray-100 hover:bg-gray-50/80 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                              isToday
                                ? 'bg-blue-600 text-white'
                                : isSelected
                                ? 'text-blue-700 font-extrabold'
                                : 'text-gray-700'
                            }`}
                          >
                            {dayNum}
                          </span>
                          {dayAppts.length > 0 && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full">
                              {dayAppts.length}
                            </span>
                          )}
                        </div>

                        {/* Mini indicators */}
                        <div className="space-y-0.5 mt-1 overflow-hidden">
                          {dayAppts.slice(0, 2).map((a) => (
                            <div
                              key={a.id}
                              className="text-[9px] font-bold text-gray-700 bg-gray-100 px-1 py-0.5 rounded truncate"
                              title={`${a.contactName} (${formatTime(a.startTime)})`}
                            >
                              {formatTime(a.startTime)} {a.contactName}
                            </div>
                          ))}
                          {dayAppts.length > 2 && (
                            <div className="text-[8px] font-bold text-blue-600 pl-1">
                              +{dayAppts.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day Details Drawer */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">
                      {selectedDateFilter
                        ? selectedDateFilter.toLocaleDateString([], {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Select a Date'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedDayAppointments.length} scheduled appointment
                      {selectedDayAppointments.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pt-3 space-y-3">
                  {selectedDayAppointments.map((appt) => {
                    const mode = formatMeetingMode(appt.meetingLocationType);
                    const ModeIcon = mode.icon;

                    return (
                      <div
                        key={appt.id}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-200/70 space-y-2 hover:bg-gray-100/60 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border flex items-center gap-1 ${mode.color}`}
                          >
                            <ModeIcon className="w-2.5 h-2.5" />
                            <span>{mode.label}</span>
                          </span>
                          <span className="text-xs font-bold text-blue-700">
                            {formatTime(appt.startTime)}
                          </span>
                        </div>

                        <div>
                          <div className="text-xs font-extrabold text-gray-900 truncate">
                            {appt.contactName}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {appt.title}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <img
                              src={
                                appt.agentAvatar ||
                                `https://placehold.co/80x80/e2e8f0/1e293b?text=${appt.agentName.slice(0, 2)}`
                              }
                              alt={appt.agentName}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                            />
                            <span className="text-[10px] font-bold text-gray-700 truncate">
                              {appt.agentName}
                            </span>
                          </div>

                          {appt.meetingUrl && (
                            <a
                              href={appt.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-md flex items-center gap-1"
                            >
                              <span>Join</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {selectedDayAppointments.length === 0 && (
                    <div className="py-12 text-center text-gray-400 text-xs">
                      No appointments scheduled for this date.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-white flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Syncing automatically on server side</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
          >
            Close Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
