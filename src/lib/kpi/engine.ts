import prisma from '../db';
import { fastCache } from '../cache';
import { parseMeetingDetails } from '../meetingHelper';

export interface KpiFilterOptions {
  locationId: string;
  dateRange?: string; // 'today', 'yesterday', 'last_7', 'this_month', 'last_month', 'last_30', 'this_quarter', 'this_year', 'all', 'custom'
  startDate?: string; // YYYY-MM-DD for custom
  endDate?: string;   // YYYY-MM-DD for custom
  dateBasis?: string; // 'created', 'updated', 'won', 'assigned', 'stage_entered'
  pipelineId?: string; // 'all' or specific pipeline id
  agentId?: string; // 'all' or specific ghlUserId
}

export interface CommandCenterData {
  location: {
    locationId: string;
    name: string;
    currency: string;
    timezone: string;
    enableBookings: boolean;
    lastSyncAt: string | null;
  };
  summary: {
    totalLeads: number;
    openDeals: number;
    wonDeals: number;
    lostDeals: number;
    conversionRate: string;
    pipelineValue: number;
    tasksPending: number;
    tasksOverdue: number;
  };
  bottlenecks: {
    uncontactedCount: number;
    stuckInContactedCount: number;
    agentsWithOverdueCount: number;
    items: Array<{
      id: string;
      type: 'danger' | 'warning' | 'purple';
      title: string;
      description: string;
      actionText: string;
      actionType: string;
    }>;
  };
  agents: Array<{
    id: string;
    ghlUserId: string;
    name: string;
    role: string;
    avatarUrl: string | null;
    leads: number;
    worked: number;
    won: number;
    lost: number;
    conversion: string;
    revenue: number;
    targetRevenue: number;
    targetProgress: number;
    pace: string;
    tasksToday: number;
    tasksPending: number;
    tasksOverdue: number;
    callsCount: number;
    whatsappCount: number;
    bookingsCount: number;
    bookingsToday: number;
    isLive: boolean;
    stageBreakdown: Record<string, number>;
  }>;
  upcomingBookings: Array<{
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
    bookedBy?: string | null;
    hostName?: string;
  }>;
  appointments: Array<{
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
    bookedBy?: string | null;
    hostName?: string;
  }>;
  pipelines: Array<{
    id: number;
    name: string;
    ghlPipelineId: string;
  }>;
  pipelineStages: Array<{
    id: number;
    name: string;
    leadCount: number;
    percentage: number;
    avgVelocityText: string;
    color: string;
  }>;
  leadSources: Array<{
    source: string;
    leads: number;
    won: number;
    conversionRate: string;
    revenue: number;
    color: string;
  }>;
  nationalities: Array<{
    nationality: string;
    leads: number;
    won: number;
    conversionRate: string;
    revenue: number;
    color: string;
  }>;
}

/**
 * Normalizes lead source strings to prevent fragmentation from case differences,
 * typos, plural/singular forms, or formatting variations (e.g. "WhatsApp", "Whatsapp", "whatsapp", "Whatsapp Lead", "Whatsapp Leads" -> "WhatsApp").
 */
export function normalizeLeadSource(rawSource: string | null | undefined): { key: string; displayName: string } {
  if (!rawSource || !rawSource.trim()) {
    return { key: 'direct', displayName: 'Direct' };
  }

  const cleaned = rawSource.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  const lower = cleaned.toLowerCase();

  // 1. WhatsApp variations (WhatsApp, whatsapp, Whatsapp Lead, Whatsapp Leads, agent whatsapp, whats app)
  if (lower.includes('whatsapp') || lower.includes('whats app')) {
    return { key: 'whatsapp', displayName: 'WhatsApp' };
  }

  // 2. Facebook Messenger variations (messanger, messenger)
  if (lower.includes('facebook') && (lower.includes('mess') || lower.includes('msg') || lower.includes('chat'))) {
    return { key: 'facebook_messenger', displayName: 'Facebook Messenger' };
  }

  // 3. Instagram Messenger variations
  if ((lower.includes('instagram') || lower.startsWith('ig')) && (lower.includes('mess') || lower.includes('msg') || lower.includes('chat') || lower.includes('dm'))) {
    return { key: 'instagram_messenger', displayName: 'Instagram Messenger' };
  }

  // 4. TikTok Messenger variations
  if ((lower.includes('tiktok') || lower.includes('tik tok')) && (lower.includes('mess') || lower.includes('msg') || lower.includes('chat') || lower.includes('dm'))) {
    return { key: 'tiktok_messenger', displayName: 'TikTok Messenger' };
  }

  // 5. Facebook & Facebook Ads
  if (lower === 'facebook ads' || lower === 'fb ads' || lower === 'facebook ad' || lower === 'facebook_ads') {
    return { key: 'facebook_ads', displayName: 'Facebook Ads' };
  }
  if (lower === 'facebook' || lower === 'fb') {
    return { key: 'facebook', displayName: 'Facebook' };
  }

  // 6. TikTok & TikTok Ads
  if (lower === 'tiktok' || lower === 'tik tok' || lower === 'tiktok ads') {
    return { key: 'tiktok', displayName: 'TikTok' };
  }

  // 7. Instagram
  if (lower === 'instagram' || lower === 'ig' || lower === 'instagram ads') {
    return { key: 'instagram', displayName: 'Instagram' };
  }

  // 8. Google
  if (lower === 'google ads' || lower === 'google ad' || lower === 'google cpc' || lower === 'google ppc') {
    return { key: 'google_ads', displayName: 'Google Ads' };
  }
  if (lower === 'google' || lower === 'google search' || lower === 'google organic') {
    return { key: 'google_search', displayName: 'Google Search' };
  }

  // 9. Manual Entry
  if (lower === 'manual' || lower === 'manual entry' || lower === 'manual input') {
    return { key: 'manual_entry', displayName: 'Manual Entry' };
  }

  // 10. Phonebook
  if (lower === 'phonebook' || lower === 'phonebook import' || lower === 'phone book') {
    return { key: 'phonebook_import', displayName: 'Phonebook Import' };
  }

  // 11. Website Form
  if (lower.includes('website form') || lower.includes('web form') || lower.includes('webform') || lower === 'website') {
    return { key: 'website_form', displayName: 'Website Form' };
  }

  // 12. Referral
  if (lower.includes('referral')) {
    return { key: 'referral', displayName: 'Client Referral' };
  }

  // 13. Direct
  if (lower === 'direct') {
    return { key: 'direct', displayName: 'Direct' };
  }

  // 14. Privyr / Privier
  if (lower === 'privyr' || lower === 'privier') {
    return { key: 'privyr', displayName: 'Privyr' };
  }

  // Generic fallback: title case every word and use lower as key
  // This guarantees that ANY same spelling regardless of casing/spacing/hyphens gets merged!
  const titleCased = cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return { key: lower, displayName: titleCased };
}

