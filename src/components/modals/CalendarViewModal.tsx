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
  Columns3,
  Sun,
} from 'lucide-react';
import { parseMeetingDetails } from '@/lib/meetingHelper';

export interface CalendarAppointment {
  id: number;
  title: string;
  contactId?: number | null;
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
  bookedBy?: string | null;
  hostName?: string;
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

type CalendarViewMode = 'day' | 'week' | 'month' | 'agenda';

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
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [selectedCalendarName, setSelectedCalendarName] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | null>(new Date());
  const [selectedAppt, setSelectedAppt] = useState<CalendarAppointment | null>(null);

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
    if (viewMode === 'day') {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateFilter(today);
  };

  // Week days calculation (Sunday to Saturday)
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - day);
    sunday.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(sunday);
      nextDay.setDate(sunday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  }, [currentDate]);

  const currentDayDateStr = currentDate.toISOString().slice(0, 10);
  const currentDayAppts = useMemo(() => {
    return filteredAppointments
      .filter((a) => a.startTime.slice(0, 10) === currentDayDateStr)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [filteredAppointments, currentDayDateStr]);

  const navigatorTitle = useMemo(() => {
    if (viewMode === 'day') {
      const isToday = currentDate.toDateString() === new Date().toDateString();
      return `${isToday ? 'Today · ' : ''}${currentDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (viewMode === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return `${monthNames[month]} ${year}`;
  }, [viewMode, currentDate, weekDays, month, year, monthNames]);

  const formatMeetingMode = (type: string, titleHint: string = '') => {
    const t = (type || '').toLowerCase().replace(/[_\-\s]/g, '');
    const h = (titleHint || '').toLowerCase();

    // Title-based overrides (GHL stores 'zoom' even for in-person meetings)
    if (h.includes('physically') || h.includes('in person') || h.includes('in-person') ||
        h.includes('at office') || h.includes('face to face') || h.includes('in office')) {
      return { label: 'In-Person', icon: MapPin, color: 'bg-purple-100 text-purple-700 border-purple-200' };
    }
    if (h.includes('via gm') || h.includes('google meet') || h.includes('gmeet') || /\bgm\b/.test(h)) {
      return { label: 'Google Meet', icon: Video, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    if (h.includes('teams') || h.includes('ms teams')) {
      return { label: 'MS Teams', icon: Video, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
    }
    if (h.includes('via zoom') || h.includes('on zoom') || h.includes('zoom call')) {
      return { label: 'Zoom', icon: Video, color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
    if (h.includes('phone') || h.includes('via call') || h.includes('on call') || h.includes('via phone')) {
      return { label: 'Phone Call', icon: Phone, color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }

    // Type-based detection
    if (t.includes('zoom')) return { label: 'Zoom', icon: Video, color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (t.includes('google') || t === 'meet' || t === 'googlemeet') return { label: 'Google Meet', icon: Video, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (t.includes('teams') || t.includes('microsoft')) return { label: 'MS Teams', icon: Video, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
    if (t.includes('phone') || t.includes('call')) return { label: 'Phone Call', icon: Phone, color: 'bg-amber-100 text-amber-700 border-amber-200' };
    if (t.includes('person') || t.includes('office') || t.includes('address') || t === 'inperson') {
      return { label: 'In-Person', icon: MapPin, color: 'bg-purple-100 text-purple-700 border-purple-200' };
    }
    // Fallback: scan title for zoom
    if (h.includes('zoom')) return { label: 'Zoom', icon: Video, color: 'bg-blue-100 text-blue-700 border-blue-200' };
    return { label: 'Meeting', icon: MapPin, color: 'bg-gray-100 text-gray-600 border-gray-200' };
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
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'day'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Day</span>
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'week'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>Week</span>
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
              <span className="text-xs font-bold text-gray-900 px-2 min-w-[130px] text-center truncate">
                {navigatorTitle}
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {/* ═══════════ DAY VIEW ═══════════ */}
          {viewMode === 'day' && (
            <div className="space-y-4">
              {/* Day Header Summary & Rep Availability Strip */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Day Schedule & Rep Availability</div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      {currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      📅 {currentDayAppts.length} {currentDayAppts.length === 1 ? 'Meeting' : 'Meetings'}
                    </span>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {Math.max(0, agents.length - new Set(currentDayAppts.map(a => a.agentName.toLowerCase())).size)} / {agents.length || 8} Reps Free Today
                    </span>
                  </div>
                </div>

                {/* Rep Availability Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {agents.map((ag) => {
                    const agAppts = currentDayAppts.filter(
                      (a) => a.assignedTo === ag.ghlUserId || a.agentName.toLowerCase() === ag.name.toLowerCase()
                    );
                    const isBusy = agAppts.length > 0;

                    return (
                      <div
                        key={ag.ghlUserId || ag.name}
                        className={`p-2.5 rounded-xl border transition-all text-center space-y-1 ${
                          isBusy
                            ? 'bg-amber-50/50 border-amber-200 shadow-2xs'
                            : 'bg-emerald-50/50 border-emerald-200 shadow-2xs'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-white font-extrabold text-xs flex items-center justify-center mx-auto border shadow-xs text-gray-800">
                          {ag.name.charAt(0)}
                        </div>
                        <div className="font-bold text-xs text-gray-900 truncate" title={ag.name}>
                          {ag.name.split(' ')[0]}
                        </div>
                        <div className={`text-[10px] font-extrabold ${isBusy ? 'text-amber-800' : 'text-emerald-700'}`}>
                          {isBusy ? `${agAppts.length} booked` : '🟢 Free'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hourly Timeline */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs divide-y divide-gray-100 overflow-hidden">
                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => {
                  const hourStr = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
                  const hourAppts = currentDayAppts.filter((a) => {
                    const h = new Date(a.startTime).getHours();
                    return h === hour;
                  });

                  const busyInHour = new Set(hourAppts.map((a) => a.agentName.toLowerCase()));
                  const freeInHour = agents.filter((ag) => !busyInHour.has(ag.name.toLowerCase()));

                  return (
                    <div key={hour} className="p-3 sm:p-4 flex flex-col md:flex-row md:items-start gap-3 hover:bg-gray-50/40 transition-colors">
                      {/* Hour Label */}
                      <div className="w-24 shrink-0 text-xs font-extrabold text-gray-700 flex items-center gap-1.5 pt-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>{hourStr}</span>
                      </div>

                      {/* Hour Content */}
                      <div className="flex-1 min-w-0">
                        {hourAppts.length === 0 ? (
                          <div className="flex items-center justify-between text-xs py-1">
                            <span className="text-[11px] text-gray-400 font-medium italic">No scheduled meetings</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              All Reps Free (Open Slot)
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {hourAppts.map((appt) => {
                                const parsed = parseMeetingDetails(
                                  appt.title,
                                  appt.contactName,
                                  appt.agentName,
                                  appt.meetingLocationType
                                );
                                const mode = formatMeetingMode(appt.meetingLocationType, appt.title);
                                const ModeIcon = mode.icon;

                                return (
                                  <div
                                    key={appt.id}
                                    onClick={() => setSelectedAppt(appt)}
                                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/30 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
                                  >
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="font-extrabold text-blue-800">{formatTime(appt.startTime)}</span>
                                      <span className={`flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold border ${mode.color}`}>
                                        <ModeIcon className="w-2.5 h-2.5" />
                                        <span>{mode.label}</span>
                                      </span>
                                    </div>
                                    <div className="font-extrabold text-xs text-gray-900 mt-1 truncate group-hover:text-blue-600">
                                      {parsed.clientName}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-gray-600 mt-1 pt-1 border-t border-blue-100">
                                      <span className="truncate">With: <strong className="text-gray-900">{parsed.hostName}</strong></span>
                                      {parsed.bookedBy && (
                                        <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 px-1 rounded">
                                          By {parsed.bookedBy}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Free Reps Indicator for this hour */}
                            {freeInHour.length > 0 && (
                              <div className="text-[10px] text-gray-500 flex items-center gap-1 flex-wrap pt-0.5">
                                <span className="font-semibold text-emerald-700">🟢 Free Reps:</span>
                                <span className="text-gray-700 font-medium">
                                  {freeInHour.map((ag) => ag.name.split(' ')[0]).join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════ WEEK VIEW ═══════════ */}
          {viewMode === 'week' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {weekDays.map((dayObj) => {
                  const dateStr = dayObj.toISOString().slice(0, 10);
                  const isToday = new Date().toISOString().slice(0, 10) === dateStr;
                  const dayAppts = filteredAppointments
                    .filter((a) => a.startTime.slice(0, 10) === dateStr)
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

                  const busyAgentNames = new Set(dayAppts.map((a) => a.agentName.toLowerCase()));
                  const freeRepsCount = Math.max(0, agents.length - busyAgentNames.size);

                  return (
                    <div
                      key={dateStr}
                      className={`flex flex-col rounded-2xl border transition-all overflow-hidden ${
                        isToday
                          ? 'bg-blue-50/40 border-blue-400 shadow-sm ring-1 ring-blue-300'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {/* Column Header */}
                      <div
                        onClick={() => {
                          setCurrentDate(dayObj);
                          setViewMode('day');
                        }}
                        className={`p-2.5 border-b cursor-pointer transition-colors ${
                          isToday ? 'bg-blue-600 text-white' : 'bg-gray-50/80 hover:bg-gray-100 text-gray-800 border-gray-100'
                        }`}
                        title="Click to view full Day details"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wide">
                            {dayObj.toLocaleDateString([], { weekday: 'short' })}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            isToday ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {dayObj.getDate()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] mt-1 font-medium">
                          <span className={isToday ? 'text-blue-100' : 'text-gray-500'}>
                            {dayAppts.length} {dayAppts.length === 1 ? 'booking' : 'bookings'}
                          </span>
                          <span className={`font-bold ${isToday ? 'text-emerald-200' : 'text-emerald-700'}`}>
                            {freeRepsCount > 0 ? `${freeRepsCount} free` : 'Booked'}
                          </span>
                        </div>
                      </div>

                      {/* Column Appointments List */}
                      <div className="p-2 flex-1 space-y-2 min-h-[300px] max-h-[520px] overflow-y-auto">
                        {dayAppts.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-3 text-gray-400 min-h-[140px]">
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                              🟢 All Reps Free
                            </span>
                          </div>
                        ) : (
                          dayAppts.map((appt) => {
                            const parsed = parseMeetingDetails(
                              appt.title,
                              appt.contactName,
                              appt.agentName,
                              appt.meetingLocationType
                            );
                            const mode = formatMeetingMode(appt.meetingLocationType, appt.title);
                            const ModeIcon = mode.icon;

                            return (
                              <div
                                key={appt.id}
                                onClick={() => setSelectedAppt(appt)}
                                className="p-2 rounded-xl bg-white border border-gray-200/80 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-extrabold text-blue-700">
                                    {formatTime(appt.startTime)}
                                  </span>
                                  <span className={`flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-bold border ${mode.color}`}>
                                    <ModeIcon className="w-2 h-2" />
                                    <span>{mode.label}</span>
                                  </span>
                                </div>
                                <div className="font-extrabold text-[11px] text-gray-900 truncate group-hover:text-blue-600">
                                  {parsed.clientName}
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-gray-500 pt-1 border-t border-gray-100">
                                  <span className="truncate">w/ {parsed.hostName}</span>
                                  {parsed.bookedBy && (
                                    <span className="font-bold text-amber-800 bg-amber-50 px-1 rounded border border-amber-200/60">
                                      {parsed.bookedBy}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════════ MONTH VIEW ═══════════ */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Grid */}
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
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[72px] bg-gray-50/50 rounded-xl" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateObj = new Date(year, month, dayNum);
                    const dateStr = dateObj.toISOString().slice(0, 10);
                    const isToday = new Date().toISOString().slice(0, 10) === dateStr;
                    const isSelected =
                      selectedDateFilter && selectedDateFilter.toISOString().slice(0, 10) === dateStr;

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

                        <div className="space-y-0.5 mt-1 overflow-hidden">
                          {dayAppts.slice(0, 2).map((a) => {
                            const p = parseMeetingDetails(a.title, a.contactName, a.agentName, a.meetingLocationType);
                            return (
                              <div
                                key={a.id}
                                className="text-[9px] font-bold text-gray-700 bg-gray-100 px-1 py-0.5 rounded truncate"
                                title={`${p.clientName} (${formatTime(a.startTime)})`}
                              >
                                {formatTime(a.startTime)} {p.clientName}
                              </div>
                            );
                          })}
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
                    const parsed = parseMeetingDetails(appt.title, appt.contactName, appt.agentName, appt.meetingLocationType);
                    const mode = formatMeetingMode(appt.meetingLocationType, appt.title);
                    const ModeIcon = mode.icon;

                    return (
                      <div
                        key={appt.id}
                        onClick={() => setSelectedAppt(appt)}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-200/70 space-y-2 hover:bg-gray-100/60 transition-colors cursor-pointer"
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
                            {parsed.clientName}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {parsed.displayTitle}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            With: <span className="font-semibold text-gray-600">{parsed.hostName}</span>
                            {parsed.bookedBy && (
                              <span className="ml-1.5 text-amber-700 font-bold">· By: {parsed.bookedBy}</span>
                            )}
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
                              onClick={(e) => e.stopPropagation()}
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

          {/* ═══════════ AGENDA VIEW ═══════════ */}
          {viewMode === 'agenda' && (
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
                        const parsed = parseMeetingDetails(appt.title, appt.contactName, appt.agentName, appt.meetingLocationType);
                        const mode = formatMeetingMode(appt.meetingLocationType, appt.title);
                        const ModeIcon = mode.icon;
                        const isPast = new Date(appt.startTime) < new Date();

                        return (
                          <div
                            key={appt.id}
                            onClick={() => setSelectedAppt(appt)}
                            className={`bg-white rounded-2xl border shadow-sm transition-all flex flex-col cursor-pointer group ${
                              selectedAppt?.id === appt.id
                                ? 'border-blue-400 shadow-blue-100 shadow-md'
                                : isPast
                                ? 'border-gray-200/80 opacity-85 hover:opacity-100 hover:border-blue-200'
                                : 'border-gray-200/80 hover:shadow-md hover:border-blue-300'
                            }`}
                          >
                            <div className="p-4 space-y-2.5">
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
                                <div className="text-sm font-extrabold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                  {parsed.clientName}
                                </div>
                                <div className="text-xs text-gray-500 font-medium truncate">
                                  {parsed.displayTitle}
                                </div>
                                {appt.calendarName && (
                                  <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                                    📅 {appt.calendarName}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Bottom row: Agent & Actions */}
                            <div className="px-4 pb-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
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
                                <div className="min-w-0">
                                  <div className="text-[11px] font-bold text-gray-700 truncate">
                                    {parsed.hostName}
                                  </div>
                                  {parsed.bookedBy && (
                                    <div className="text-[9px] font-bold text-amber-700">
                                      by {parsed.bookedBy}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Meeting Button */}
                              {appt.meetingUrl ? (
                                <a
                                  href={appt.meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all shrink-0 active:scale-95"
                                >
                                  <span>Join</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-[10px] text-blue-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                  Details <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              )}
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
          )}
        </div>

        {/* Selected Appointment Detail Sheet Modal */}
        {selectedAppt && (
          <div
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setSelectedAppt(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-[420px] w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const parsed = parseMeetingDetails(
                  selectedAppt.title,
                  selectedAppt.contactName,
                  selectedAppt.agentName,
                  selectedAppt.meetingLocationType
                );
                const mode = formatMeetingMode(selectedAppt.meetingLocationType, selectedAppt.title);
                const ModeIcon = mode.icon;

                return (
                  <>
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 text-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                            Booking Detail
                          </span>
                          <h4 className="font-extrabold text-sm text-white line-clamp-2 mt-0.5">
                            {parsed.displayTitle}
                          </h4>
                        </div>
                        <button
                          onClick={() => setSelectedAppt(null)}
                          className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-white/20">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5 text-blue-200" />
                          <span>{formatDateLabel(selectedAppt.startTime)} at {formatTime(selectedAppt.startTime)}</span>
                        </div>
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${mode.color} bg-white`}>
                          <ModeIcon className="w-3 h-3" />
                          <span>{mode.label}</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3.5">
                      {/* Client Info */}
                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                        <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <User className="w-3 h-3" /> Client
                        </div>
                        <div className="font-extrabold text-sm text-gray-900">{parsed.clientName}</div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {selectedAppt.contactPhone ? (
                            <a
                              href={`tel:${selectedAppt.contactPhone}`}
                              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-xs"
                            >
                              <Phone className="w-2.5 h-2.5" />{selectedAppt.contactPhone}
                            </a>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">No phone attached</span>
                          )}
                          {selectedAppt.contactEmail && (
                            <a
                              href={`mailto:${selectedAppt.contactEmail}`}
                              className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs truncate max-w-[200px]"
                            >
                              <span className="text-[10px]">✉</span>
                              <span className="truncate">{selectedAppt.contactEmail}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Host & Booker */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Meeting With</div>
                          <div className="text-xs font-extrabold text-gray-900 truncate">{parsed.hostName}</div>
                          <div className="text-[10px] text-gray-500">Sales Rep</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">Booked By</div>
                          <div className="text-xs font-extrabold text-amber-950 truncate">{parsed.bookedBy || selectedAppt.agentName}</div>
                          <div className="text-[10px] text-amber-700">{parsed.bookedBy ? 'Setter Tag' : 'Calendar Owner'}</div>
                        </div>
                      </div>

                      {/* Calendar & Status */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold">Calendar:</span>
                          <span className="font-bold text-gray-800">{selectedAppt.calendarName || 'Default Calendar'}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          ['cancelled','canceled','no-show'].includes(selectedAppt.status.toLowerCase())
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {selectedAppt.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Action Button */}
                      {selectedAppt.meetingUrl ? (
                        <a
                          href={selectedAppt.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Join {mode.label} Room
                        </a>
                      ) : (
                        <button
                          onClick={() => setSelectedAppt(null)}
                          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

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
