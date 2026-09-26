'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  ExternalLink,
  User,
  Users,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  CalendarDays,
  X,
  Mail,
  Globe,
  Building2,
  Tv2,
} from 'lucide-react';
import { parseMeetingDetails } from '@/lib/meetingHelper';

export interface UpcomingMeetingItem {
  id: number;
  title: string;
  contactId?: number | null;
  contactName: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  assignedTo?: string | null;
  agentName: string;
  agentAvatar?: string | null;
  startTime: string;
  endTime?: string | null;
  status: string;
  meetingLocationType: string;
  meetingUrl?: string | null;
  calendarName?: string | null;
  bookedBy?: string | null;
  hostName?: string;
}

export interface AgentAvailabilityItem {
  id: string;
  name: string;
  avatarUrl?: string | null;
  bookingsToday: number;
  bookingsTotal: number;
  isAvailableNow: boolean;
  currentMeeting?: UpcomingMeetingItem | null;
  nextMeeting?: UpcomingMeetingItem | null;
}

interface UpcomingMeetingsPanelProps {
  meetings: UpcomingMeetingItem[];
  agents: Array<{
    ghlUserId: string;
    name: string;
    avatarUrl?: string | null;
    bookingsToday?: number;
    bookingsCount?: number;
  }>;
  onOpenCalendar?: () => void;
  onSelectAgent?: (agentId: string) => void;
  currency?: string;
}