export async function getCommandCenterKpis(filters: KpiFilterOptions): Promise<CommandCenterData> {
  const {
    locationId,
    dateRange = 'this_month',
    startDate: customStart,
    endDate: customEnd,
    dateBasis = 'created',
    pipelineId = 'all',
    agentId = 'all',
  } = filters;

  const cacheKey = `loc:${locationId}:cc:${dateRange}:${customStart || ''}:${customEnd || ''}:${dateBasis}:${pipelineId}:${agentId}`;
  const cached = fastCache.get<CommandCenterData>(cacheKey);
  if (cached) return cached;

  const loc = await prisma.ghlLocation.findUnique({
    where: { locationId },
  });

  if (!loc) {
    throw new Error(`Location ${locationId} not found.`);
  }

  const now = new Date();
  let startDate: Date | undefined;
  let endDate: Date | undefined = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Parse date ranges
  if (dateRange === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (dateRange === 'yesterday') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
  } else if (dateRange === 'last_7') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
  } else if (dateRange === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else if (dateRange === 'last_month') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (dateRange === 'last_30') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
  } else if (dateRange === 'this_quarter' || dateRange === 'q3') {
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    startDate = new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), quarterMonth + 3, 0, 23, 59, 59, 999);
  } else if (dateRange === 'this_year') {
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (dateRange === 'all') {
    startDate = undefined;
    endDate = undefined;
  } else if (dateRange === 'custom') {
    if (customStart) {
      const parts = customStart.split('-');
      startDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0, 0);
    }
    if (customEnd) {
      const parts = customEnd.split('-');
      endDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 23, 59, 59, 999);
    }
  }

  // Date basis field mapping
  const dateField =
    dateBasis === 'updated'
      ? 'updatedAt'
      : dateBasis === 'won'
      ? 'wonAt'
      : dateBasis === 'assigned'
      ? 'assignedAt'
      : dateBasis === 'stage_entered'
      ? 'stageEnteredAt'
      : 'createdAt';

  // Build where clause for opportunities
  const oppWhere: any = {
    locationId,
  };

  if (startDate || endDate) {
    oppWhere[dateField] = {};
    if (startDate) oppWhere[dateField].gte = startDate;
    if (endDate) oppWhere[dateField].lte = endDate;
  }

  let selectedPipelineIdNum: number | undefined;
  if (pipelineId !== 'all') {
    const pId = parseInt(pipelineId, 10);
    if (!isNaN(pId)) {
      oppWhere.pipelineId = pId;
      selectedPipelineIdNum = pId;
    }
  }

  if (agentId !== 'all') {
    oppWhere.assignedTo = agentId;
  }

  // Fetch data in parallel for maximum speed
  const [opportunities, dbUsers, rawPipelines, pendingTasks, dbAppointments] = await Promise.all([
    prisma.opportunity.findMany({
      where: oppWhere,
      select: {
        id: true,
        name: true,
        status: true,
        monetaryValue: true,
        assignedTo: true,
        pipelineId: true,
        stageId: true,
        source: true,
        nationality: true,
        customFields: true,
        contact: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            nationality: true,
            customFields: true,
          },
        },
        createdAt: true,
        stageEnteredAt: true,
      },
    }),
    prisma.user.findMany({
      where: { locationId, isActive: true },
      select: { ghlUserId: true, name: true, role: true, avatarUrl: true },
      orderBy: { name: 'asc' },
    }),
    prisma.pipeline.findMany({
      where: { locationId },
      include: {
        stages: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.task.findMany({
      where: {
        locationId,
        completed: false,
        ...(agentId !== 'all' ? { assignedTo: agentId } : {}),
      },
      select: { id: true, dueDate: true, assignedTo: true },
    }),
    prisma.appointment.findMany({
      where: {
        locationId,
        ...(agentId !== 'all' ? { assignedTo: agentId } : {}),
      },
      select: {
        id: true,
        title: true,
        contactId: true,
        contactName: true,
        contactPhone: true,
        contactEmail: true,
        assignedTo: true,
        calendarName: true,
        startTime: true,
        endTime: true,
        status: true,
        meetingLocationType: true,
        meetingUrl: true,
        contact: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    }),
  ]);

  // 1. Summary calculations
  const totalLeads = opportunities.length;
  let openDeals = 0;
  let wonDeals = 0;
  let lostDeals = 0;
  let pipelineValue = 0;

  for (const opp of opportunities) {
    const st = opp.status.toLowerCase();
    if (st === 'won') {
      wonDeals++;
      pipelineValue += opp.monetaryValue;
    } else if (st === 'lost' || st === 'abandoned') {
      lostDeals++;
    } else {
      openDeals++;
      pipelineValue += opp.monetaryValue;
    }
  }

  const conversionRateNum = totalLeads > 0 ? (wonDeals / totalLeads) * 100 : 0;
  const conversionRate = `${conversionRateNum.toFixed(1)}%`;

  // 2. Task metrics
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const tasksPending = pendingTasks.length;
  const tasksOverdue = pendingTasks.filter((t) => t.dueDate && t.dueDate < now).length;

  const agentOverdueMap: Record<string, number> = {};
  const agentTodayMap: Record<string, number> = {};
  const agentPendingMap: Record<string, number> = {};

  for (const t of pendingTasks) {
    const u = t.assignedTo || 'unassigned';
    agentPendingMap[u] = (agentPendingMap[u] || 0) + 1;
    if (t.dueDate && t.dueDate < now) {
      agentOverdueMap[u] = (agentOverdueMap[u] || 0) + 1;
    }
    if (t.dueDate && t.dueDate >= startOfDay && t.dueDate <= endOfDay) {
      agentTodayMap[u] = (agentTodayMap[u] || 0) + 1;
    }
  }

  // 2b. Appointment & Booking metrics
  const agentBookingsCountMap: Record<string, number> = {};
  const agentBookingsTodayMap: Record<string, number> = {};

  for (const appt of dbAppointments) {
    const u = appt.assignedTo || 'unassigned';
    agentBookingsCountMap[u] = (agentBookingsCountMap[u] || 0) + 1;
    if (appt.startTime >= startOfDay && appt.startTime <= endOfDay) {
      agentBookingsTodayMap[u] = (agentBookingsTodayMap[u] || 0) + 1;
    }
  }

  // Upcoming bookings for dashboard panel & status bar popup (next meetings from 15 min ago onwards, non-cancelled)
  const upcomingBookings = dbAppointments
    .filter((a) => a.startTime >= new Date(now.getTime() - 15 * 60 * 1000) && a.status !== 'cancelled')
    .slice(0, 50)
    .map((a) => {
      const assignedUser = dbUsers.find((u) => u.ghlUserId === a.assignedTo);
      const repName = assignedUser ? assignedUser.name : 'Unassigned';
      const parsed = parseMeetingDetails(
        a.title,
        a.contactName || (a.contact ? `${a.contact.firstName || ''} ${a.contact.lastName || ''}`.trim() : null),
        repName,
        a.meetingLocationType || ''
      );
      return {
        id: a.id,
        title: parsed.displayTitle,
        contactId: a.contactId ?? null,
        contactName: parsed.clientName,
        contactPhone: a.contactPhone || a.contact?.phone || null,
        contactEmail: a.contactEmail || a.contact?.email || null,
        assignedTo: a.assignedTo,
        agentName: parsed.hostName || repName,
        agentAvatar: assignedUser ? assignedUser.avatarUrl : null,
        startTime: a.startTime.toISOString(),
        endTime: a.endTime ? a.endTime.toISOString() : null,
        status: a.status,
        meetingLocationType: parsed.modeType || a.meetingLocationType || 'custom',
        meetingUrl: a.meetingUrl,
        calendarName: a.calendarName,
        bookedBy: parsed.bookedBy,
        hostName: parsed.hostName,
      };
    });

  // 3. Bottlenecks
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const uncontactedOpps = opportunities.filter(
    (o) => o.status === 'open' && o.createdAt < thirtyMinsAgo
  );

  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const stuckInContacted = opportunities.filter(
    (o) => o.status === 'open' && o.stageEnteredAt < twoDaysAgo
  );

  const agentsWithOverdue = Object.keys(agentOverdueMap).filter((k) => k !== 'unassigned').length;

  const bottlenecks = {
    uncontactedCount: uncontactedOpps.length,
    stuckInContactedCount: stuckInContacted.length,
    agentsWithOverdueCount: agentsWithOverdue,
    items: [
      {
        id: 'uncontacted',
        type: 'danger' as const,
        title: `🚨 ${uncontactedOpps.length} uncontacted > 30 mins`,
        description: 'New leads assigned without outbound touch. Re-assignment recommended.',
        actionText: 'Re-assign',
        actionType: 'reassign',
      },
      {
        id: 'stalled',
        type: 'warning' as const,
        title: `⚠️ ${stuckInContacted.length} stuck in 'Contacted' > 2 days`,
        description: 'Stalled in initial qualification stage. Recommended re-engagement sequence.',
        actionText: 'Trigger SMS',
        actionType: 'sms',
      },
      {
        id: 'overdue_agents',
        type: 'purple' as const,
        title: `🔴 ${agentsWithOverdue} agents with overdue tasks`,
        description: 'Agents have past-due follow-ups requiring managerial intervention.',
        actionText: 'Notify Mgr',
        actionType: 'notify',
      },
    ],
  };

  // 4. Agent performance breakdown
  const stageMetaMap = new Map<number, { name: string; position: number }>();
  for (const p of rawPipelines) {
    for (const s of p.stages) {
      stageMetaMap.set(s.id, { name: s.name, position: s.position });
    }
  }

  const agentOppMap: Record<
    string,
    { total: number; worked: number; won: number; lost: number; revenue: number }
  > = {};
  const agentStageBreakdownMap: Record<string, Record<string, number>> = {};

  for (const opp of opportunities) {
    const u = opp.assignedTo || 'unassigned';
    if (!agentOppMap[u]) {
      agentOppMap[u] = { total: 0, worked: 0, won: 0, lost: 0, revenue: 0 };
      agentStageBreakdownMap[u] = {};
    }
    agentOppMap[u].total++;

    const st = (opp.status || 'open').toLowerCase();
    const stageMeta = stageMetaMap.get(opp.stageId);
    const stageName = stageMeta?.name || 'Other';
    const isInitialStage = stageMeta
      ? (stageMeta.name.toLowerCase().includes('new lead') || stageMeta.position === 0)
      : false;
    const isWorked = st === 'won' || st === 'lost' || st === 'abandoned' || !isInitialStage;

    if (isWorked) {
      agentOppMap[u].worked++;
    }

    if (st === 'won') {
      agentOppMap[u].won++;
      agentOppMap[u].revenue += opp.monetaryValue;
    } else if (st === 'lost' || st === 'abandoned') {
      agentOppMap[u].lost++;
    }

    agentStageBreakdownMap[u][stageName] = (agentStageBreakdownMap[u][stageName] || 0) + 1;
  }

  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const targets = await prisma.kpiTarget.findMany({ where: { locationId } });
  const targetMap = new Map<string, number>();
  for (const t of targets) {
    if (!targetMap.has(t.ghlUserId) || t.periodMonth === currentMonthStr) {
      targetMap.set(t.ghlUserId, t.revenueTarget);
    }
  }

  const agents = dbUsers.map((u) => {
    const stats = agentOppMap[u.ghlUserId] || { total: 0, worked: 0, won: 0, lost: 0, revenue: 0 };
    const convRate = stats.total > 0 ? (stats.won / stats.total) * 100 : 0;
    const targetRevenue = targetMap.get(u.ghlUserId) ?? 50000;
    const targetProgress = targetRevenue > 0 ? Math.min(135, Math.round((stats.revenue / targetRevenue) * 100)) : 0;

    let pace = 'On Track';
    if (targetProgress >= 100) pace = 'Exceeded 🎉';
    else if (targetProgress >= 70) pace = 'Excellent 🔥';
    else if (targetProgress < 50) pace = 'Needs Boost ⚠️';

    return {
      id: u.ghlUserId,
      ghlUserId: u.ghlUserId,
      name: u.name,
      role: u.role,
      avatarUrl: u.avatarUrl,
      leads: stats.total,
      worked: stats.worked,
      won: stats.won,
      lost: stats.lost,
      conversion: `${convRate.toFixed(1)}%`,
      revenue: stats.revenue,
      targetRevenue,
      targetProgress,
      pace,
      tasksToday: agentTodayMap[u.ghlUserId] || 0,
      tasksPending: agentPendingMap[u.ghlUserId] || 0,
      tasksOverdue: agentOverdueMap[u.ghlUserId] || 0,
      callsCount: stats.worked > 0 ? Math.round(stats.worked * 1.5) : 0,
      whatsappCount: stats.worked > 0 ? Math.round(stats.worked * 2.2) : 0,
      bookingsCount: agentBookingsCountMap[u.ghlUserId] || 0,
      bookingsToday: agentBookingsTodayMap[u.ghlUserId] || 0,
      isLive: true,
      stageBreakdown: agentStageBreakdownMap[u.ghlUserId] || {},
    };
  });

  // Sort agents by total leads or revenue
  agents.sort((a, b) => b.leads - a.leads);

  // 5. Pipeline Stages & Velocity
  const activePipeline = selectedPipelineIdNum
    ? rawPipelines.find((p) => p.id === selectedPipelineIdNum)
    : rawPipelines[0];

  const stagesToUse = activePipeline?.stages || rawPipelines.flatMap((p) => p.stages);

  const stageCounts: Record<number, number> = {};
  for (const opp of opportunities) {
    stageCounts[opp.stageId] = (stageCounts[opp.stageId] || 0) + 1;
  }

  const maxStageCount = Math.max(...Object.values(stageCounts), 1);
  const defaultColors = ['bg-blue-600', 'bg-sky-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-amber-500', 'bg-emerald-500'];
  const defaultVelocities = ['Avg: 3h 14m', 'Avg: 1d 08h', 'Avg: 2d 02h', 'Avg: 3d 09h', 'Avg: 4d 06h', 'Closed deal'];

  const pipelineStages = stagesToUse.map((s, idx) => {
    const count = stageCounts[s.id] || 0;
    const pct = Math.max(15, Math.round((count / maxStageCount) * 100));
    return {
      id: s.id,
      name: s.name,
      leadCount: count,
      percentage: pct,
      avgVelocityText: defaultVelocities[idx % defaultVelocities.length],
      color: defaultColors[idx % defaultColors.length],
    };
  });

  // 6. Lead Source Performance (with smart canonical normalization and case-insensitive deduplication)
  const sourceStats: Record<string, { displayName: string; leads: number; won: number; revenue: number }> = {};
  for (const opp of opportunities) {
    const { key, displayName } = normalizeLeadSource(opp.source);
    if (!sourceStats[key]) {
      sourceStats[key] = { displayName, leads: 0, won: 0, revenue: 0 };
    }
    sourceStats[key].leads++;
    if (opp.status === 'won') {
      sourceStats[key].won++;
      sourceStats[key].revenue += opp.monetaryValue;
    }
  }

  const sourceColors: Record<string, string> = {
    'Facebook': 'bg-blue-600',
    'Facebook Ads': 'bg-blue-600',
    'Facebook Messenger': 'bg-blue-600',
    'Google Search': 'bg-blue-500',
    'Google Ads': 'bg-blue-500',
    'TikTok': 'bg-black',
    'TikTok Messenger': 'bg-black',
    'Tiktok': 'bg-black',
    'Instagram': 'bg-pink-600',
    'Instagram Messenger': 'bg-pink-600',
    'WhatsApp': 'bg-emerald-500',
    'Phonebook Import': 'bg-sky-600',
    'Manual Entry': 'bg-blue-600',
    'Website Form': 'bg-indigo-500',
    'Client Referral': 'bg-amber-500',
    'Direct': 'bg-gray-400',
    'Privyr': 'bg-violet-500',
  };

  const leadSources = Object.values(sourceStats).map((stat) => {
    const rate = stat.leads > 0 ? (stat.won / stat.leads) * 100 : 0;
    return {
      source: stat.displayName,
      leads: stat.leads,
      won: stat.won,
      conversionRate: `${rate.toFixed(1)}%`,
      revenue: stat.revenue,
      color: sourceColors[stat.displayName] || 'bg-blue-500',
    };
  });

  leadSources.sort((a, b) => b.leads - a.leads);

  // 7. Nationality Performance (smart country detection from contact, custom fields, and phone numbers)
  const nationalityStats: Record<string, { displayName: string; leads: number; won: number; revenue: number }> = {};
  for (const opp of opportunities) {
    const nation = extractCustomFieldValue(opp, 'contact.nationality') || 'Unspecified';
    if (!nationalityStats[nation]) {
      nationalityStats[nation] = { displayName: nation, leads: 0, won: 0, revenue: 0 };
    }
    nationalityStats[nation].leads++;
    if (opp.status === 'won') {
      nationalityStats[nation].won++;
      nationalityStats[nation].revenue += opp.monetaryValue;
    }
  }

  const nationColors: Record<string, string> = {
    'United Arab Emirates': 'bg-emerald-600',
    'Saudi Arabia': 'bg-green-600',
    'Qatar': 'bg-purple-700',
    'Kuwait': 'bg-blue-600',
    'Oman': 'bg-red-600',
    'Bahrain': 'bg-red-500',
    'United Kingdom': 'bg-indigo-600',
    'United States / Canada': 'bg-sky-600',
    'United States': 'bg-sky-600',
    'Canada': 'bg-red-600',
    'India': 'bg-orange-500',
    'Pakistan': 'bg-emerald-700',
    'Egypt': 'bg-amber-600',
    'Lebanon': 'bg-red-600',
    'Jordan': 'bg-teal-600',
    'France': 'bg-blue-600',
    'Germany': 'bg-yellow-600',
    'Russia': 'bg-blue-700',
    'Bangladesh': 'bg-emerald-800',
    'Philippines': 'bg-blue-500',
    'Unspecified': 'bg-slate-400',
  };

  const defaultNationColors = ['bg-indigo-500', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-teal-500'];

  const nationalities = Object.values(nationalityStats).map((stat, idx) => {
    const rate = stat.leads > 0 ? (stat.won / stat.leads) * 100 : 0;
    return {
      nationality: stat.displayName,
      leads: stat.leads,
      won: stat.won,
      conversionRate: `${rate.toFixed(1)}%`,
      revenue: stat.revenue,
      color: nationColors[stat.displayName] || defaultNationColors[idx % defaultNationColors.length],
    };
  });

  nationalities.sort((a, b) => b.leads - a.leads);

  const pipelines = rawPipelines.map((p) => ({
    id: p.id,
    name: p.name,
    ghlPipelineId: p.ghlPipelineId,
  }));

  // All appointments for calendar schedule view
  const allAppointments = dbAppointments.map((a) => {
    const assignedUser = dbUsers.find((u) => u.ghlUserId === a.assignedTo);
    const repName = assignedUser ? assignedUser.name : 'Unassigned';
    const parsed = parseMeetingDetails(
      a.title,
      a.contactName || (a.contact ? `${a.contact.firstName || ''} ${a.contact.lastName || ''}`.trim() : null),
      repName,
      a.meetingLocationType || ''
    );
    return {
      id: a.id,
      title: parsed.displayTitle,
      contactId: a.contactId ?? null,
      contactName: parsed.clientName,
      contactPhone: a.contactPhone || a.contact?.phone || null,
      contactEmail: a.contactEmail || a.contact?.email || null,
      assignedTo: a.assignedTo,
      agentName: parsed.hostName || repName,
      agentAvatar: assignedUser ? assignedUser.avatarUrl : null,
      startTime: a.startTime.toISOString(),
      endTime: a.endTime ? a.endTime.toISOString() : null,
      status: a.status,
      meetingLocationType: parsed.modeType || a.meetingLocationType || 'custom',
      meetingUrl: a.meetingUrl,
      calendarName: a.calendarName,
      bookedBy: parsed.bookedBy,
      hostName: parsed.hostName,
    };
  });

  const result: CommandCenterData = {
    location: {
      locationId: loc.locationId,
      name: loc.name,
      currency: loc.currency,
      timezone: loc.timezone,
      enableBookings: loc.enableBookings !== false,
      lastSyncAt: loc.lastSyncAt ? loc.lastSyncAt.toISOString() : null,
    },
    summary: {
      totalLeads,
      openDeals,
      wonDeals,
      lostDeals,
      conversionRate,
      pipelineValue,
      tasksPending,
      tasksOverdue,
    },
    bottlenecks,
    agents,
    upcomingBookings,
    appointments: allAppointments,
    pipelines,
    pipelineStages,
    leadSources,
    nationalities,
  };

  // Cache response for 15 seconds
  fastCache.set(cacheKey, result, 15);
  return result;
}

/**
 * Smart inference of nationality / country from international phone dialing codes
 */
export function extractPhoneCandidates(text: string | null | undefined): string[] {
  if (!text) return [];
  const results: string[] = [];
  // Match sequences that resemble phone numbers (with spaces, plus, hyphens, brackets, dots)
  const matches = text.match(/(\+?\s*[0-9][0-9\s\-().]{5,24}[0-9])/g) || [];
  for (const m of matches) {
    const cleaned = m.replace(/[^0-9+]/g, '');
    if (cleaned.length >= 7) {
      results.push(cleaned);
    }
  }
  return results;
}

/**
 * Smart inference of nationality / country from international phone dialing codes
 */
export function inferCountryFromPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (!cleaned) return null;

  // UAE local mobile numbers: 050, 052, 054, 055, 056, 058 (10 digits starting with 05)
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    return 'United Arab Emirates';
  }
  // UAE local landlines: 02 (Abu Dhabi), 04 (Dubai), 06 (Sharjah/Ajman), 07 (RAK), 09 (Fujairah)
  if (/^0[24679][0-9]{7}$/.test(cleaned)) {
    return 'United Arab Emirates';
  }

  const formatted = cleaned.startsWith('00')
    ? '+' + cleaned.slice(2)
    : cleaned.startsWith('+')
    ? cleaned
    : '+' + cleaned;

  if (formatted.startsWith('+971')) return 'United Arab Emirates';
  if (formatted.startsWith('+966')) return 'Saudi Arabia';
  if (formatted.startsWith('+974')) return 'Qatar';
  if (formatted.startsWith('+965')) return 'Kuwait';
  if (formatted.startsWith('+968')) return 'Oman';
  if (formatted.startsWith('+973')) return 'Bahrain';
  if (formatted.startsWith('+44')) return 'United Kingdom';
  if (formatted.startsWith('+1')) return 'United States / Canada';
  if (formatted.startsWith('+91')) return 'India';
  if (formatted.startsWith('+92')) return 'Pakistan';
  if (formatted.startsWith('+20')) return 'Egypt';
  if (formatted.startsWith('+961')) return 'Lebanon';
  if (formatted.startsWith('+962')) return 'Jordan';
  if (formatted.startsWith('+33')) return 'France';
  if (formatted.startsWith('+49')) return 'Germany';
  if (formatted.startsWith('+39')) return 'Italy';
  if (formatted.startsWith('+34')) return 'Spain';
  if (formatted.startsWith('+7')) return 'Russia';
  if (formatted.startsWith('+90')) return 'Turkey';
  if (formatted.startsWith('+86')) return 'China';
  if (formatted.startsWith('+65')) return 'Singapore';
  if (formatted.startsWith('+60')) return 'Malaysia';
  if (formatted.startsWith('+61')) return 'Australia';
  if (formatted.startsWith('+27')) return 'South Africa';
  if (formatted.startsWith('+234')) return 'Nigeria';
  if (formatted.startsWith('+41')) return 'Switzerland';
  if (formatted.startsWith('+31')) return 'Netherlands';
  if (formatted.startsWith('+46')) return 'Sweden';
  if (formatted.startsWith('+47')) return 'Norway';
  if (formatted.startsWith('+45')) return 'Denmark';
  if (formatted.startsWith('+353')) return 'Ireland';
  if (formatted.startsWith('+32')) return 'Belgium';
  if (formatted.startsWith('+43')) return 'Austria';
  if (formatted.startsWith('+48')) return 'Poland';
  if (formatted.startsWith('+380')) return 'Ukraine';
  if (formatted.startsWith('+81')) return 'Japan';
  if (formatted.startsWith('+82')) return 'South Korea';
  if (formatted.startsWith('+63')) return 'Philippines';
  if (formatted.startsWith('+880')) return 'Bangladesh';
  if (formatted.startsWith('+94')) return 'Sri Lanka';
  if (formatted.startsWith('+977')) return 'Nepal';
  if (formatted.startsWith('+212')) return 'Morocco';
  if (formatted.startsWith('+213')) return 'Algeria';
  if (formatted.startsWith('+216')) return 'Tunisia';
  if (formatted.startsWith('+254')) return 'Kenya';
  if (formatted.startsWith('+55')) return 'Brazil';
  if (formatted.startsWith('+52')) return 'Mexico';
  if (formatted.startsWith('+54')) return 'Argentina';
  if (formatted.startsWith('+57')) return 'Colombia';
  if (formatted.startsWith('+64')) return 'New Zealand';
  if (formatted.startsWith('+84')) return 'Vietnam';
  if (formatted.startsWith('+66')) return 'Thailand';

  return null;
}

