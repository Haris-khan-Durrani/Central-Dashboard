'use client';

import React, { useState, useMemo } from 'react';
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
  Filter,
  ArrowUpRight,
  Sparkles,
  CalendarDays,
  Radio,
} from 'lucide-react';

export interface UpcomingMeetingItem {
  id: number;
  title: string;
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

export default function UpcomingMeetingsPanel({
  meetings = [],
  agents = [],
  onOpenCalendar,
  currency = 'AED',
}: UpcomingMeetingsPanelProps) {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'tomorrow' | 'week'>('all');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [viewTab, setViewTab] = useState<'meetings' | 'availability'>('meetings');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const endOfTomorrow = new Date(startOfToday.getTime() + 2 * 24 * 60 * 60 * 1000 - 1);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

  // Compute availability state for all agents
  const agentsAvailability: AgentAvailabilityItem[] = useMemo(() => {
    return agents.map((ag) => {
      const agentMeetings = meetings.filter(
        (m) => m.assignedTo === ag.ghlUserId || m.agentName.toLowerCase() === ag.name.toLowerCase()
      );

      // Check if currently in a meeting
      const currentMeeting =
        agentMeetings.find((m) => {
          const s = new Date(m.startTime).getTime();
          const e = m.endTime ? new Date(m.endTime).getTime() : s + 45 * 60 * 1000;
          const curr = now.getTime();
          return curr >= s && curr <= e;
        }) || null;

      // Find next upcoming meeting
      const futureMeetings = agentMeetings
        .filter((m) => new Date(m.startTime).getTime() > now.getTime())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      const nextMeeting = futureMeetings[0] || null;

      return {
        id: ag.ghlUserId,
        name: ag.name,
        avatarUrl: ag.avatarUrl,
        bookingsToday: ag.bookingsToday ?? agentMeetings.filter((m) => {
          const t = new Date(m.startTime);
          return t >= startOfToday && t <= endOfToday;
        }).length,
        bookingsTotal: ag.bookingsCount ?? agentMeetings.length,
        isAvailableNow: !currentMeeting,
        currentMeeting,
        nextMeeting,
      };
    });
  }, [agents, meetings, now, startOfToday, endOfToday]);

  // Filter meetings based on user controls
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const meetingTime = new Date(m.startTime);

      // Agent filter
      if (selectedAgentFilter !== 'all') {
        const matchesAgent =
          m.assignedTo === selectedAgentFilter ||
          m.agentName.toLowerCase() === selectedAgentFilter.toLowerCase();
        if (!matchesAgent) return false;
      }

      // Period filter
      if (filterPeriod === 'today') {
        return meetingTime >= startOfToday && meetingTime <= endOfToday;
      }
      if (filterPeriod === 'tomorrow') {
        return meetingTime > endOfToday && meetingTime <= endOfTomorrow;
      }
      if (filterPeriod === 'week') {
        return meetingTime >= startOfToday && meetingTime <= endOfWeek;
      }

      return true;
    });
  }, [meetings, selectedAgentFilter, filterPeriod, startOfToday, endOfToday, endOfTomorrow, endOfWeek]);

  // Summary counts
  const meetingsTodayCount = useMemo(() => {
    return meetings.filter((m) => {
      const t = new Date(m.startTime);
      return t >= startOfToday && t <= endOfToday;
    }).length;
  }, [meetings, startOfToday, endOfToday]);

  const currentlyAvailableAgentsCount = useMemo(() => {
    return agentsAvailability.filter((a) => a.isAvailableNow).length;
  }, [agentsAvailability]);

  // Format meeting date/time nicely
  const formatMeetingDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const isToday = d.toDateString() === now.toDateString();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = d.toDateString() === tomorrow.toDateString();

      const timeFormatted = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

      let dayLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' });
      if (isToday) dayLabel = 'Today';
      else if (isTomorrow) dayLabel = 'Tomorrow';

      const diffMins = Math.round((d.getTime() - now.getTime()) / 60000);
      let countdown = '';
      if (diffMins > 0 && diffMins <= 60) {
        countdown = `In ${diffMins}m`;
      } else if (diffMins > 60 && diffMins <= 180) {
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        countdown = `In ${hrs}h ${mins > 0 ? `${mins}m` : ''}`;
      } else if (diffMins <= 0 && diffMins >= -60) {
        countdown = 'Happening Now';
      }

      return { dayLabel, timeFormatted, countdown, isToday, isTomorrow };
    } catch {
      return { dayLabel: dateStr, timeFormatted: '', countdown: '', isToday: false, isTomorrow: false };
    }
  };

  const renderLocationBadge = (type: string, url?: string | null) => {
    const t = (type || '').toLowerCase();
    if (t.includes('zoom')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Video className="w-3 h-3 text-blue-600" />
          <span>Zoom</span>
        </span>
      );
    }
    if (t.includes('meet') || t.includes('google')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Video className="w-3 h-3 text-emerald-600" />
          <span>Google Meet</span>
        </span>
      );
    }
    if (t.includes('phone') || t.includes('call')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Phone className="w-3 h-3 text-amber-600" />
          <span>Phone Call</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
        <MapPin className="w-3 h-3 text-purple-600" />
        <span>In-Person</span>
      </span>
    );
  };

  return (
    <section className="bg-white rounded-2xl p-5 card-shadow border border-indigo-100 bg-gradient-to-r from-indigo-50/30 via-white to-white space-y-4">
      {/* 1. Header Bar: Title, Live Status & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white mt-0.5 shadow-md shadow-indigo-600/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-sm text-gray-900 tracking-tight flex items-center gap-2">
                UPCOMING CLIENT MEETINGS & AGENT AVAILABILITY
              </h2>
              <span className="px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-800 rounded-full font-bold">
                Live GHL Calendar Hub
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Unified schedule, real-time booking slots, and active sales rep availability across all sub-account calendars.
            </p>
          </div>
        </div>

        {/* Global Summary Metrics & Open Calendar CTA */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-100 rounded-xl px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1 text-indigo-900 font-bold">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
              <span>Today:</span>
              <span className="bg-indigo-600 text-white px-1.5 py-0.2 rounded-full text-[11px]">
                {meetingsTodayCount}
              </span>
            </div>
            <div className="h-3.5 w-px bg-indigo-200" />
            <div className="flex items-center gap-1 text-emerald-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{currentlyAvailableAgentsCount}/{agentsAvailability.length} Reps Available</span>
            </div>
          </div>

          {onOpenCalendar && (
            <button
              onClick={onOpenCalendar}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 active:scale-95 shrink-0"
              title="Open Full Screen Interactive Calendar with drag-and-drop bookings"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Open Calendar View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-Navigation / Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Left: View Switcher (Meetings vs Team Availability) */}
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setViewTab('meetings')}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              viewTab === 'meetings'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled Meetings ({filteredMeetings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('availability')}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              viewTab === 'availability'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Rep Availability ({agentsAvailability.length})</span>
          </button>
        </div>

        {/* Right: Date Period and Agent Quick-Filters */}
        {viewTab === 'meetings' && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Period Pills */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-0.5">
              {[
                { id: 'all', label: 'All Upcoming' },
                { id: 'today', label: 'Today' },
                { id: 'tomorrow', label: 'Tomorrow' },
                { id: 'week', label: 'This Week' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setFilterPeriod(p.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                    filterPeriod === p.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Agent Select Filter */}
            {agents.length > 0 && (
              <select
                value={selectedAgentFilter}
                onChange={(e) => setSelectedAgentFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-gray-700 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">👥 All Sales Reps</option>
                {agents.map((ag) => (
                  <option key={ag.ghlUserId} value={ag.ghlUserId}>
                    {ag.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* 3. Main Content: ViewTab 1 -> Scheduled Meetings Cards Grid */}
      {viewTab === 'meetings' && (
        <>
          {filteredMeetings.length === 0 ? (
            <div className="py-7 px-5 rounded-2xl border border-dashed border-gray-200 text-center space-y-3 bg-gray-50/60">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-800">No scheduled meetings recorded yet</div>
                <p className="text-[11px] text-gray-500 max-w-md mx-auto mt-1">
                  {filterPeriod !== 'all'
                    ? `No client appointments found for "${filterPeriod}".`
                    : 'When clients book calls or meetings through GoHighLevel calendars, they will stream live to this hub.'}
                </p>
              </div>

              {/* Permission & Setup helper notice */}
              <div className="max-w-md mx-auto bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-left space-y-1">
                <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>How to enable Live Calendar Sync in GoHighLevel:</span>
                </div>
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  If your team uses HighLevel calendars, ensure your <strong>Private Integration Token</strong> has the <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">calendars.readonly</code> and <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">calendars/events.readonly</code> permissions enabled in GHL Settings → Developers.
                </p>
              </div>

              {filterPeriod !== 'all' && (
                <button
                  onClick={() => setFilterPeriod('all')}
                  className="px-3.5 py-1.5 bg-white border border-gray-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors shadow-2xs"
                >
                  View All Upcoming Meetings
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredMeetings.map((meeting) => {
                const timeInfo = formatMeetingDate(meeting.startTime);

                return (
                  <div
                    key={meeting.id}
                    className="p-3.5 rounded-xl border border-gray-200/90 bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
                  >
                    {/* Top row: Date/Time Badge & Meeting Mode Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                            timeInfo.isToday
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <Clock className="w-3 h-3 text-indigo-600" />
                          <span>{timeInfo.dayLabel}, {timeInfo.timeFormatted}</span>
                        </span>
                        {timeInfo.countdown && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 animate-pulse">
                            {timeInfo.countdown}
                          </span>
                        )}
                      </div>

                      {renderLocationBadge(meeting.meetingLocationType, meeting.meetingUrl)}
                    </div>

                    {/* Middle: Contact details & Title */}
                    <div className="space-y-1">
                      <div className="font-extrabold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                        {meeting.contactName}
                      </div>
                      <div className="text-xs text-gray-600 font-medium truncate">
                        {meeting.title}
                      </div>
                      {meeting.calendarName && (
                        <div className="text-[11px] text-gray-400 font-medium truncate flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                          <span>Calendar: {meeting.calendarName}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom: Assigned Agent & Join Call Action */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                      {/* Agent avatar & name */}
                      <div className="flex items-center gap-2 min-w-0">
                        {meeting.agentAvatar ? (
                          <img
                            src={meeting.agentAvatar}
                            alt={meeting.agentName}
                            className="w-6 h-6 rounded-full object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {meeting.agentName.charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold text-gray-700 truncate max-w-[110px]" title={meeting.agentName}>
                          {meeting.agentName}
                        </span>
                      </div>

                      {/* Join Meeting Room Button */}
                      {meeting.meetingUrl ? (
                        <a
                          href={meeting.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all shadow-2xs shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Join Meeting</span>
                        </a>
                      ) : (
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                          {meeting.status}
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

      {/* 3. Main Content: ViewTab 2 -> Rep Availability & Capacity Board */}
      {viewTab === 'availability' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {agentsAvailability.map((rep) => {
            return (
              <div
                key={rep.id}
                className="p-3 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 transition-all space-y-2.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {rep.avatarUrl ? (
                      <img
                        src={rep.avatarUrl}
                        alt={rep.name}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {rep.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-gray-900 truncate" title={rep.name}>
                        {rep.name}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {rep.bookingsToday} meetings today · {rep.bookingsTotal} total
                      </div>
                    </div>
                  </div>

                  {/* Real-time Status Badge */}
                  {rep.isAvailableNow ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Free</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>In Meeting</span>
                    </span>
                  )}
                </div>

                {/* Next scheduled meeting or free indicator */}
                <div className="p-2 rounded-lg bg-gray-50 text-[11px] border border-gray-100 space-y-0.5">
                  <div className="text-gray-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>Next Appointment:</span>
                  </div>
                  {rep.nextMeeting ? (
                    <div className="font-bold text-gray-800 truncate">
                      {formatMeetingDate(rep.nextMeeting.startTime).dayLabel} at{' '}
                      {formatMeetingDate(rep.nextMeeting.startTime).timeFormatted} (
                      {rep.nextMeeting.contactName})
                    </div>
                  ) : (
                    <div className="font-medium text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Available for new bookings</span>
                    </div>
                  )}
                </div>

                {/* Filter button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAgentFilter(rep.id);
                    setViewTab('meetings');
                  }}
                  className="w-full py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span>View rep schedule</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
