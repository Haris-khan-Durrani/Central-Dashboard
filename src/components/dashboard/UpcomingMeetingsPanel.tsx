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
  if (h.includes('google meet') || h.includes('gmeet')) {
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
  const mode = resolveMeetingMode(meeting.meetingLocationType);
  const ModeIcon = mode.icon;

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const dateStr = isToday ? 'Today' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${dateStr} at ${timeStr}`;
    } catch { return iso; }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg font-extrabold shadow-lg shrink-0">
              {meeting.contactName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-extrabold text-gray-900 text-base leading-tight">{meeting.contactName}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">{meeting.title}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Appointment</div>
              <div className="text-xs font-bold text-indigo-900">{formatTime(meeting.startTime)}</div>
              {meeting.endTime && <div className="text-[10px] text-indigo-600 font-medium">Until {new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</div>}
            </div>
            <span className={`ml-auto px-2.5 py-0.5 text-[10px] font-bold rounded-full border flex items-center gap-1 ${mode.color}`}>
              <ModeIcon className="w-3 h-3" />{mode.label}
            </span>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Info</div>
            {meeting.contactPhone && (
              <a href={`tel:${meeting.contactPhone}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Phone className="w-3.5 h-3.5" /></div>
                <div className="min-w-0">
                  <div className="text-[10px] text-gray-400 font-medium">Phone</div>
                  <div className="text-xs font-bold text-gray-800 group-hover:text-emerald-700">{meeting.contactPhone}</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 ml-auto" />
              </a>
            )}
            {meeting.contactEmail && (
              <a href={`mailto:${meeting.contactEmail}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Mail className="w-3.5 h-3.5" /></div>
                <div className="min-w-0">
                  <div className="text-[10px] text-gray-400 font-medium">Email</div>
                  <div className="text-xs font-bold text-gray-800 group-hover:text-blue-700 truncate">{meeting.contactEmail}</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-600 ml-auto" />
              </a>
            )}
            {!meeting.contactPhone && !meeting.contactEmail && (
              <div className="py-2 px-3 rounded-xl bg-gray-50 text-xs text-gray-400 italic">No contact details available</div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Sales Rep</div>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              {meeting.agentAvatar ? (
                <img src={meeting.agentAvatar} alt={meeting.agentName} className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">{meeting.agentName.charAt(0)}</div>
              )}
              <div>
                <div className="text-xs font-bold text-gray-800">{meeting.agentName}</div>
                {meeting.calendarName && <div className="text-[10px] text-gray-400 font-medium">📅 {meeting.calendarName}</div>}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${['cancelled','canceled','no-show','noshow'].includes(meeting.status.toLowerCase()) ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {meeting.status}
            </span>
            {meeting.meetingUrl && (
              <a href={meeting.meetingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm shadow-indigo-600/20">
                <ExternalLink className="w-3.5 h-3.5" />
                Join Meeting
              </a>
            )}
          </div>
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
  const mode = resolveMeetingMode(current.meetingLocationType);
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
          <span className="text-xs font-bold text-gray-900 truncate">{current.contactName}</span>
          <span className="text-[10px] text-gray-400 font-medium truncate hidden sm:inline">— {current.title}</span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${mode.color}`}>
            <ModeIcon className="w-2.5 h-2.5" />{mode.label}
          </span>
          <span className="text-[10px] text-gray-500 font-medium shrink-0 hidden md:inline">w/ {current.agentName}</span>
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
              <div className="flex flex-col gap-1.5">
                {filteredMeetings.map((meeting) => {
                  const timeInfo = formatMeetingDate(meeting.startTime);
                  // Detect meeting mode from both the type field AND the title text
                  const mode = resolveMeetingMode(meeting.meetingLocationType, meeting.title);
                  const ModeIcon = mode.icon;
                  const isHappeningNow = timeInfo.countdown === 'Happening Now';
                  // Use title as primary headline (GHL title has real meeting description)
                  // ContactName as subtitle (if it's a generic fallback, hide it)
                  const headline = meeting.title && meeting.title !== 'Client Appointment' && meeting.title !== 'Lead Appointment'
                    ? meeting.title
                    : meeting.contactName;
                  const subline = meeting.title !== headline ? meeting.contactName : null;
                  const hideSubline = !subline || subline === 'Lead Appointment' || subline === 'Client Appointment';
                  return (
                    <div
                      key={meeting.id}
                      onClick={() => setSelectedMeeting(meeting)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white hover:bg-indigo-50/30 hover:border-indigo-300 transition-all group relative overflow-hidden cursor-pointer ${
                        isHappeningNow ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200/90'
                      }`}
                    >
                      {isHappeningNow && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-rose-500" />}

                      {/* Time column */}
                      <div className="shrink-0 text-center min-w-[72px]">
                        <div className={`text-[10px] font-bold truncate ${timeInfo.isToday ? 'text-indigo-700' : 'text-gray-500'}`}>{timeInfo.dayLabel}</div>
                        <div className="text-xs font-extrabold text-gray-900">{timeInfo.timeFormatted}</div>
                        {timeInfo.countdown && (
                          <div className={`text-[9px] font-bold px-1 rounded mt-0.5 inline-block ${
                            isHappeningNow ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'
                          }`}>{timeInfo.countdown}</div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="h-8 w-px bg-gray-200 shrink-0" />

                      {/* Meeting info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-gray-900 group-hover:text-indigo-700 transition-colors truncate">{headline}</div>
                        {!hideSubline && <div className="text-[10px] text-gray-500 font-medium truncate">{subline}</div>}
                        {meeting.calendarName && <div className="text-[9px] text-gray-400 truncate">📅 {meeting.calendarName}</div>}
                      </div>

                      {/* Mode badge */}
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${mode.color}`}>
                        <ModeIcon className="w-2.5 h-2.5" />
                        <span className="hidden sm:inline">{mode.label}</span>
                      </span>

                      {/* Agent avatar */}
                      <div className="shrink-0">
                        {meeting.agentAvatar ? (
                          <img src={meeting.agentAvatar} alt={meeting.agentName} title={meeting.agentName} className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center border border-indigo-200" title={meeting.agentName}>{meeting.agentName.charAt(0)}</div>
                        )}
                      </div>

                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0" />
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
                  {rep.nextMeeting ? (
                    <div className="font-bold text-gray-800 truncate">{formatMeetingDate(rep.nextMeeting.startTime).dayLabel} at {formatMeetingDate(rep.nextMeeting.startTime).timeFormatted} ({rep.nextMeeting.contactName})</div>
                  ) : (
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
