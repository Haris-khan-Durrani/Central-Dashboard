'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  GitMerge,
  Download,
  Calendar,
  Layers,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  Search,
  Users,
  Briefcase,
  ListTodo,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
  Phone,
  Video,
  MapPin,
  CalendarDays,
} from 'lucide-react';
import { AgentData } from '../dashboard/AgentCardsGrid';

interface Agent360ModalProps {
  agent: AgentData | null;
  currency: string;
  locationId?: string;
  shareToken?: string;
  dateRangeLabel?: string;
  showCallStats?: boolean;
  onClose: () => void;
  onToast?: (msg: string) => void;
}

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7', label: 'Last 7 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_30', label: 'Last 30 Days' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Range...' },
];

export default function Agent360Modal({
  agent,
  currency,
  locationId,
  shareToken,
  dateRangeLabel = 'this_month',
  showCallStats = false,
  onClose,
  onToast,
}: Agent360ModalProps) {
  // Normalize initial date range
  const initialRange = useMemo(() => {
    const valid = DATE_RANGE_OPTIONS.some((o) => o.value === dateRangeLabel);
    return valid ? dateRangeLabel : 'this_month';
  }, [dateRangeLabel]);

  const [dateRange, setDateRange] = useState<string>(initialRange);
  const [dateBasis, setDateBasis] = useState<'won' | 'created'>('won');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isApplyingCustom, setIsApplyingCustom] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'meetings' | 'tasks'>('overview');
  const [dealStatusFilter, setDealStatusFilter] = useState<'all' | 'won' | 'open' | 'lost'>('all');
  const [dealSearch, setDealSearch] = useState<string>('');

  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Fetch 360 data whenever agent, dateRange, dateBasis, or custom dates change
  useEffect(() => {
    if (!agent || (!locationId && !shareToken)) return;

    // If custom range is selected but dates aren't filled yet, don't fetch until applied
    if (dateRange === 'custom' && (!customStart || !customEnd)) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const params = new URLSearchParams();
    params.set('date_range', dateRange);
    params.set('date_basis', dateBasis);
    if (dateRange === 'custom') {
      if (customStart) params.set('start_date', customStart);
      if (customEnd) params.set('end_date', customEnd);
    }
    if (locationId) {
      params.set('location_id', locationId);
    }

    const endpoint = shareToken
      ? `/api/shares/${shareToken}/agent/${agent.ghlUserId}?${params.toString()}`
      : `/api/kpi/agent/${agent.ghlUserId}?${params.toString()}`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && json.report) {
          setReportData(json.report);
        }
      })
      .catch((err) => {
        console.error('Error fetching Agent 360 report:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [agent?.ghlUserId, locationId, shareToken, dateRange, dateBasis, isApplyingCustom]);

  if (!agent) return null;

  const initials = agent.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const activeCurrency = reportData?.location?.currency || currency || 'AED';

  const formatCurrency = (val: number) => {
    return `${activeCurrency} ${(val || 0).toLocaleString()}`;
  };

  // Metrics (fallback to agent props if initial fetch is running)
  const metrics = reportData?.metrics || {
    leads: agent.leads || 0,
    worked: agent.worked || 0,
    won: agent.won || 0,
    lost: agent.lost || 0,
    open: (agent.leads || 0) - (agent.won || 0) - (agent.lost || 0),
    conversion: agent.conversion || '0.0%',
    revenue: agent.revenue || 0,
    targetRevenue: agent.targetRevenue || 50000,
    targetProgress: agent.targetProgress || 0,
    tasksToday: agent.tasksToday || 0,
    tasksPending: agent.tasksPending || 0,
    tasksOverdue: agent.tasksOverdue || 0,
    activity: `${agent.callsCount || 0} Calls / ${agent.whatsappCount || 0} WhatsApp`,
  };

  const lifetime = reportData?.lifetime || null;
  const deals: any[] = reportData?.deals || [];
  const appointments: any[] = reportData?.appointments || [];
  const tasks: any[] = reportData?.tasks || [];

  const stageBreakdown = reportData?.stageBreakdown || agent.stageBreakdown || {};
  const stageEntries = Object.entries(stageBreakdown as Record<string, number>).sort(
    ([, a], [, b]) => b - a
  );

  const workedRate =
    metrics.leads > 0 ? Math.round((metrics.worked / metrics.leads) * 100) : 0;

  // Filter deals for Tab 2
  const filteredDeals = deals.filter((d: any) => {
    if (dealStatusFilter !== 'all') {
      const st = (d.status || '').toLowerCase();
      if (dealStatusFilter === 'won' && st !== 'won') return false;
      if (dealStatusFilter === 'open' && st !== 'open') return false;
      if (dealStatusFilter === 'lost' && st !== 'lost' && st !== 'abandoned') return false;
    }
    if (dealSearch.trim()) {
      const q = dealSearch.toLowerCase();
      const matchName = (d.name || '').toLowerCase().includes(q);
      const matchContact = (d.contactName || '').toLowerCase().includes(q);
      const matchStage = (d.stageName || '').toLowerCase().includes(q);
      return matchName || matchContact || matchStage;
    }
    return true;
  });

  // Apply custom range
  const handleApplyCustomRange = () => {
    if (!customStart || !customEnd) {
      if (onToast) onToast('Please specify both Start Date and End Date.');
      return;
    }
    setIsApplyingCustom((prev) => !prev);
  };

  // CSV Export
  const handleExportCsv = () => {
    try {
      const headers = ['Category', 'Field', 'Value'];
      const rangeLabel = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || dateRange;
      const basisLabel = dateBasis === 'won' ? 'Won Date Basis' : 'Created Date Basis';

      const rows: (string | number)[][] = [
        ['Profile', 'Agent Name', agent.name],
        ['Profile', 'Role', agent.role],
        ['Profile', 'Email', reportData?.user?.email || agent.email || 'N/A'],
        ['Filter', 'Date Range', rangeLabel],
        ['Filter', 'Date Basis', basisLabel],
        ['KPIs', 'Won Deals', metrics.won],
        ['KPIs', 'Revenue Generated', `${activeCurrency} ${metrics.revenue}`],
        ['KPIs', 'Leads Received', metrics.leads],
        ['KPIs', 'Leads Worked', metrics.worked],
        ['KPIs', 'Lost / Abandoned', metrics.lost],
        ['KPIs', 'Conversion Rate', metrics.conversion],
        ['KPIs', 'Target Revenue', `${activeCurrency} ${metrics.targetRevenue}`],
        ['KPIs', 'Target Goal Progress', `${metrics.targetProgress}%`],
        ['Tasks', 'Due Today', metrics.tasksToday],
        ['Tasks', 'Pending Follow-ups', metrics.tasksPending],
        ['Tasks', 'Overdue Tasks', metrics.tasksOverdue],
        ['', '', ''],
        ['Pipeline Breakdown', 'Stage Name', 'Deals Count'],
        ...stageEntries.map(([stage, count]) => ['Pipeline Breakdown', stage, count]),
        ['', '', ''],
        ['Deals Audit List', 'Deal Name', 'Client', 'Stage', 'Value', 'Status', 'Won Date', 'Source'],
        ...deals.map((d: any) => [
          'Deal',
          d.name || 'Untitled',
          d.contactName || 'N/A',
          d.stageName || 'N/A',
          `${activeCurrency} ${d.monetaryValue || 0}`,
          d.status || 'open',
          d.wonAt ? d.wonAt.slice(0, 10) : 'N/A',
          d.source || 'Direct',
        ]),
      ];

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `Agent_${agent.name.replace(/[^a-zA-Z0-9]/g, '_')}_360_Report_${dateBasis}_${dateRange}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (onToast) onToast(`Exported ${agent.name}'s 360° audit report to CSV.`);
    } catch (err: any) {
      if (onToast) onToast(`Export failed: ${err.message}`);
    }
  };

  // PDF Report Generator (Triggers clean printable executive PDF)
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const rangeLabel = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || dateRange;
      const basisLabel = dateBasis === 'won' ? 'Won Date Basis' : 'Created Date Basis';
      const generatedAt = new Date().toLocaleString();

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sales Audit & 360 Report - ${agent.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .title-block h1 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: -0.5px;
    }
    .title-block p {
      margin: 0;
      font-size: 11px;
      color: #64748b;
    }
    .badge-bar {
      display: flex;
      gap: 6px;
      margin-top: 6px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-blue { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-green { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }

    .agent-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .agent-meta h2 {
      margin: 0 0 2px 0;
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .agent-meta p {
      margin: 0;
      font-size: 10px;
      color: #64748b;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      background: #ffffff;
    }
    .kpi-label { font-size: 9px; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .kpi-value { font-size: 18px; font-weight: 800; color: #0f172a; margin: 4px 0 2px 0; }
    .kpi-sub { font-size: 9px; font-weight: 600; color: #2563eb; }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #1e3a8a;
      letter-spacing: 0.5px;
      margin: 12px 0 6px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-bottom: 12px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      text-align: left;
      padding: 5px 8px;
      font-weight: 700;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tr:nth-child(even) td { background: #fafafa; }

    .status-won { color: #166534; font-weight: 700; background: #dcfce7; padding: 1px 6px; border-radius: 4px; }
    .status-lost { color: #991b1b; font-weight: 700; background: #fee2e2; padding: 1px 6px; border-radius: 4px; }
    .status-open { color: #1e40af; font-weight: 700; background: #dbeafe; padding: 1px 6px; border-radius: 4px; }

    .footer {
      margin-top: 18px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-block">
      <h1>360° SALES PERFORMANCE AUDIT REPORT</h1>
      <p>GoHighLevel Intelligence Engine · ${reportData?.location?.name || 'Sales Department'}</p>
      <div class="badge-bar">
        <span class="badge badge-blue">SCOPE: ${rangeLabel.toUpperCase()}</span>
        <span class="badge badge-green">BASIS: ${basisLabel.toUpperCase()}</span>
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 10px; font-weight: 700; color: #0f172a;">EXECUTIVE SUMMARY</div>
      <div style="font-size: 9px; color: #64748b;">Generated: ${generatedAt}</div>
    </div>
  </div>

  <div class="agent-card">
    <div class="agent-meta">
      <h2>${agent.name}</h2>
      <p>${agent.role} · ${reportData?.user?.email || agent.email || 'Sales Consultant'}</p>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 600;">Revenue Target</div>
      <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${formatCurrency(metrics.targetRevenue)}</div>
      <div style="font-size: 9px; color: #16a34a; font-weight: 700;">${metrics.targetProgress}% Achieved</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card" style="border-left: 3px solid #16a34a;">
      <div class="kpi-label">Deals Won</div>
      <div class="kpi-value" style="color: #16a34a;">${metrics.won}</div>
      <div class="kpi-sub" style="color: #16a34a;">${formatCurrency(metrics.revenue)} Won</div>
    </div>
    <div class="kpi-card" style="border-left: 3px solid #2563eb;">
      <div class="kpi-label">Leads Handled</div>
      <div class="kpi-value" style="color: #2563eb;">${metrics.leads}</div>
      <div class="kpi-sub">${metrics.worked} Active (${workedRate}%)</div>
    </div>
    <div class="kpi-card" style="border-left: 3px solid #8b5cf6;">
      <div class="kpi-label">Conversion Rate</div>
      <div class="kpi-value" style="color: #8b5cf6;">${metrics.conversion}</div>
      <div class="kpi-sub">Won / Leads</div>
    </div>
    <div class="kpi-card" style="border-left: 3px solid #0891b2;">
      <div class="kpi-label">Tasks Due / Overdue</div>
      <div class="kpi-value">${metrics.tasksToday} / <span style="color: ${metrics.tasksOverdue > 0 ? '#dc2626' : '#16a34a'};">${metrics.tasksOverdue}</span></div>
      <div class="kpi-sub">${metrics.tasksPending} Pending Follow-ups</div>
    </div>
  </div>

  <div class="section-title">Deals & Opportunities Audit (${deals.length} Recorded in Period)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Deal / Opportunity</th>
        <th style="width: 20%;">Client Contact</th>
        <th style="width: 15%;">Stage</th>
        <th style="width: 10%;">Status</th>
        <th style="width: 15%; text-align: right;">Value</th>
        <th style="width: 15%; text-align: right;">${dateBasis === 'won' ? 'Won Date' : 'Created Date'}</th>
      </tr>
    </thead>
    <tbody>
      ${
        deals.length > 0
          ? deals
              .slice(0, 35)
              .map(
                (d: any) => `
        <tr>
          <td><strong>${d.name || 'Untitled Deal'}</strong></td>
          <td>${d.contactName || d.contactPhone || 'Direct Client'}</td>
          <td>${d.stageName || 'Pipeline Stage'}</td>
          <td><span class="status-${(d.status || 'open').toLowerCase()}">${(d.status || 'open').toUpperCase()}</span></td>
          <td style="text-align: right; font-weight: 700;">${formatCurrency(d.monetaryValue || 0)}</td>
          <td style="text-align: right; color: #64748b;">${(d.wonAt || d.createdAt || '').slice(0, 10)}</td>
        </tr>
      `
              )
              .join('')
          : `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 16px;">No deals found for the selected ${basisLabel}.</td></tr>`
      }
    </tbody>
  </table>

  ${
    appointments.length > 0
      ? `
  <div class="section-title">Client Meetings & Appointments (${appointments.length} Recent / Scheduled)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 30%;">Meeting Title</th>
        <th style="width: 25%;">Client</th>
        <th style="width: 15%;">Type</th>
        <th style="width: 15%;">Status</th>
        <th style="width: 15%; text-align: right;">Date & Time</th>
      </tr>
    </thead>
    <tbody>
      ${appointments
        .slice(0, 15)
        .map(
          (a: any) => `
        <tr>
          <td><strong>${a.title || 'Client Consultation'}</strong></td>
          <td>${a.clientName || 'Client'}</td>
          <td style="text-transform: capitalize;">${a.meetingLocationType || 'Meeting'}</td>
          <td style="text-transform: capitalize;">${a.status || 'Confirmed'}</td>
          <td style="text-align: right; color: #64748b;">${new Date(a.startTime).toLocaleDateString()} ${new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  `
      : ''
  }

  <div class="footer">
    <div>CONFIDENTIAL SALES AUDIT REPORT · GOHIGHLEVEL ENTERPRISE CRM DASHBOARD</div>
    <div>Page 1 · End of 360° Summary Report</div>
  </div>
</body>
</html>
      `;

      // Use hidden iframe to trigger print dialog without pop-up blocking
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.error('Print trigger failed:', e);
          } finally {
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              setIsGeneratingPdf(false);
            }, 2500);
          }
        }, 400);
      }
    } catch (err: any) {
      setIsGeneratingPdf(false);
      if (onToast) onToast(`PDF generation failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl p-5 md:p-7 border border-gray-200 shadow-2xl relative my-6 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-900 transition-all hover:bg-gray-200 active:scale-95 z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header: Agent Info & 360 Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-blue-500/20 shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{agent.name}</h2>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE 360° REPORT
                </span>
                {isLoading && (
                  <span className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {agent.role} · {reportData?.location?.name || 'Sales Department'}
              </p>
            </div>
          </div>

          {/* Quick Lifetime Summary Badge */}
          {lifetime && (
            <div className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-700 flex flex-col justify-center sm:text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">All-Time Lifetime</span>
              <span className="font-extrabold text-slate-900">
                {lifetime.won} Won / {lifetime.leads} Leads ({lifetime.conversion})
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">{formatCurrency(lifetime.revenue)}</span>
            </div>
          )}
        </div>

        {/* Interactive Filter Toolbar: Won Date Basis & Date Range */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 my-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" /> Filter Basis:
            </span>

            {/* Won Date vs Created Date Toggle */}
            <div className="inline-flex rounded-xl bg-white p-1 border border-gray-200 shadow-sm text-xs font-bold">
              <button
                type="button"
                onClick={() => setDateBasis('won')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  dateBasis === 'won'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Filter metrics & deals by Won Date (when deals closed)"
              >
                <Award className="w-3.5 h-3.5" />
                <span>🏆 Won Date</span>
              </button>
              <button
                type="button"
                onClick={() => setDateBasis('created')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  dateBasis === 'created'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Filter metrics & deals by Created Date (when leads entered)"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>📅 Created Date</span>
              </button>
            </div>

            {/* Date Range Presets Dropdown */}
            <div className="relative inline-block">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-900 text-xs font-bold rounded-xl pl-3 pr-8 py-1.5 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Custom Date Range Picker Bar (if custom is selected) */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400 font-medium">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleApplyCustomRange}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-4 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>Overview & KPIs</span>
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'deals'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Deals & Opportunities</span>
            <span className="ml-1 px-1.5 py-0.2 bg-white text-gray-700 rounded-full text-[10px] border border-gray-200">
              {deals.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'meetings'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Meetings & Calls</span>
            <span className="ml-1 px-1.5 py-0.2 bg-white text-gray-700 rounded-full text-[10px] border border-gray-200">
              {appointments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Tasks</span>
            <span className="ml-1 px-1.5 py-0.2 bg-white text-gray-700 rounded-full text-[10px] border border-gray-200">
              {tasks.length}
            </span>
          </button>
        </div>

        {/* Scrollable Tab Content Container */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-5">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Deals Won Card */}
                <div className="bg-gradient-to-br from-emerald-50/70 to-white rounded-2xl p-4 border border-emerald-200/80 shadow-sm transition-all hover:border-emerald-300">
                  <div className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-600" /> Deals Won
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-700 mt-1">{metrics.won}</div>
                  <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                    {formatCurrency(metrics.revenue)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {dateBasis === 'won' ? 'Won in selected period' : 'Won from period leads'}
                  </div>
                </div>

                {/* Leads Handled Card */}
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200 transition-all hover:border-blue-300">
                  <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Leads Received</div>
                  <div className="text-3xl font-extrabold text-gray-900 mt-1">{metrics.leads}</div>
                  <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                    {metrics.worked} Active ({workedRate}%)
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Assigned to agent</div>
                </div>

                {/* Conversion Rate Card */}
                <div className="bg-gradient-to-br from-violet-50/70 to-white rounded-2xl p-4 border border-violet-200/80 shadow-sm transition-all hover:border-violet-300">
                  <div className="text-[11px] text-violet-800 font-bold uppercase tracking-wider">Conversion Rate</div>
                  <div className="text-3xl font-extrabold text-violet-700 mt-1">{metrics.conversion}</div>
                  <div className="text-[11px] text-violet-800 font-semibold mt-0.5">
                    {metrics.won} won / {metrics.leads} leads
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Overall effectiveness</div>
                </div>

                {/* Tasks & Health Card */}
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200 transition-all hover:border-cyan-300">
                  <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Follow-up Backlog</div>
                  <div className="text-3xl font-extrabold text-gray-900 mt-1 flex items-center gap-2">
                    <span>{metrics.tasksToday}</span>
                    <span className="text-xs font-semibold text-gray-400">today</span>
                  </div>
                  <div className="text-[11px] mt-0.5 flex items-center gap-1 font-semibold">
                    {metrics.tasksOverdue > 0 ? (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {metrics.tasksOverdue} overdue
                      </span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 0 overdue
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{metrics.tasksPending} pending tasks</div>
                </div>
              </div>

              {/* Revenue Target Progress Bar */}
              <div className="bg-gradient-to-r from-blue-50 via-white to-emerald-50/50 rounded-2xl p-4 border border-blue-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Revenue Target Performance ({dateBasis === 'won' ? 'Won in Period' : 'Period Revenue'})
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {formatCurrency(metrics.revenue)}
                    <span className="text-xs font-semibold text-gray-500 ml-2">
                      generated of {formatCurrency(metrics.targetRevenue)} goal
                    </span>
                  </div>
                  <div className="w-64 max-w-full bg-gray-200 rounded-full h-2 overflow-hidden mt-2">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, metrics.targetProgress)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <div className="text-base font-extrabold text-emerald-600 flex items-center sm:justify-end gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>{metrics.targetProgress}% of Target Goal</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {metrics.targetProgress >= 100
                      ? '🎯 Target achieved for this period!'
                      : `${formatCurrency(Math.max(0, metrics.targetRevenue - metrics.revenue))} remaining`}
                  </div>
                </div>
              </div>

              {/* Side-by-Side: Pipeline Breakdown & Tasks Health */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dynamic Pipeline Breakdown */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <GitMerge className="w-3.5 h-3.5" /> Pipeline Stage Breakdown
                    </h4>

                    {stageEntries.length > 0 ? (
                      <div className="space-y-2.5 text-xs max-h-56 overflow-y-auto pr-1">
                        {stageEntries.map(([stageName, count]) => {
                          const totalForPct = metrics.leads > 0 ? metrics.leads : deals.length;
                          const pct = totalForPct > 0 ? Math.round((count / totalForPct) * 100) : 0;
                          return (
                            <div key={stageName} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium truncate max-w-[170px]" title={stageName}>
                                  {stageName}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400 font-medium">{pct}%</span>
                                  <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                                    {count} {count === 1 ? 'deal' : 'deals'}
                                  </span>
                                </div>
                              </div>
                              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-400 text-xs">
                        <Clock className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                        No deals recorded for this period.
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-500 flex justify-between">
                    <span>Total Deals Analyzed:</span>
                    <strong className="text-gray-900">{deals.length || metrics.leads}</strong>
                  </div>
                </div>

                {/* Tasks & Follow-up Health */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Follow-up & Activity Health
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                        <span className="text-gray-600">Tasks Due Today</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded border ${
                            metrics.tasksToday > 0
                              ? 'text-cyan-700 bg-cyan-50 border-cyan-200'
                              : 'text-gray-500 bg-gray-100 border-gray-200'
                          }`}
                        >
                          {metrics.tasksToday} {metrics.tasksToday === 1 ? 'Task' : 'Tasks'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                        <span className="text-gray-600">Pending Follow-ups</span>
                        <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {metrics.tasksPending} Pending
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                        <span className="text-gray-600">Overdue Tasks</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                            metrics.tasksOverdue > 0
                              ? 'text-rose-600 bg-rose-50 border-rose-200'
                              : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          {metrics.tasksOverdue > 0 ? (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              {metrics.tasksOverdue} Overdue
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              0 Overdue
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-gray-600">Scheduled Meetings</span>
                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          {appointments.length} Total Bookings
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-500 flex justify-between">
                    <span>Task Backlog Status:</span>
                    <span
                      className={`font-semibold ${
                        metrics.tasksOverdue > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {metrics.tasksOverdue > 0 ? 'Action Required' : 'All Clear'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEALS & OPPORTUNITIES */}
          {activeTab === 'deals' && (
            <div className="space-y-3">
              {/* Search & Status Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search deals, clients, or stages..."
                    value={dealSearch}
                    onChange={(e) => setDealSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="text-gray-500 text-[11px]">Status:</span>
                  {(['all', 'won', 'open', 'lost'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDealStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold transition-all ${
                        dealStatusFilter === st
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deals Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-bold sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Deal / Opportunity</th>
                        <th className="py-2.5 px-3">Client Contact</th>
                        <th className="py-2.5 px-3">Pipeline Stage</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Value</th>
                        <th className="py-2.5 px-3 text-right">
                          {dateBasis === 'won' ? 'Won Date' : 'Created Date'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredDeals.length > 0 ? (
                        filteredDeals.map((d: any) => (
                          <tr key={d.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-gray-900">
                              <div className="truncate max-w-[190px]" title={d.name}>
                                {d.name || 'Untitled Opportunity'}
                              </div>
                              <div className="text-[10px] text-gray-400 font-normal">
                                {d.source || 'Direct'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-gray-600">
                              <div className="font-semibold text-gray-900 truncate max-w-[150px]">
                                {d.contactName || 'No Name'}
                              </div>
                              {d.contactPhone && (
                                <div className="text-[10px] text-gray-400">{d.contactPhone}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-gray-600 truncate max-w-[130px]">
                              {d.stageName || 'Pipeline Stage'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
                                  d.status === 'won'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : d.status === 'lost' || d.status === 'abandoned'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {d.status || 'open'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-gray-900">
                              {formatCurrency(d.monetaryValue || 0)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-500 font-medium">
                              {(d.wonAt || d.createdAt || '').slice(0, 10)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400">
                            <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            No deals match the filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEETINGS & APPOINTMENTS */}
          {activeTab === 'meetings' && (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 flex justify-between items-center">
                <span>Recent & Scheduled Client Consultations:</span>
                <span className="font-bold text-gray-900">{appointments.length} Meetings</span>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-bold sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Meeting Title</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Scheduled Time</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {appointments.length > 0 ? (
                        appointments.map((a: any) => (
                          <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-gray-900">
                              <div className="truncate max-w-[190px]" title={a.title}>
                                {a.title || 'Client Consultation'}
                              </div>
                              {a.calendarName && (
                                <div className="text-[10px] text-gray-400">{a.calendarName}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-gray-600">
                              <div className="font-semibold text-gray-900">{a.clientName || 'Client'}</div>
                              {a.contactPhone && (
                                <div className="text-[10px] text-gray-400">{a.contactPhone}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                {a.meetingLocationType === 'zoom' ? (
                                  <Video className="w-3 h-3 text-blue-600" />
                                ) : a.meetingLocationType === 'phone' ? (
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <MapPin className="w-3 h-3 text-amber-600" />
                                )}
                                <span className="capitalize">{a.meetingLocationType || 'meeting'}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
                                  a.status === 'confirmed'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : a.status === 'showed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : a.status === 'noshow' || a.status === 'cancelled'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {a.status || 'confirmed'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-700 font-semibold whitespace-nowrap">
                              <div>{new Date(a.startTime).toLocaleDateString()}</div>
                              <div className="text-[10px] text-gray-400">
                                {new Date(a.startTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {a.meetingUrl ? (
                                <a
                                  href={a.meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                                >
                                  Join <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400">
                            <CalendarDays className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            No scheduled meetings found for this sales consultant.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 flex justify-between items-center">
                <span>Follow-up Tasks & Action Items:</span>
                <span className="font-bold text-gray-900">{tasks.length} Total Tasks</span>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-bold sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Task Title / Details</th>
                        <th className="py-2.5 px-3">Related Contact</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tasks.length > 0 ? (
                        tasks.map((t: any) => {
                          const isOverdue =
                            !t.completed && t.dueDate && new Date(t.dueDate) < new Date();
                          return (
                            <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="py-2.5 px-3 font-bold text-gray-900">
                                <div>{t.title || 'Follow-up Task'}</div>
                                {t.body && (
                                  <div className="text-[10px] text-gray-500 font-normal line-clamp-1">
                                    {t.body}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-gray-600 font-semibold">
                                {t.contactName || 'Client'}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
                                    t.completed
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : isOverdue
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {t.completed ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                {t.dueDate ? (
                                  <span
                                    className={`font-semibold ${
                                      isOverdue ? 'text-rose-600' : 'text-gray-600'
                                    }`}
                                  >
                                    {new Date(t.dueDate).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">No Due Date</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-gray-400">
                            <ListTodo className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            No tasks found for this consultant.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions: Download PDF, Export CSV, Close */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-gray-400">
            Filtered by: <strong className="text-gray-700">{dateBasis === 'won' ? 'Won Date' : 'Created Date'}</strong> ({DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || dateRange})
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
            >
              Close
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95 border border-slate-200"
              title="Export complete 360 data to CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
              title="Download clean executive PDF report"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