// Detects meeting mode from the raw type field AND from the appointment title text
function resolveMeetingMode(raw: string, titleHint: string = '') {
  const t = (raw || '').toLowerCase().replace(/[_\-\s]/g, '');
  const h = (titleHint || '').toLowerCase();

  // Title-based overrides (GHL often stores wrong type; title is more accurate)
  if (h.includes('physically') || h.includes('in person') || h.includes('in-person') ||
      h.includes('at office') || h.includes('face to face') || h.includes('f2f') ||
      h.includes('at the office') || h.includes('in office')) {
    return { label: 'In-Person', icon: MapPin, color: 'bg-purple-50 text-purple-700 border-purple-200' };
  }
  if (h.includes('via gm') || h.includes('google meet') || h.includes('gmeet') || /\bgm\b/.test(h)) {
    return { label: 'Google Meet', icon: Video, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (h.includes('teams') || h.includes('ms teams')) {
    return { label: 'MS Teams', icon: Tv2, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  }
  if (h.includes('via zoom') || h.includes('on zoom') || h.includes('zoom call') || h.includes('zoom meeting')) {
    return { label: 'Zoom', icon: Video, color: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  if (h.includes('phone') || h.includes('via call') || h.includes('on call') || h.includes('by phone') || h.includes('via phone')) {
    return { label: 'Phone Call', icon: Phone, color: 'bg-amber-50 text-amber-700 border-amber-200' };
  }

  // Type-based detection
  if (t.includes('zoom')) return { label: 'Zoom', icon: Video, color: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (t.includes('google') || t === 'meet' || t === 'googlemeet') return { label: 'Google Meet', icon: Video, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (t.includes('teams') || t.includes('microsoft')) return { label: 'MS Teams', icon: Tv2, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  if (t.includes('phone') || t.includes('call')) return { label: 'Phone Call', icon: Phone, color: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (t.includes('person') || t.includes('office') || t.includes('site') || t.includes('address') || t === 'inperson') return { label: 'In-Person', icon: MapPin, color: 'bg-purple-50 text-purple-700 border-purple-200' };
  if (t.includes('webinar')) return { label: 'Webinar', icon: Globe, color: 'bg-teal-50 text-teal-700 border-teal-200' };

  // Fallback: scan title for any zoom mention
  if (h.includes('zoom')) return { label: 'Zoom', icon: Video, color: 'bg-blue-50 text-blue-700 border-blue-200' };

  return { label: 'Meeting', icon: Calendar, color: 'bg-gray-100 text-gray-600 border-gray-200' };
}

function ContactSheet({ meeting, onClose }: { meeting: UpcomingMeetingItem; onClose: () => void }) {
  const parsed = parseMeetingDetails(meeting.title, meeting.contactName, meeting.agentName, meeting.meetingLocationType);
  const mode = resolveMeetingMode(meeting.meetingLocationType, meeting.title);
  const ModeIcon = mode.icon;

  const fmtDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const dateStr = isToday ? 'Today' : d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      return { dateStr, timeStr };
    } catch { return { dateStr: '', timeStr: iso }; }
  };

  const { dateStr, timeStr } = fmtDate(meeting.startTime);
  const endTimeStr = meeting.endTime
    ? new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-white/20 rounded-full inline-block mb-1 text-indigo-100">
                CRM Booking Details
              </span>
              <h3 className="font-extrabold text-sm leading-snug text-white line-clamp-2">
                {parsed.displayTitle}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Time & Mode Bar */}
          <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-white/15">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
              <span className="text-xs font-bold text-white">{dateStr}</span>
              <span className="text-indigo-200 text-xs font-medium ml-1">
                {timeStr} {endTimeStr ? `– ${endTimeStr}` : ''}
              </span>
            </div>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-gray-800 shadow-sm shrink-0">
              <ModeIcon className="w-3 h-3 text-indigo-600" />
              <span>{mode.label}</span>
            </span>
          </div>
        </div>

        {/* Body: Key Parties with 100% clarity */}
        <div className="p-5 space-y-3.5">
          {/* 1. CLIENT (Person Being Met) */}
          <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-100">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3 h-3" />
              <span>Client / Person Being Met</span>
            </div>
            <div className="text-sm font-extrabold text-gray-900">{parsed.clientName}</div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {meeting.contactPhone ? (
                <a
                  href={`tel:${meeting.contactPhone}`}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-xs"
                >
                  <Phone className="w-2.5 h-2.5" />
                  {meeting.contactPhone}
                </a>
              ) : (
                <span className="text-[10px] text-gray-400 italic">No phone attached</span>
              )}
              {meeting.contactEmail ? (
                <a
                  href={`mailto:${meeting.contactEmail}`}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs truncate max-w-[200px]"
                >
                  <Mail className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{meeting.contactEmail}</span>
                </a>
              ) : (
                <span className="text-[10px] text-gray-400 italic">No email attached</span>
              )}
            </div>
          </div>

          {/* 2. MEETING WITH & BOOKED BY (Two columns) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Host / Rep to meet */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-400" />
                <span>Meeting With</span>
              </div>
              <div className="text-xs font-extrabold text-gray-900 truncate">{parsed.hostName}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Assigned Host / Rep</div>
            </div>

            {/* Booked By */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-amber-600" />
                <span>Booked By</span>
              </div>
              <div className="text-xs font-extrabold text-amber-950 truncate">
                {parsed.bookedBy || meeting.agentName || 'CRM'}
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">
                {parsed.bookedBy ? 'Appointment Setter Tag' : 'Calendar Owner'}
              </div>
            </div>
          </div>

          {/* 3. CALENDAR & STATUS */}
          <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 flex items-center justify-between text-xs">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-gray-400 block">Calendar:</span>
              <span className="font-bold text-gray-800 truncate block">
                {meeting.calendarName || 'Standard Sales Calendar'}
              </span>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border shrink-0 ${
              ['cancelled','canceled','no-show','noshow'].includes(meeting.status.toLowerCase())
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {meeting.status.toUpperCase()}
            </span>
          </div>

          {/* Join Meeting Button */}
          {meeting.meetingUrl ? (
            <a
              href={meeting.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Join {mode.label} Room
            </a>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TodaysMeetingTicker({ meetings }: { meetings: UpcomingMeetingItem[] }) {
  const now = new Date();
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const todayMeetings = useMemo(() => {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return meetings
      .filter((m) => { const t = new Date(m.startTime); return t >= startOfDay && t <= endOfDay; })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [meetings]);

  useEffect(() => {
    if (todayMeetings.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx((prev) => (prev + 1) % todayMeetings.length); setVisible(true); }, 400);
    }, 5000);
    return () => clearInterval(timer);
  }, [todayMeetings.length]);

  if (todayMeetings.length === 0) return null;

  const current = todayMeetings[idx % todayMeetings.length];
  const parsed = parseMeetingDetails(current.title, current.contactName, current.agentName, current.meetingLocationType);
  const mode = resolveMeetingMode(current.meetingLocationType, current.title);
  const ModeIcon = mode.icon;
  const meetingTime = new Date(current.startTime);
  const diffMins = Math.round((meetingTime.getTime() - now.getTime()) / 60000);
  const isNow = diffMins >= -30 && diffMins <= 5;
  const isPast = diffMins < -30;
  const timeStr = meetingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const badgeText = isNow ? '🔴 Now' : !isPast && diffMins <= 60 ? `⚡ In ${diffMins}m` : `${timeStr}`;
  const badgeClass = isNow ? 'bg-rose-100 text-rose-800 animate-pulse' : !isPast && diffMins <= 60 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600';

  return (
    <div className="flex items-center gap-2 py-1.5 px-3 bg-indigo-600/5 border-b border-indigo-100/60 overflow-hidden">
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-extrabold uppercase tracking-wider shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
        TODAY
      </span>
      <span className="text-[10px] font-bold text-gray-500 shrink-0">{todayMeetings.length} meetings:</span>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className={`flex items-center gap-2 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${badgeClass}`}>{badgeText}</span>
          <span className="text-xs font-bold text-gray-900 truncate">{parsed.clientName}</span>
          <span className="text-[10px] text-gray-400 font-medium truncate hidden sm:inline">— {parsed.displayTitle}</span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${mode.color}`}>
            <ModeIcon className="w-2.5 h-2.5" />{mode.label}
          </span>
          <span className="text-[10px] text-gray-500 font-medium shrink-0 hidden md:inline">w/ {parsed.hostName}</span>
          {parsed.bookedBy && (
            <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1 rounded shrink-0 hidden lg:inline">
              by {parsed.bookedBy}
            </span>
          )}
        </div>
      </div>
      {todayMeetings.length > 1 && (
        <div className="flex items-center gap-1 shrink-0">
          {todayMeetings.map((_, i) => (
            <button key={i} onClick={() => { setIdx(i); setVisible(true); }} className={`h-1.5 rounded-full transition-all ${i === idx % todayMeetings.length ? 'w-3 bg-indigo-600' : 'w-1.5 bg-gray-300'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function UpcomingMeetingsPanel({ meetings = [], agents = [], onOpenCalendar, currency = 'AED' }: UpcomingMeetingsPanelProps) {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'tomorrow' | 'week'>('all');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [viewTab, setViewTab] = useState<'meetings' | 'availability'>('meetings');
  const [selectedMeeting, setSelectedMeeting] = useState<UpcomingMeetingItem | null>(null);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const endOfTomorrow = new Date(startOfToday.getTime() + 2 * 24 * 60 * 60 * 1000 - 1);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

  const agentsAvailability: AgentAvailabilityItem[] = useMemo(() => {
    return agents.map((ag) => {
      const agentMeetings = meetings.filter((m) => m.assignedTo === ag.ghlUserId || m.agentName.toLowerCase() === ag.name.toLowerCase());
      const currentMeeting = agentMeetings.find((m) => {
        const s = new Date(m.startTime).getTime();
        const e = m.endTime ? new Date(m.endTime).getTime() : s + 45 * 60 * 1000;
        const curr = now.getTime();
        return curr >= s && curr <= e;
      }) || null;
      const futureMeetings = agentMeetings.filter((m) => new Date(m.startTime).getTime() > now.getTime()).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      return {
        id: ag.ghlUserId,
        name: ag.name,
        avatarUrl: ag.avatarUrl,
        bookingsToday: ag.bookingsToday ?? agentMeetings.filter((m) => { const t = new Date(m.startTime); return t >= startOfToday && t <= endOfToday; }).length,
        bookingsTotal: ag.bookingsCount ?? agentMeetings.length,
        isAvailableNow: !currentMeeting,
        currentMeeting,
        nextMeeting: futureMeetings[0] || null,
      };
    });
  }, [agents, meetings, now, startOfToday, endOfToday]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const t = new Date(m.startTime);
      if (selectedAgentFilter !== 'all') {
        if (m.assignedTo !== selectedAgentFilter && m.agentName.toLowerCase() !== selectedAgentFilter.toLowerCase()) return false;
      }
      if (filterPeriod === 'today') return t >= startOfToday && t <= endOfToday;
      if (filterPeriod === 'tomorrow') return t > endOfToday && t <= endOfTomorrow;
      if (filterPeriod === 'week') return t >= startOfToday && t <= endOfWeek;
      return true;
    });
  }, [meetings, selectedAgentFilter, filterPeriod, startOfToday, endOfToday, endOfTomorrow, endOfWeek]);

  const meetingsTodayCount = useMemo(() => meetings.filter((m) => { const t = new Date(m.startTime); return t >= startOfToday && t <= endOfToday; }).length, [meetings, startOfToday, endOfToday]);
  const currentlyAvailableAgentsCount = useMemo(() => agentsAvailability.filter((a) => a.isAvailableNow).length, [agentsAvailability]);

  const formatMeetingDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const isToday = d.toDateString() === now.toDateString();
      const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = d.toDateString() === tomorrow.toDateString();
      const timeFormatted = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      let dayLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' });
      if (isToday) dayLabel = 'Today';
      else if (isTomorrow) dayLabel = 'Tomorrow';
      const diffMins = Math.round((d.getTime() - now.getTime()) / 60000);
      let countdown = '';
      if (diffMins > 0 && diffMins <= 60) countdown = `In ${diffMins}m`;
      else if (diffMins > 60 && diffMins <= 180) { const h = Math.floor(diffMins / 60); countdown = `In ${h}h${diffMins % 60 > 0 ? ` ${diffMins % 60}m` : ''}`; }
      else if (diffMins <= 0 && diffMins >= -60) countdown = 'Happening Now';
      return { dayLabel, timeFormatted, countdown, isToday, isTomorrow };
    } catch { return { dayLabel: dateStr, timeFormatted: '', countdown: '', isToday: false, isTomorrow: false }; }
  };

  return (
    <section className="bg-white rounded-2xl card-shadow border border-indigo-100 overflow-hidden">
      <TodaysMeetingTicker meetings={meetings} />
      <div className="p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white mt-0.5 shadow-md shadow-indigo-600/20"><Calendar className="w-5 h-5" /></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-sm text-gray-900 tracking-tight">CLIENT MEETINGS & AGENT AVAILABILITY</h2>
                <span className="px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-800 rounded-full font-bold">Live CRM Calendar Hub</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Unified schedule, real-time slots and sales rep availability from GHL calendars.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-100 rounded-xl px-3 py-1.5 text-xs">
              <div className="flex items-center gap-1 text-indigo-900 font-bold">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                <span>Today:</span>
                <span className="bg-indigo-600 text-white px-1.5 rounded-full text-[11px]">{meetingsTodayCount}</span>
              </div>
              <div className="h-3.5 w-px bg-indigo-200" />
              <div className="flex items-center gap-1 text-emerald-800 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{currentlyAvailableAgentsCount}/{agentsAvailability.length} Reps Free</span>
              </div>
            </div>
            {onOpenCalendar && (
              <button onClick={onOpenCalendar} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 active:scale-95 shrink-0">
                <Calendar className="w-3.5 h-3.5" /><span>Full Calendar</span><ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl w-fit">
            <button type="button" onClick={() => setViewTab('meetings')} className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${viewTab === 'meetings' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}>
              <Clock className="w-3.5 h-3.5" /><span>Meetings ({filteredMeetings.length})</span>
            </button>
            <button type="button" onClick={() => setViewTab('availability')} className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${viewTab === 'availability' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}>
              <Users className="w-3.5 h-3.5" /><span>Availability ({agentsAvailability.length})</span>
            </button>
          </div>
          {viewTab === 'meetings' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-0.5">
                {[{id:'all',label:'All'},{id:'today',label:'Today'},{id:'tomorrow',label:'Tomorrow'},{id:'week',label:'Week'}].map((p) => (
                  <button key={p.id} onClick={() => setFilterPeriod(p.id as any)} className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all ${filterPeriod === p.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>{p.label}</button>
                ))}
              </div>
              {agents.length > 0 && (
                <select value={selectedAgentFilter} onChange={(e) => setSelectedAgentFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-gray-700 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[150px]">
                  <option value="all">All Reps</option>
                  {agents.map((ag) => <option key={ag.ghlUserId} value={ag.ghlUserId}>{ag.name}</option>)}
                </select>
              )}
            </div>
          )}
        </div>

        {viewTab === 'meetings' && (
          <>
            {filteredMeetings.length === 0 ? (
              <div className="py-7 px-5 rounded-2xl border border-dashed border-gray-200 text-center space-y-3 bg-gray-50/60">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600"><Calendar className="w-5 h-5" /></div>
                <div>
                  <div className="text-xs font-bold text-gray-800">No scheduled meetings recorded yet</div>
                  <p className="text-[11px] text-gray-500 max-w-md mx-auto mt-1">{filterPeriod !== 'all' ? `No appointments for "${filterPeriod}". Try "All".` : 'When clients book through GHL calendars, they appear here live.'}</p>
                </div>
                <div className="max-w-md mx-auto bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-left">
                  <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 mb-1">💡 Enable Live Calendar Sync in GHL:</div>
                  <p className="text-[10px] text-amber-800 leading-relaxed">Ensure your <strong>Private Integration Token</strong> has <code className="bg-amber-100 px-1 rounded font-mono">calendars.readonly</code> and <code className="bg-amber-100 px-1 rounded font-mono">calendars/events.readonly</code> in GHL Settings → Developers.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {filteredMeetings.map((meeting) => {
                  const timeInfo = formatMeetingDate(meeting.startTime);
                  const parsed = parseMeetingDetails(
                    meeting.title,
                    meeting.contactName,
                    meeting.agentName,
                    meeting.meetingLocationType
                  );
                  const mode = resolveMeetingMode(meeting.meetingLocationType, meeting.title);
                  const ModeIcon = mode.icon;
                  const isHappeningNow = timeInfo.countdown === 'Happening Now';

                  return (
                    <div
                      key={meeting.id}
                      onClick={() => setSelectedMeeting(meeting)}
                      className={`group relative flex flex-col justify-between p-2.5 rounded-xl border bg-white hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer overflow-hidden ${
                        isHappeningNow ? 'border-rose-300 ring-1 ring-rose-200 shadow-sm' : 'border-gray-200'
                      }`}
                    >
                      {/* Row 1: Time + Mode badge */}
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5 font-extrabold text-gray-900 min-w-0">
                          <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="truncate">{timeInfo.timeFormatted}</span>
                          <span className={`text-[10px] font-semibold shrink-0 ${timeInfo.isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
                            {timeInfo.dayLabel}
                          </span>
                          {timeInfo.countdown && (
                            <span className={`text-[9px] font-bold px-1 rounded shrink-0 ${
                              isHappeningNow ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {timeInfo.countdown}
                            </span>
                          )}
                        </div>
                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${mode.color}`}>
                          <ModeIcon className="w-2.5 h-2.5" />
                          <span>{mode.label}</span>
                        </span>
                      </div>

                      {/* Row 2: Client Name (Bold, High Visibility) */}
                      <div className="my-1.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[10px] flex items-center justify-center shrink-0 border border-indigo-100">
                            {parsed.clientName.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-extrabold text-xs text-gray-900 truncate tracking-tight group-hover:text-indigo-600 transition-colors" title={parsed.clientName}>
                            {parsed.clientName}
                          </div>
                        </div>
                      </div>

                      {/* Row 3: With [Host] & By [Booker] */}
                      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-gray-100 gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-gray-400 text-[9px] font-medium shrink-0">With:</span>
                          <span className="font-bold text-gray-700 truncate" title={parsed.hostName}>
                            {parsed.hostName}
                          </span>
                        </div>
                        {parsed.bookedBy ? (
                          <span
                            className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-extrabold shrink-0"
                            title={`Booked by ${parsed.bookedBy}`}
                          >
                            By {parsed.bookedBy}
                          </span>
                        ) : (
                          <span className="text-[9px] text-gray-400 truncate max-w-[80px]" title={meeting.agentName}>
                            {meeting.agentName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {viewTab === 'availability' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {agentsAvailability.map((rep) => (
              <div key={rep.id} className="p-3 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 transition-all space-y-2.5 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {rep.avatarUrl ? <img src={rep.avatarUrl} alt={rep.name} className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0" /> : <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">{rep.name.charAt(0)}</div>}
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-gray-900 truncate">{rep.name}</div>
                      <div className="text-[10px] text-gray-400">{rep.bookingsToday} today · {rep.bookingsTotal} total</div>
                    </div>
                  </div>
                  {rep.isAvailableNow ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Free</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />In Meeting</span>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-gray-50 text-[11px] border border-gray-100 space-y-0.5">
                  <div className="text-gray-500 font-medium flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /><span>Next:</span></div>
                  {rep.nextMeeting ? (() => {
                    const np = parseMeetingDetails(rep.nextMeeting.title, rep.nextMeeting.contactName, rep.name, rep.nextMeeting.meetingLocationType);
                    return (
                      <div className="font-bold text-gray-800 truncate">
                        {formatMeetingDate(rep.nextMeeting.startTime).dayLabel} at {formatMeetingDate(rep.nextMeeting.startTime).timeFormatted} ({np.clientName})
                      </div>
                    );
                  })() : (
                    <div className="font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /><span>Available for new bookings</span></div>
                  )}
                </div>
                <button type="button" onClick={() => { setSelectedAgentFilter(rep.id); setViewTab('meetings'); }} className="w-full py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1">
                  <span>View schedule</span><ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMeeting && <ContactSheet meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} />}
    </section>
  );
}