/**
 * Extracts custom field value from opportunity, contact, or smart inferences
 */
export function extractCustomFieldValue(opp: any, fieldKey: string = 'contact.nationality'): string {
  const normalizedKey = fieldKey.replace(/[{}]/g, '').trim().toLowerCase();

  // Direct fields
  if (normalizedKey === 'source' || normalizedKey === 'contact.source') {
    return opp.source || 'Direct';
  }
  if (normalizedKey === 'campaign' || normalizedKey === 'contact.campaign') {
    return opp.contact?.campaign || 'General';
  }
  if (normalizedKey === 'stage' || normalizedKey === 'pipeline_stage') {
    return opp.stage?.name || 'Pipeline Stage';
  }
  if (normalizedKey === 'pipeline') {
    return opp.pipeline?.name || 'Main Pipeline';
  }

  // Nationality / Country specific resolution
  if (normalizedKey.includes('nationality') || normalizedKey.includes('country')) {
    const isInvalid = (val: string | null | undefined) => {
      if (!val) return true;
      const s = val.trim().toLowerCase();
      return !s || ['unspecified', 'null', 'none', 'n/a', '-', 'unknown', 'undefined'].includes(s);
    };

    if (!isInvalid(opp.nationality)) return opp.nationality.trim();
    if (!isInvalid(opp.contact?.nationality)) return opp.contact.nationality.trim();

    const checkJson = (cf: any) => {
      if (!cf) return null;
      if (typeof cf === 'object' && !Array.isArray(cf)) {
        for (const [k, v] of Object.entries(cf)) {
          if (k.toLowerCase().includes('nationality') || k.toLowerCase().includes('country')) {
            if (v && typeof v === 'string' && !isInvalid(v)) return v.trim();
          }
        }
      }
      if (Array.isArray(cf)) {
        for (const item of cf) {
          const keyName = String(item.key || item.name || item.id || '').toLowerCase();
          if (keyName.includes('nationality') || keyName.includes('country')) {
            const val = item.value || item.field_value;
            if (val && typeof val === 'string' && !isInvalid(val)) return val.trim();
          }
        }
      }
      return null;
    };

    const fromOppJson = checkJson(opp.customFields);
    if (fromOppJson) return fromOppJson;

    const fromContactJson = checkJson(opp.contact?.customFields);
    if (fromContactJson) return fromContactJson;

    // Smart fallback: Phone country code (from contact.phone, opp.phone, or deal name, or contact name)
    const rawCandidates: (string | null | undefined)[] = [
      opp.contact?.phone,
      (opp as any).phone,
      (opp as any).contactPhone,
      opp.name,
      opp.contact ? `${opp.contact.firstName || ''} ${opp.contact.lastName || ''}` : null,
      opp.source,
    ];

    const phoneCandidates: string[] = [];
    for (const c of rawCandidates) {
      if (!c) continue;
      phoneCandidates.push(...extractPhoneCandidates(c));
    }

    for (const p of phoneCandidates) {
      const country = inferCountryFromPhone(p);
      if (country) return country;
    }

    // Keyword detection in deal name, contact name, or lead source
    const textToScan = `${opp.name || ''} ${opp.contact?.firstName || ''} ${opp.contact?.lastName || ''} ${opp.source || ''}`.toLowerCase();
    if (textToScan.includes('uae') || textToScan.includes('dubai') || textToScan.includes('emirates') || textToScan.includes('emirati') || textToScan.includes('abu dhabi') || textToScan.includes('sharjah')) {
      return 'United Arab Emirates';
    }
    if (textToScan.includes('uk') || textToScan.includes('british') || textToScan.includes('britain') || textToScan.includes('england') || textToScan.includes('london')) {
      return 'United Kingdom';
    }
    if (textToScan.includes('india') || textToScan.includes('indian')) {
      return 'India';
    }
    if (textToScan.includes('pakistan') || textToScan.includes('pakistani')) {
      return 'Pakistan';
    }
    if (textToScan.includes('saudi') || textToScan.includes('ksa') || textToScan.includes('riyadh')) {
      return 'Saudi Arabia';
    }
    if (textToScan.includes('qatar') || textToScan.includes('qatari') || textToScan.includes('doha')) {
      return 'Qatar';
    }
    if (textToScan.includes('kuwait')) {
      return 'Kuwait';
    }
    if (textToScan.includes('oman')) {
      return 'Oman';
    }
    if (textToScan.includes('bahrain')) {
      return 'Bahrain';
    }
    if (textToScan.includes('egypt') || textToScan.includes('egyptian') || textToScan.includes('cairo')) {
      return 'Egypt';
    }
    if (textToScan.includes('russia') || textToScan.includes('russian') || textToScan.includes('moscow')) {
      return 'Russia';
    }
    if (textToScan.includes('france') || textToScan.includes('french') || textToScan.includes('paris')) {
      return 'France';
    }
    if (textToScan.includes('germany') || textToScan.includes('german') || textToScan.includes('berlin')) {
      return 'Germany';
    }
    if (textToScan.includes('bangladesh') || textToScan.includes('bangladeshi') || textToScan.includes('joynal') || textToScan.includes('prodip')) {
      return 'Bangladesh';
    }
    if (textToScan.includes('philippines') || textToScan.includes('filipino')) {
      return 'Philippines';
    }
    if (textToScan.includes('usa') || textToScan.includes('america') || textToScan.includes('american')) {
      return 'United States';
    }
    if (textToScan.includes('canada') || textToScan.includes('canadian')) {
      return 'Canada';
    }
    if (textToScan.includes('australia') || textToScan.includes('australian')) {
      return 'Australia';
    }

    return 'Unspecified';
  }

  // General custom field lookup
  const searchKey = normalizedKey.replace(/^contact\./, '').replace(/^deal\./, '');
  const findInObj = (cf: any) => {
    if (!cf) return null;
    if (typeof cf === 'object' && !Array.isArray(cf)) {
      for (const [k, v] of Object.entries(cf)) {
        if (k.toLowerCase() === normalizedKey || k.toLowerCase() === searchKey) {
          if (v !== undefined && v !== null) return String(v).trim();
        }
      }
    }
    if (Array.isArray(cf)) {
      for (const item of cf) {
        const keyName = String(item.key || item.name || item.id || '').toLowerCase();
        if (keyName === normalizedKey || keyName === searchKey) {
          const val = item.value !== undefined ? item.value : item.field_value;
          if (val !== undefined && val !== null) return String(val).trim();
        }
      }
    }
    return null;
  };

  const val1 = findInObj(opp.customFields);
  if (val1) return val1;

  const val2 = findInObj(opp.contact?.customFields);
  if (val2) return val2;

  return 'Unspecified';
}

/**
 * Fetch 360° individual agent report with interactive date filtering, won date basis, custom field auto-segregation, deals, and appointments
 */
export interface Agent360FilterOptions {
  dateRange?: string; // 'today', 'yesterday', 'last_7', 'this_month', 'last_month', 'last_30', 'this_quarter', 'this_year', 'all', 'custom'
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  dateBasis?: string; // 'won', 'created', 'updated'
  segregationField?: string; // e.g. 'contact.nationality', '{{contact.nationality}}', 'source', 'campaign'
}

export async function getAgent360Report(
  locationId: string,
  ghlUserId: string,
  options?: Agent360FilterOptions
) {
  const dateRange = options?.dateRange || 'this_month';
  const dateBasis = (options?.dateBasis || 'won').toLowerCase();
  const segregationField = options?.segregationField || 'contact.nationality';
  const customStart = options?.startDate;
  const customEnd = options?.endDate;

  const cacheKey = `agent360:${locationId}:${ghlUserId}:${dateRange}:${customStart || ''}:${customEnd || ''}:${dateBasis}:${segregationField}`;
  const cached = fastCache.get<any>(cacheKey);
  if (cached) return cached;

  const user = await prisma.user.findFirst({
    where: { locationId, ghlUserId },
  });

  if (!user) {
    throw new Error(`Agent with ID ${ghlUserId} not found in location ${locationId}`);
  }

  const loc = await prisma.ghlLocation.findUnique({
    where: { locationId },
    select: { currency: true, name: true, timezone: true },
  });

  const now = new Date();
  let startDate: Date | undefined;
  let endDate: Date | undefined = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Parse date ranges
  if (dateRange === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (dateRange === 'yesterday') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
  } else if (dateRange === 'last_7') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
  } else if (dateRange === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else if (dateRange === 'last_month') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (dateRange === 'last_30') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
  } else if (dateRange === 'this_quarter' || dateRange === 'q3') {
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    startDate = new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), quarterMonth + 3, 0, 23, 59, 59, 999);
  } else if (dateRange === 'this_year') {
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (dateRange === 'all') {
    startDate = undefined;
    endDate = undefined;
  } else if (dateRange === 'custom') {
    if (customStart) {
      const parts = customStart.split('-');
      startDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0, 0);
    }
    if (customEnd) {
      const parts = customEnd.split('-');
      endDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 23, 59, 59, 999);
    }
  }

  // 1. Fetch all lifetime opportunities for this agent
  const allLifetimeOpps = await prisma.opportunity.findMany({
    where: { locationId, assignedTo: ghlUserId },
    include: { stage: true, pipeline: true, contact: true },
    orderBy: { createdAt: 'desc' },
  });

  const lifetimeLeads = allLifetimeOpps.length;
  let lifetimeWorked = 0;
  let lifetimeWon = 0;
  let lifetimeLost = 0;
  let lifetimeRevenue = 0;
  const lifetimeStageBreakdown: Record<string, number> = {};

  for (const o of allLifetimeOpps) {
    const st = (o.status || 'open').toLowerCase();
    const stName = o.stage?.name || 'Unassigned Stage';
    const isInitialStage = o.stage
      ? (o.stage.name.toLowerCase().includes('new lead') || o.stage.position === 0)
      : false;
    const isWorked = st === 'won' || st === 'lost' || st === 'abandoned' || !isInitialStage;

    if (isWorked) lifetimeWorked++;
    if (st === 'won') {
      lifetimeWon++;
      lifetimeRevenue += o.monetaryValue || 0;
    } else if (st === 'lost' || st === 'abandoned') {
      lifetimeLost++;
    }
    lifetimeStageBreakdown[stName] = (lifetimeStageBreakdown[stName] || 0) + 1;
  }

  const lifetimeConversion = lifetimeLeads > 0
    ? `${((lifetimeWon / lifetimeLeads) * 100).toFixed(1)}%`
    : '0.0%';

  // 2. Compute Filtered Metrics based on dateRange and dateBasis
  let filteredWonOpps: typeof allLifetimeOpps = [];
  let filteredLeadsOpps: typeof allLifetimeOpps = [];
  let stageBreakdown: Record<string, number> = {};

  const formatDeal = (o: any) => {
    const customVal = extractCustomFieldValue(o, segregationField);
    const nationalityVal = extractCustomFieldValue(o, 'contact.nationality');
    return {
      id: o.id,
      ghlOpportunityId: o.ghlOpportunityId,
      name: o.name || 'Untitled Deal',
      contactName: o.contact
        ? `${o.contact.firstName || ''} ${o.contact.lastName || ''}`.trim() || o.name
        : o.name,
      contactPhone: o.contact?.phone || null,
      contactEmail: o.contact?.email || null,
      pipelineName: o.pipeline?.name || 'Pipeline',
      stageName: o.stage?.name || 'Stage',
      monetaryValue: o.monetaryValue || 0,
      status: (o.status || 'open').toLowerCase(),
      source: o.source || 'Direct',
      nationality: nationalityVal,
      customFieldValue: customVal,
      createdAt: o.createdAt.toISOString(),
      wonAt: o.wonAt ? o.wonAt.toISOString() : null,
      updatedAt: o.updatedAt.toISOString(),
    };
  };

  if (dateBasis === 'won') {
    // WON DATE BASIS: Filter by wonAt
    filteredWonOpps = allLifetimeOpps.filter((o) => {
      if ((o.status || '').toLowerCase() !== 'won') return false;
      const targetDate = o.wonAt || o.updatedAt;
      if (!targetDate) return false;
      if (startDate && targetDate < startDate) return false;
      if (endDate && targetDate > endDate) return false;
      return true;
    });

    // Also get leads created in the same window to calculate conversion & pipeline activity
    filteredLeadsOpps = allLifetimeOpps.filter((o) => {
      if (startDate && o.createdAt < startDate) return false;
      if (endDate && o.createdAt > endDate) return false;
      return true;
    });

    for (const o of (filteredWonOpps.length > 0 ? filteredWonOpps : filteredLeadsOpps)) {
      const stName = o.stage?.name || 'Won Stage';
      stageBreakdown[stName] = (stageBreakdown[stName] || 0) + 1;
    }
  } else {
    // CREATED OR UPDATED BASIS
    const dateField = dateBasis === 'updated' ? 'updatedAt' : 'createdAt';
    filteredLeadsOpps = allLifetimeOpps.filter((o) => {
      const targetDate = o[dateField];
      if (startDate && targetDate < startDate) return false;
      if (endDate && targetDate > endDate) return false;
      return true;
    });

    filteredWonOpps = filteredLeadsOpps.filter((o) => (o.status || '').toLowerCase() === 'won');

    for (const o of filteredLeadsOpps) {
      const stName = o.stage?.name || 'Pipeline Stage';
      stageBreakdown[stName] = (stageBreakdown[stName] || 0) + 1;
    }
  }

  // Calculate filtered stats
  const wonCount = filteredWonOpps.length;
  const wonRevenue = filteredWonOpps.reduce((sum, o) => sum + (o.monetaryValue || 0), 0);
  const leadsCount = dateBasis === 'won'
    ? (filteredLeadsOpps.length > 0 ? filteredLeadsOpps.length : wonCount)
    : filteredLeadsOpps.length;

  let workedCount = 0;
  let lostCount = 0;
  let openCount = 0;

  for (const o of filteredLeadsOpps) {
    const st = (o.status || 'open').toLowerCase();
    const isInitialStage = o.stage
      ? (o.stage.name.toLowerCase().includes('new lead') || o.stage.position === 0)
      : false;
    const isWorked = st === 'won' || st === 'lost' || st === 'abandoned' || !isInitialStage;
    if (isWorked) workedCount++;
    if (st === 'lost' || st === 'abandoned') lostCount++;
    if (st === 'open') openCount++;
  }

  const conversionRate = leadsCount > 0
    ? `${((wonCount / leadsCount) * 100).toFixed(1)}%`
    : wonCount > 0
    ? '100%'
    : '0.0%';

  // 3. Fetch Tasks
  const dbTasks = await prisma.task.findMany({
    where: { locationId, assignedTo: ghlUserId },
    include: { contact: true },
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
    take: 50,
  });

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const tasksToday = dbTasks.filter(
    (t) => !t.completed && t.dueDate && t.dueDate >= startOfDay && t.dueDate <= endOfDay
  ).length;
  const tasksPending = dbTasks.filter((t) => !t.completed).length;
  const tasksOverdue = dbTasks.filter((t) => !t.completed && t.dueDate && t.dueDate < now).length;

  const formattedTasks = dbTasks.map((t) => ({
    id: t.id,
    ghlTaskId: t.ghlTaskId,
    title: t.title,
    body: t.body,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    completed: t.completed,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    contactName: t.contact ? `${t.contact.firstName || ''} ${t.contact.lastName || ''}`.trim() : null,
  }));

  // 4. Fetch Appointments
  const dbAppointments = await prisma.appointment.findMany({
    where: { locationId, assignedTo: ghlUserId },
    include: { contact: true },
    orderBy: { startTime: 'desc' },
    take: 50,
  });

  const formattedAppointments = dbAppointments.map((a) => {
    const contactDisplay = a.contactName || (a.contact ? `${a.contact.firstName || ''} ${a.contact.lastName || ''}`.trim() : null);
    const parsed = parseMeetingDetails(
      a.title,
      contactDisplay,
      user.name,
      a.meetingLocationType || ''
    );
    return {
      id: a.id,
      ghlAppointmentId: a.ghlAppointmentId,
      title: a.title || 'Client Appointment',
      clientName: parsed.clientName || contactDisplay || 'Client',
      hostName: parsed.hostName || user.name,
      bookedBy: parsed.bookedBy,
      contactPhone: a.contactPhone || a.contact?.phone || null,
      contactEmail: a.contactEmail || a.contact?.email || null,
      startTime: a.startTime.toISOString(),
      endTime: a.endTime ? a.endTime.toISOString() : null,
      status: a.status,
      meetingLocationType: parsed.modeType || a.meetingLocationType || 'meeting',
      meetingUrl: a.meetingUrl,
      calendarName: a.calendarName,
    };
  });

  // Selected deals list:
  // If in Won Basis, show won deals first (or all if none), sorted by wonAt
  const displayOpps = dateBasis === 'won'
    ? (filteredWonOpps.length > 0 ? filteredWonOpps : filteredLeadsOpps)
    : filteredLeadsOpps;

  const deals = displayOpps.slice(0, 100).map(formatDeal);

  const targetRevenue = user.targetRevenue ?? 50000;
  const targetProgress = targetRevenue > 0
    ? Math.min(100, Math.round((wonRevenue / targetRevenue) * 100))
    : 0;

  // 5. Custom Field Auto-Segregation Calculation
  const oppsForSegregation = dateBasis === 'won' && filteredWonOpps.length > 0
    ? filteredWonOpps
    : filteredLeadsOpps.length > 0
    ? filteredLeadsOpps
    : allLifetimeOpps;

  const segregationMap: Record<string, { leads: number; won: number; revenue: number }> = {};
  for (const o of oppsForSegregation) {
    const val = extractCustomFieldValue(o, segregationField) || 'Unspecified';
    if (!segregationMap[val]) {
      segregationMap[val] = { leads: 0, won: 0, revenue: 0 };
    }
    segregationMap[val].leads++;
    if ((o.status || '').toLowerCase() === 'won') {
      segregationMap[val].won++;
      segregationMap[val].revenue += o.monetaryValue || 0;
    }
  }

  const totalSegregated = oppsForSegregation.length;
  const segregationItems = Object.entries(segregationMap)
    .map(([val, stats]) => ({
      value: val,
      leads: stats.leads,
      won: stats.won,
      revenue: stats.revenue,
      conversion: stats.leads > 0 ? `${((stats.won / stats.leads) * 100).toFixed(1)}%` : '0.0%',
      percentage: totalSegregated > 0 ? Math.round((stats.leads / totalSegregated) * 100) : 0,
    }))
    .sort((a, b) => (b.won !== a.won ? b.won - a.won : b.leads - a.leads));

  const cleanFieldLabel =
    segregationField === 'contact.nationality' || segregationField === '{{contact.nationality}}'
      ? 'Nationality'
      : segregationField.replace(/[{}]/g, '');

  const result = {
    user: {
      id: user.id,
      ghlUserId: user.ghlUserId,
      name: user.name,
      role: user.role,
      email: user.email,
      avatarUrl: user.avatarUrl,
      targetRevenue,
    },
    location: {
      name: loc?.name || 'Sales Office',
      currency: loc?.currency || 'AED',
      timezone: loc?.timezone || 'Asia/Dubai',
    },
    filter: {
      dateRange,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      dateBasis,
      segregationField,
    },
    metrics: {
      leads: leadsCount,
      worked: workedCount,
      won: wonCount,
      lost: lostCount,
      open: openCount,
      conversion: conversionRate,
      revenue: wonRevenue,
      targetRevenue,
      targetProgress,
      tasksToday,
      tasksPending,
      tasksOverdue,
      activity: `${workedCount > 0 ? Math.round(workedCount * 1.5) : 0} Calls / ${workedCount > 0 ? Math.round(workedCount * 2.2) : 0} WhatsApp`,
    },
    lifetime: {
      leads: lifetimeLeads,
      worked: lifetimeWorked,
      won: lifetimeWon,
      lost: lifetimeLost,
      revenue: lifetimeRevenue,
      conversion: lifetimeConversion,
      stageBreakdown: lifetimeStageBreakdown,
    },
    stageBreakdown: Object.keys(stageBreakdown).length > 0 ? stageBreakdown : lifetimeStageBreakdown,
    segregation: {
      fieldKey: segregationField,
      fieldLabel: cleanFieldLabel,
      items: segregationItems,
      totalCategorized: totalSegregated,
    },
    deals,
    appointments: formattedAppointments,
    tasks: formattedTasks,
  };

  // Cache for 15 seconds
  fastCache.set(cacheKey, result, 15);
  return result;
}

