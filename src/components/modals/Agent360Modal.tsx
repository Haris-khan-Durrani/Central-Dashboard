'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  GitMerge,
  Download,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  Search,
  Briefcase,
  ListTodo,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
  Phone,
  Video,
  MapPin,
  CalendarDays,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { AgentData } from '../dashboard/AgentCardsGrid';
import { CountryFlag, getCountryCode } from '../dashboard/NationalityMatrix';

interface Agent360ModalProps {
  agent: AgentData | null;
  currency: string;
  locationId?: string;
  shareToken?: string;
  dateRangeLabel?: string;
  initialDateBasis?: 'created' | 'won';
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

const SEGREGATION_OPTIONS = [
  { value: 'contact.nationality', label: 'Nationality' },
  { value: 'source', label: 'Lead Source' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'stage', label: 'Pipeline Stage' },
  { value: 'custom_input', label: 'Custom Field...' },
];

export default function Agent360Modal({
  agent,
  currency,
  locationId,
  shareToken,
  dateRangeLabel = 'this_month',
  initialDateBasis = 'created',
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
  const [dateBasis, setDateBasis] = useState<'created' | 'won'>(initialDateBasis || 'created');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isApplyingCustom, setIsApplyingCustom] = useState<boolean>(false);

  // Custom field segregation state (Default: Nationality)
  const [segregationOption, setSegregationOption] = useState<string>('contact.nationality');
  const [customFieldKey, setCustomFieldKey] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'meetings' | 'tasks'>('overview');
  const [dealStatusFilter, setDealStatusFilter] = useState<'all' | 'won' | 'open' | 'lost'>('all');
  const [dealSearch, setDealSearch] = useState<string>('');

  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Active segregation field string
  const activeSegregationField = useMemo(() => {
    if (segregationOption === 'custom_input') {
      return customFieldKey.trim() || 'contact.nationality';
    }
    return segregationOption;
  }, [segregationOption, customFieldKey]);

  // Fetch 360 data whenever agent, dateRange, dateBasis, custom dates, or segregation field change
  useEffect(() => {
    if (!agent || (!locationId && !shareToken)) return;

    if (dateRange === 'custom' && (!customStart || !customEnd)) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const params = new URLSearchParams();
    params.set('date_range', dateRange);
    params.set('date_basis', dateBasis);
    params.set('segregation_field', activeSegregationField);
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
  }, [agent?.ghlUserId, locationId, shareToken, dateRange, dateBasis, activeSegregationField, isApplyingCustom]);

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
  const segregation = reportData?.segregation || {
    fieldLabel: 'Nationality',
    items: [],
    totalCategorized: 0,
  };

  const cleanSegLabel = segregation.fieldLabel || 'Nationality';

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
    if (selectedCategoryFilter) {
      const val = d.customFieldValue || d.nationality || 'Unspecified';
      if (val !== selectedCategoryFilter) return false;
    }
    if (dealSearch.trim()) {
      const q = dealSearch.toLowerCase();
      const matchName = (d.name || '').toLowerCase().includes(q);
      const matchContact = (d.contactName || '').toLowerCase().includes(q);
      const matchStage = (d.stageName || '').toLowerCase().includes(q);
      const matchCat = (d.customFieldValue || d.nationality || '').toLowerCase().includes(q);
      return matchName || matchContact || matchStage || matchCat;
    }
    return true;
  });

  // Apply custom date range
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
      const rangeLabel = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || dateRange;
      const basisLabel = dateBasis === 'won' ? 'Won Date Basis' : 'Created Date Basis';

      const rows: (string | number)[][] = [
        ['Profile', 'Agent Name', agent.name],
        ['Profile', 'Role', agent.role],
        ['Profile', 'Email', reportData?.user?.email || agent.email || 'N/A'],
        ['Filter', 'Date Range', rangeLabel],
        ['Filter', 'Date Basis', basisLabel],
        ['Filter', 'Auto-Segregation Field', cleanSegLabel],
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
        [`Segregation: ${cleanSegLabel}`, 'Category', 'Leads', 'Won Deals', 'Revenue', 'Conversion'],
        ...(segregation.items || []).map((item: any) => [
          `Segregation: ${cleanSegLabel}`,
          item.value,
          item.leads,
          item.won,
          `${activeCurrency} ${item.revenue}`,
          item.conversion,
        ]),
        ['', '', ''],
        ['Pipeline Breakdown', 'Stage Name', 'Deals Count'],
        ...stageEntries.map(([stage, count]) => ['Pipeline Breakdown', stage, count]),
        ['', '', ''],
        ['Deals Audit List', 'Deal Name', 'Client', 'Stage', 'Value', 'Status', 'Won Date', cleanSegLabel, 'Source'],
        ...deals.map((d: any) => [
          'Deal',
          d.name || 'Untitled',
          d.contactName || 'N/A',
          d.stageName || 'N/A',
          `${activeCurrency} ${d.monetaryValue || 0}`,
          d.status || 'open',
          d.wonAt ? d.wonAt.slice(0, 10) : 'N/A',
          d.customFieldValue || d.nationality || 'Unspecified',
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



  // PDF Report Generator (Executive layout, clean visual summaries, zero raw contact list dump)
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const rangeLabel = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || dateRange;
      const basisLabel = dateBasis === 'won' ? 'Won Date Basis' : 'Created Date Basis';
      const generatedAt = new Date().toLocaleString();

      const totalPipelineDeals = stageEntries.reduce((acc, [, count]) => acc + count, 0);
      const wonDeals = deals.filter((d: any) => (d.status || '').toLowerCase() === 'won').slice(0, 5);
      const activeDeals = deals.filter((d: any) => (d.status || '').toLowerCase() !== 'won').slice(0, 5);
      const displayDeals = wonDeals.length > 0 ? wonDeals : activeDeals;
      const isShowingWon = wonDeals.length > 0;

      const totalSegLeads = (segregation.items || []).reduce((acc: number, item: any) => acc + (item.leads || 0), 0);
      const totalSegWon = (segregation.items || []).reduce((acc: number, item: any) => acc + (item.won || 0), 0);
      const totalSegConversion = totalSegLeads > 0 ? `${((totalSegWon / totalSegLeads) * 100).toFixed(1)}%` : '0.0%';

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sales Audit Report - ${agent.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 100% !important;
      height: 100%;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
    }
    .report-wrap {
      width: 100% !important;
      min-height: 272mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
    }
    .content-body {
      flex: 1 0 auto;
    }

    /* Top Corporate Header */
    .header {
      border-top: 5px solid #1e40af;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .title-block .sub-heading {
      font-size: 9.5px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .title-block h1 {
      margin: 0 0 5px 0;
      font-size: 19px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.4px;
    }
    .badge-bar {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 9px;
      border-radius: 5px;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .badge-blue { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-green { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .badge-purple { background: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff; }

    .header-meta {
      text-align: right;
    }
    .header-meta .meta-title {
      font-size: 11px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.3px;
    }
    .header-meta .meta-sub {
      font-size: 9px;
      color: #475569;
      margin-top: 2px;
    }
    .header-meta .meta-pill {
      display: inline-block;
      margin-top: 4px;
      font-size: 8.5px;
      font-weight: 800;
      color: #16a34a;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 2px 7px;
      border-radius: 4px;
    }

    /* Agent Profile & Quota Box */
    .agent-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1.5px solid #cbd5e1;
      border-left: 5px solid #2563eb;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .agent-meta h2 {
      margin: 0 0 2px 0;
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }
    .agent-meta p {
      margin: 0;
      font-size: 10.5px;
      color: #475569;
    }
    .target-box {
      text-align: right;
      min-width: 240px;
    }
    .progress-bar-bg {
      width: 100%;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 4px;
    }
    .progress-bar-fill {
      height: 100%;
      background: #16a34a;
      border-radius: 4px;
    }

    /* 4 Primary KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 11px;
      width: 100%;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 9px 12px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .kpi-label {
      font-size: 8.5px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .kpi-value {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      margin: 2px 0;
      line-height: 1.1;
    }
    .kpi-sub {
      font-size: 9px;
      font-weight: 700;
    }

    /* Benchmark Strip */
    .benchmark-strip {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 12px;
      margin-bottom: 12px;
      font-size: 9px;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .benchmark-label {
      font-weight: 900;
      color: #1e3a8a;
      text-transform: uppercase;
      font-size: 8.5px;
      letter-spacing: 0.3px;
    }
    .sep { color: #94a3b8; }

    /* Tables */
    .section-title {
      font-size: 10.5px;
      font-weight: 900;
      text-transform: uppercase;
      color: #0f172a;
      letter-spacing: 0.4px;
      margin: 11px 0 5px 0;
      padding-bottom: 3px;
      border-bottom: 1.5px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title .badge-counter {
      font-size: 8.5px;
      font-weight: 800;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 11px;
    }

    table {
      width: 100% !important;
      border-collapse: collapse;
      font-size: 9.5px;
      margin-bottom: 4px;
    }
    th {
      background: #1e293b;
      color: #ffffff;
      text-align: left;
      padding: 6px 8px;
      font-weight: 800;
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    td {
      padding: 5.5px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #0f172a;
    }
    tr:nth-child(even) td { background: #f8fafc; }
    tfoot td {
      background: #f1f5f9 !important;
      font-weight: 800;
      border-top: 1.5px solid #94a3b8;
    }

    /* Diagnostics Card */
    .diagnostics-card {
      border: 1px solid #cbd5e1;
      border-left: 5px solid #4338ca;
      border-radius: 8px;
      background: #f8fafc;
      padding: 9px 12px;
      margin-bottom: 11px;
    }
    .diagnostics-header {
      font-size: 9.5px;
      font-weight: 900;
      color: #312e81;
      text-transform: uppercase;
      margin-bottom: 6px;
      letter-spacing: 0.4px;
      display: flex;
      justify-content: space-between;
    }
    .diagnostics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .diagnostics-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 10px;
    }
    .diagnostics-item-title {
      font-size: 8px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .diagnostics-item-value {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .diagnostics-item-sub {
      font-size: 8px;
      color: #475569;
      line-height: 1.25;
    }

    /* Executive Action Plan Directives */
    .action-panel {
      border: 1px solid #cbd5e1;
      border-left: 5px solid #059669;
      border-radius: 8px;
      background: #f0fdf4;
      padding: 9px 12px;
      margin-bottom: 10px;
    }
    .action-header {
      font-size: 9.5px;
      font-weight: 900;
      color: #065f46;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
    }
    .action-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .action-item {
      background: #ffffff;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 7px 9px;
      font-size: 8.5px;
      color: #1f2937;
      line-height: 1.3;
    }
    .action-item strong {
      display: block;
      color: #065f46;
      font-size: 9px;
      margin-bottom: 2px;
    }

    .status-won { color: #15803d; font-weight: 800; background: #dcfce7; padding: 2px 6px; border-radius: 3px; border: 1px solid #bbf7d0; font-size: 8px; }
    .status-lost { color: #b91c1c; font-weight: 800; background: #fee2e2; padding: 2px 6px; border-radius: 3px; border: 1px solid #fecaca; font-size: 8px; }
    .status-open { color: #1d4ed8; font-weight: 800; background: #dbeafe; padding: 2px 6px; border-radius: 3px; border: 1px solid #bfdbfe; font-size: 8px; }

    /* Footer pinned to bottom */
    .footer {
      margin-top: auto;
      padding-top: 8px;
      border-top: 1.5px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #64748b;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="report-wrap">
    <div class="content-body">
      <!-- Header -->
      <div class="header">
        <div class="title-block">
          <div class="sub-heading">${reportData?.location?.name || 'Centralized Sales CRM'}</div>
          <h1>360° EXECUTIVE SALES AUDIT REPORT</h1>
          <div class="badge-bar">
            <span class="badge badge-blue">Scope: ${rangeLabel}</span>
            <span class="badge badge-green">Basis: ${basisLabel}</span>
            <span class="badge badge-purple">Breakdown: ${cleanSegLabel}</span>
          </div>
        </div>
        <div class="header-meta">
          <div class="meta-title">EXECUTIVE PERFORMANCE AUDIT</div>
          <div class="meta-sub">Audit Timestamp: ${generatedAt}</div>
          <div class="meta-pill">● Verified CRM Database Record</div>
        </div>
      </div>

      <!-- Agent Profile & Target Goal -->
      <div class="agent-card">
        <div class="agent-meta">
          <h2>${agent.name}</h2>
          <p>${agent.role} · ${reportData?.user?.email || agent.email || 'Sales Consultant'}</p>
        </div>
        <div class="target-box">
          <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 2px;">
            <span style="color: #475569; font-weight: 700;">QUOTA: ${formatCurrency(metrics.targetRevenue)}</span>
            <span style="color: #15803d; font-weight: 800;">${formatCurrency(metrics.revenue)} (${metrics.targetProgress}% Achieved)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${Math.min(100, metrics.targetProgress)}%;"></div>
          </div>
        </div>
      </div>

      <!-- 4 KPI Performance Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" style="border-top: 3.5px solid #16a34a;">
          <div class="kpi-label">Deals Won</div>
          <div class="kpi-value" style="color: #15803d;">${metrics.won}</div>
          <div class="kpi-sub" style="color: #15803d;">${formatCurrency(metrics.revenue)} Won</div>
        </div>
        <div class="kpi-card" style="border-top: 3.5px solid #2563eb;">
          <div class="kpi-label">Leads Handled</div>
          <div class="kpi-value" style="color: #1d4ed8;">${metrics.leads}</div>
          <div class="kpi-sub" style="color: #2563eb;">${metrics.worked} Active (${workedRate}%)</div>
        </div>
        <div class="kpi-card" style="border-top: 3.5px solid #7e22ce;">
          <div class="kpi-label">Conversion Rate</div>
          <div class="kpi-value" style="color: #7e22ce;">${metrics.conversion}</div>
          <div class="kpi-sub" style="color: #7e22ce;">Won / Leads Ratio</div>
        </div>
        <div class="kpi-card" style="border-top: 3.5px solid #0891b2;">
          <div class="kpi-label">Tasks Due / Overdue</div>
          <div class="kpi-value">${metrics.tasksToday} / <span style="color: ${metrics.tasksOverdue > 0 ? '#b91c1c' : '#15803d'};">${metrics.tasksOverdue}</span></div>
          <div class="kpi-sub" style="color: #0891b2;">${metrics.tasksPending} Pending Tasks</div>
        </div>
      </div>

      <!-- Lifetime Historical Benchmark Strip -->
      <div class="benchmark-strip">
        <span class="benchmark-label">Lifetime Historical Benchmark:</span>
        <span><strong>${lifetime?.leads || metrics.leads}</strong> Lifetime Leads</span>
        <span class="sep">·</span>
        <span><strong style="color: #15803d;">${lifetime?.won || metrics.won}</strong> Won Deals (${lifetime?.conversion || metrics.conversion} Win Rate)</span>
        <span class="sep">·</span>
        <span><strong>${formatCurrency(lifetime?.revenue || metrics.revenue)}</strong> Total Won Revenue</span>
      </div>

      <!-- 2-Column Section: Segregation / Nationality Table + Pipeline Stages Table -->
      <div class="grid-2col">
        <div>
          <div class="section-title">
            <span>Client Segregation by ${cleanSegLabel}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 40%;">${cleanSegLabel}</th>
                <th style="width: 20%; text-align: center;">Leads</th>
                <th style="width: 20%; text-align: center;">Won</th>
                <th style="width: 20%; text-align: right;">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              ${
                segregation.items && segregation.items.length > 0
                  ? segregation.items
                      .slice(0, 8)
                      .map(
                        (item: any) => {
                          const code = getCountryCode(item.value || '');
                          const flagHtml = code
                            ? `<img src="https://flagcdn.com/20x15/${code}.png" style="width: 13px; height: 9px; border-radius: 2px; vertical-align: middle; margin-right: 4px; display: inline-block;" />`
                            : '';
                          return `
                <tr>
                  <td>${flagHtml}<strong>${item.value || 'Unspecified'}</strong></td>
                  <td style="text-align: center;">${item.leads} <span style="color: #64748b; font-size: 8px;">(${item.percentage}%)</span></td>
                  <td style="text-align: center; color: #15803d; font-weight: 800;">${item.won}</td>
                  <td style="text-align: right; color: #1d4ed8; font-weight: 700;">${item.conversion}</td>
                </tr>
              `;
                        }
                      )
                      .join('')
                  : `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 8px;">No categorization data available.</td></tr>`
              }
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td style="text-align: center;">${totalSegLeads}</td>
                <td style="text-align: center; color: #15803d;">${totalSegWon}</td>
                <td style="text-align: right; color: #1d4ed8;">${totalSegConversion}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div>
          <div class="section-title">
            <span>Pipeline Stage Distribution</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 48%;">Stage Name</th>
                <th style="width: 24%; text-align: center;">Active Deals</th>
                <th style="width: 28%; text-align: right;">% Share</th>
              </tr>
            </thead>
            <tbody>
              ${
                stageEntries.length > 0
                  ? stageEntries
                      .slice(0, 8)
                      .map(([st, cnt]) => {
                        const pct = totalPipelineDeals > 0 ? Math.round((cnt / totalPipelineDeals) * 100) : 0;
                        return `
                <tr>
                  <td><strong>${st}</strong></td>
                  <td style="text-align: center; font-weight: 700;">${cnt}</td>
                  <td style="text-align: right; color: #475569;">
                    <span style="display: inline-block; width: 30px; text-align: right; font-weight: 700;">${pct}%</span>
                    <span style="display: inline-block; width: 30px; height: 5px; background: #e2e8f0; border-radius: 3px; vertical-align: middle; margin-left: 4px; overflow: hidden;">
                      <span style="display: block; width: ${pct}%; height: 100%; background: #2563eb;"></span>
                    </span>
                  </td>
                </tr>
              `;
                      })
                      .join('')
                  : `<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 8px;">No pipeline stage data.</td></tr>`
              }
            </tbody>
            <tfoot>
              <tr>
                <td>Total Pipeline Deals</td>
                <td style="text-align: center;">${totalPipelineDeals}</td>
                <td style="text-align: right;">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Executive Performance Analysis & Workload Diagnostics -->
      <div class="diagnostics-card">
        <div class="diagnostics-header">
          <span>Executive Pipeline & Operational Diagnostics</span>
          <span style="color: #64748b; font-weight: 700;">Audit Health Check</span>
        </div>
        <div class="diagnostics-grid">
          <div class="diagnostics-item">
            <div class="diagnostics-item-title">Pipeline Velocity</div>
            <div class="diagnostics-item-value" style="color: #2563eb;">${workedRate}% Engagement</div>
            <div class="diagnostics-item-sub">${metrics.worked} of ${metrics.leads} leads worked with active touches in selected period.</div>
          </div>
          <div class="diagnostics-item">
            <div class="diagnostics-item-title">Follow-up SLA Compliance</div>
            <div class="diagnostics-item-value" style="color: ${metrics.tasksOverdue > 0 ? '#b91c1c' : '#15803d'};">
              ${metrics.tasksOverdue > 0 ? `${metrics.tasksOverdue} Overdue` : '100% SLA On-Time'}
            </div>
            <div class="diagnostics-item-sub">${metrics.tasksToday} tasks due today, ${metrics.tasksPending} total pending follow-ups.</div>
          </div>
          <div class="diagnostics-item">
            <div class="diagnostics-item-title">Quota Gap Analysis</div>
            <div class="diagnostics-item-value" style="color: #0f172a;">${metrics.targetProgress}% Complete</div>
            <div class="diagnostics-item-sub">${formatCurrency(Math.max(0, metrics.targetRevenue - metrics.revenue))} remaining to hit target goal.</div>
          </div>
        </div>
      </div>

      <!-- Deals & Client Engagements Section (ALWAYS SHOWN) -->
      ${
        displayDeals.length > 0
          ? `
      <div class="section-title">
        <span>${isShowingWon ? 'Closed Won Highlights' : 'Active Pipeline Opportunities & Client Engagements'}</span>
        <span class="badge-counter">${displayDeals.length} Deals in Audit Scope</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 32%;">Deal / Client Name</th>
            <th style="width: 20%;">${cleanSegLabel}</th>
            <th style="width: 18%;">Current Stage</th>
            <th style="width: 15%; text-align: right;">Deal Value</th>
            <th style="width: 15%; text-align: right;">Status & Date</th>
          </tr>
        </thead>
        <tbody>
          ${displayDeals
            .map((d: any) => {
              const code = getCountryCode(d.customFieldValue || d.nationality || '');
              const flagHtml = code
                ? `<img src="https://flagcdn.com/20x15/${code}.png" style="width: 13px; height: 9px; border-radius: 2px; vertical-align: middle; margin-right: 4px; display: inline-block;" />`
                : '';
              const isWon = (d.status || '').toLowerCase() === 'won';
              const statusClass = isWon ? 'status-won' : ((d.status || '').toLowerCase() === 'lost' ? 'status-lost' : 'status-open');
              const dateStr = (isWon ? (d.wonAt || d.createdAt) : (d.createdAt || '')).slice(0, 10);
              return `
            <tr>
              <td><strong>${d.name || 'Opportunity'}</strong> <span style="color: #64748b; font-size: 8px;">(${d.contactName || 'Direct'})</span></td>
              <td><span style="font-weight: 700; color: #4338ca;">${flagHtml}${d.customFieldValue || d.nationality || 'Unspecified'}</span></td>
              <td>${d.stageName || (isWon ? 'Won' : 'Active Stage')}</td>
              <td style="text-align: right; font-weight: 800; color: ${isWon ? '#15803d' : '#0f172a'};">${formatCurrency(d.monetaryValue || 0)}</td>
              <td style="text-align: right;">
                <span class="${statusClass}">${(d.status || 'open').toUpperCase()}</span>
                <span style="color: #64748b; font-size: 8px; margin-left: 3px;">${dateStr}</span>
              </td>
            </tr>
          `;
            })
            .join('')}
        </tbody>
      </table>
      `
          : ''
      }

      <!-- Strategic Management Audit Action Directives -->
      <div class="action-panel">
        <div class="action-header">
          <span>Strategic Operational Directives & Action Recommendations</span>
          <span style="color: #047857; font-weight: 800;">Management Action Plan</span>
        </div>
        <div class="action-grid">
          <div class="action-item">
            <strong>1. SLA Touch & Follow-Up Cadence</strong>
            ${metrics.tasksOverdue > 0 
              ? `Clear ${metrics.tasksOverdue} overdue task${metrics.tasksOverdue > 1 ? 's' : ''} immediately to restore 100% CRM touch SLA compliance.`
              : 'Maintain consistent same-day lead touch cadence across all active client opportunities.'}
          </div>
          <div class="action-item">
            <strong>2. Pipeline Conversion Focus</strong>
            ${metrics.worked > 0
              ? `Advance ${metrics.worked} active lead${metrics.worked > 1 ? 's' : ''} through qualification and proposal stages to drive win velocity.`
              : 'Initiate outbound touches on newly assigned leads to establish active engagement.'}
          </div>
          <div class="action-item">
            <strong>3. Quota Achievement Trajectory</strong>
            ${metrics.targetRevenue > metrics.revenue
              ? `Target remaining gap of ${formatCurrency(metrics.targetRevenue - metrics.revenue)} to achieve full period revenue quota target.`
              : 'Target achieved! Continue scaling high-value client acquisitions for quota overachievement.'}
          </div>
        </div>
      </div>
    </div>

    <!-- Pinned Footer at Bottom of Page -->
    <div class="footer">
      <div>CONFIDENTIAL SALES AUDIT REPORT · GOHIGHLEVEL ENTERPRISE CRM DASHBOARD</div>
      <div>Page 1 of 1 · Executive 360° Summary Report · ${agent.name}</div>
    </div>
  </div>
</body>
</html>
      `;
      // Use exact 794px width (standard A4 at 96 DPI) so the browser print engine prints at 100% 1:1 scale
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-99999px';
      iframe.style.top = '0';
      iframe.style.width = '794px';
      iframe.style.height = '1123px';
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
            }, 3000);
          }
        }, 500);
      }
    } catch (err: any) {
      setIsGeneratingPdf(false);
      if (onToast) onToast(`PDF generation failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Spacious Modal Container (max-w-6xl for premium executive feel) */}
      <div className="bg-white w-full max-w-6xl rounded-3xl p-6 md:p-8 border border-gray-200 shadow-2xl relative my-6 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-900 transition-all hover:bg-gray-200 active:scale-95 z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header: Agent Info & 360 Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-blue-500/20 shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{agent.name}</h2>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE 360° REPORT
                </span>
                {isLoading && (
                  <span className="flex items-center gap-1.5 text-xs text-blue-600 font-bold animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating Data...
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {agent.role} · {reportData?.location?.name || 'Sales Department'} · {reportData?.user?.email || agent.email || ''}
              </p>
            </div>
          </div>

          {/* Quick Lifetime Summary Badge */}
          {lifetime && (
            <div className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-700 flex flex-col justify-center sm:text-right shrink-0 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">All-Time Lifetime</span>
              <span className="font-black text-slate-900 text-sm">
                {lifetime.won} Won / {lifetime.leads} Leads ({lifetime.conversion})
              </span>
              <span className="text-xs text-emerald-600 font-extrabold">{formatCurrency(lifetime.revenue)}</span>
            </div>
          )}
        </div>

        {/* Interactive Filter Toolbar: Clean, No Shortcodes */}
        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 my-4 flex flex-col gap-3 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Filter Basis:
              </span>

              {/* Created Date vs Won Date Toggle */}
              <div className="inline-flex rounded-xl bg-white p-1 border border-gray-200 shadow-sm text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDateBasis('created')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    dateBasis === 'created'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Filter deals by Created Date (when leads entered)"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>📅 Created Date</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDateBasis('won')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    dateBasis === 'won'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Filter deals by Won Date (when deals closed)"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>🏆 Won Date</span>
                </button>
              </div>

              {/* Date Range Presets Dropdown */}
              <div className="relative inline-block">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 text-gray-900 text-xs font-bold rounded-xl pl-3.5 pr-8 py-2 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {DATE_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Custom Date Range Picker Bar (if custom is selected) */}
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-gray-400 font-medium">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomRange}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Secondary Row: Auto-Segregation by Nationality / Custom Field */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/70 text-xs">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" /> Auto-Segregate Data:
              </span>

              {/* Segregation Field Selector without technical shortcodes */}
              <div className="relative inline-block">
                <select
                  value={segregationOption}
                  onChange={(e) => {
                    setSegregationOption(e.target.value);
                    setSelectedCategoryFilter(null);
                  }}
                  className="appearance-none bg-white border border-indigo-200 text-indigo-950 text-xs font-bold rounded-xl pl-3.5 pr-8 py-1.5 shadow-sm hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {SEGREGATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-indigo-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* If Custom Key is selected, show custom text input */}
              {segregationOption === 'custom_input' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Enter custom field (e.g. nationality, property_type)"
                    value={customFieldKey}
                    onChange={(e) => setCustomFieldKey(e.target.value)}
                    className="border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-[240px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (onToast) onToast(`Applied breakdown by "${customFieldKey || 'Custom Field'}"`);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-sm hover:bg-indigo-700 transition-all"
                  >
                    Set
                  </button>
                </div>
              )}
            </div>

            {/* Active category filter pill indicator */}
            {selectedCategoryFilter && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg text-indigo-800 text-xs font-semibold self-start sm:self-center">
                <span>Filter: <strong>{selectedCategoryFilter}</strong></span>
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className="p-0.5 hover:bg-indigo-200 rounded text-indigo-600"
                  title="Clear category filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2.5 mb-4 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            <span>Overview & KPIs</span>
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'deals'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Deals & Opportunities</span>
            <span className="ml-1 px-2 py-0.5 bg-white text-gray-700 rounded-full text-xs border border-gray-200">
              {deals.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'meetings'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Meetings & Calls</span>
            <span className="ml-1 px-2 py-0.5 bg-white text-gray-700 rounded-full text-xs border border-gray-200">
              {appointments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Tasks</span>
            <span className="ml-1 px-2 py-0.5 bg-white text-gray-700 rounded-full text-xs border border-gray-200">
              {tasks.length}
            </span>
          </button>
        </div>

        {/* Scrollable Tab Content Container */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Deals Won Card */}
                <div className="bg-gradient-to-br from-emerald-50/80 to-white rounded-2xl p-4 md:p-5 border border-emerald-200 shadow-sm transition-all hover:border-emerald-300">
                  <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" /> Deals Won
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-emerald-700 mt-1.5">{metrics.won}</div>
                  <div className="text-xs text-emerald-800 font-bold mt-1">
                    {formatCurrency(metrics.revenue)}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {dateBasis === 'won' ? 'Won in selected period' : 'Won from period leads'}
                  </div>
                </div>

                {/* Leads Handled Card */}
                <div className="bg-gray-50/90 rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm transition-all hover:border-blue-300">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Leads Received</div>
                  <div className="text-3xl md:text-4xl font-black text-gray-900 mt-1.5">{metrics.leads}</div>
                  <div className="text-xs text-blue-600 font-bold mt-1">
                    {metrics.worked} Active ({workedRate}%)
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Assigned to agent</div>
                </div>

                {/* Conversion Rate Card */}
                <div className="bg-gradient-to-br from-violet-50/80 to-white rounded-2xl p-4 md:p-5 border border-violet-200 shadow-sm transition-all hover:border-violet-300">
                  <div className="text-xs text-violet-800 font-bold uppercase tracking-wider">Conversion Rate</div>
                  <div className="text-3xl md:text-4xl font-black text-violet-700 mt-1.5">{metrics.conversion}</div>
                  <div className="text-xs text-violet-800 font-bold mt-1">
                    {metrics.won} won / {metrics.leads} leads
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Win conversion efficiency</div>
                </div>

                {/* Tasks & Health Card */}
                <div className="bg-gray-50/90 rounded-2xl p-4 md:p-5 border border-gray-200 shadow-sm transition-all hover:border-cyan-300">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Follow-up Backlog</div>
                  <div className="text-3xl md:text-4xl font-black text-gray-900 mt-1.5 flex items-center gap-2">
                    <span>{metrics.tasksToday}</span>
                    <span className="text-xs font-semibold text-gray-400">today</span>
                  </div>
                  <div className="text-xs mt-1 flex items-center gap-1 font-bold">
                    {metrics.tasksOverdue > 0 ? (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {metrics.tasksOverdue} overdue
                      </span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 0 overdue
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{metrics.tasksPending} pending tasks</div>
                </div>
              </div>

              {/* Revenue Target Progress Bar */}
              <div className="bg-gradient-to-r from-blue-50 via-white to-emerald-50/60 rounded-2xl p-5 border border-blue-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                    Revenue Target Performance ({dateBasis === 'won' ? 'Won in Period' : 'Period Revenue'})
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {formatCurrency(metrics.revenue)}
                    <span className="text-xs font-semibold text-gray-500 ml-2">
                      generated of {formatCurrency(metrics.targetRevenue)} goal
                    </span>
                  </div>
                  <div className="w-72 max-w-full bg-gray-200 rounded-full h-2.5 overflow-hidden mt-2">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, metrics.targetProgress)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <div className="text-lg font-black text-emerald-600 flex items-center sm:justify-end gap-1.5">
                    <Award className="w-5 h-5" />
                    <span>{metrics.targetProgress}% of Target Goal</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {metrics.targetProgress >= 100
                      ? '🎯 Target achieved for this period!'
                      : `${formatCurrency(Math.max(0, metrics.targetRevenue - metrics.revenue))} remaining to goal`}
                  </div>
                </div>
              </div>

              {/* AUTO-SEGREGATION BREAKDOWN PANEL (Clean & Spacious) */}
              <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 rounded-2xl p-5 border border-indigo-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                  <div>
                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-600" /> Client Breakdown by {cleanSegLabel}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Auto-segregated from client phone numbers & profile data · Click any card to filter deals
                    </p>
                  </div>
                  {selectedCategoryFilter && (
                    <button
                      onClick={() => setSelectedCategoryFilter(null)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold underline self-start sm:self-auto"
                    >
                      Clear Filter ({selectedCategoryFilter})
                    </button>
                  )}
                </div>

                {segregation.items && segregation.items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {segregation.items.map((item: any) => {
                      const isSelected = selectedCategoryFilter === item.value;
                      return (
                        <div
                          key={item.value}
                          onClick={() => {
                            setSelectedCategoryFilter(isSelected ? null : item.value);
                            setActiveTab('deals');
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                              : 'bg-white text-gray-800 border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CountryFlag nationality={item.value} className="w-4 h-3" />
                              <span
                                className={`text-xs font-extrabold truncate max-w-[140px] ${
                                  isSelected ? 'text-white' : 'text-gray-900'
                                }`}
                                title={item.value}
                              >
                                {item.value}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? 'bg-indigo-700 text-white'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {item.won} won
                            </span>
                          </div>

                          <div className="mt-2.5 flex justify-between items-baseline text-xs">
                            <span className={isSelected ? 'text-indigo-100' : 'text-gray-500'}>
                              {item.leads} {item.leads === 1 ? 'lead' : 'leads'} ({item.conversion})
                            </span>
                            <span className={`font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(item.revenue)}
                            </span>
                          </div>

                          {/* Progress bar of percentage */}
                          <div
                            className={`w-full h-1.5 rounded-full mt-2.5 overflow-hidden ${
                              isSelected ? 'bg-indigo-700' : 'bg-gray-100'
                            }`}
                          >
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isSelected ? 'bg-white' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-400 text-xs">
                    <Globe className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                    No auto-segregated records found for this period.
                  </div>
                )}
              </div>

              {/* Side-by-Side: Pipeline Breakdown & Tasks Health */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dynamic Pipeline Breakdown */}
                <div className="bg-gray-50 rounded-2xl p-4 md:p-5 border border-gray-200 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                      <GitMerge className="w-4 h-4" /> Pipeline Stage Breakdown
                    </h4>

                    {stageEntries.length > 0 ? (
                      <div className="space-y-2.5 text-xs max-h-56 overflow-y-auto pr-1">
                        {stageEntries.map(([stageName, count]) => {
                          const totalForPct = metrics.leads > 0 ? metrics.leads : deals.length;
                          const pct = totalForPct > 0 ? Math.round((count / totalForPct) * 100) : 0;
                          return (
                            <div key={stageName} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium truncate max-w-[200px]" title={stageName}>
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

                  <div className="mt-3.5 pt-2.5 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                    <span>Total Deals Analyzed:</span>
                    <strong className="text-gray-900">{deals.length || metrics.leads}</strong>
                  </div>
                </div>

                {/* Tasks & Follow-up Health */}
                <div className="bg-gray-50 rounded-2xl p-4 md:p-5 border border-gray-200 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Follow-up & Activity Health
                    </h4>

                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                        <span className="text-gray-600">Tasks Due Today</span>
                        <span
                          className={`font-bold px-2.5 py-0.5 rounded border ${
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
                        <span className="font-bold text-gray-900 bg-white px-2.5 py-0.5 rounded border border-gray-200">
                          {metrics.tasksPending} Pending
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                        <span className="text-gray-600">Overdue Tasks</span>
                        <span
                          className={`font-bold px-2.5 py-0.5 rounded border flex items-center gap-1.5 ${
                            metrics.tasksOverdue > 0
                              ? 'text-rose-600 bg-rose-50 border-rose-200'
                              : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          {metrics.tasksOverdue > 0 ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" />
                              {metrics.tasksOverdue} Overdue
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
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

                  <div className="mt-3.5 pt-2.5 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                    <span>Task Backlog Status:</span>
                    <span
                      className={`font-bold ${
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
            <div className="space-y-4">
              {/* Search & Status Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={`Search deals, clients, stages, ${cleanSegLabel.toLowerCase()}...`}
                    value={dealSearch}
                    onChange={(e) => setDealSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Category Filter Dropdown if segregation items exist */}
                  {segregation.items && segregation.items.length > 0 && (
                    <div className="relative inline-block">
                      <select
                        value={selectedCategoryFilter || ''}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value || null)}
                        className="appearance-none bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl pl-3 pr-8 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="">All {cleanSegLabel}</option>
                        {segregation.items.map((it: any) => (
                          <option key={it.value} value={it.value}>
                            {it.value} ({it.leads})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs font-semibold">
                    <span className="text-gray-500 text-xs">Status:</span>
                    {(['all', 'won', 'open', 'lost'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setDealStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg uppercase text-[11px] font-bold transition-all ${
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
              </div>

              {/* Deals Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-[460px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-3.5">Deal / Opportunity</th>
                        <th className="py-3 px-3.5">Client Contact</th>
                        <th className="py-3 px-3.5">{cleanSegLabel}</th>
                        <th className="py-3 px-3.5">Pipeline Stage</th>
                        <th className="py-3 px-3.5">Status</th>
                        <th className="py-3 px-3.5 text-right">Value</th>
                        <th className="py-3 px-3.5 text-right">
                          {dateBasis === 'won' ? 'Won Date' : 'Created Date'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredDeals.length > 0 ? (
                        filteredDeals.map((d: any) => (
                          <tr key={d.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="py-3 px-3.5 font-bold text-gray-900">
                              <div className="truncate max-w-[200px]" title={d.name}>
                                {d.name || 'Untitled Opportunity'}
                              </div>
                              <div className="text-[10px] text-gray-400 font-normal">
                                {d.source || 'Direct'}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 text-gray-600">
                              <div className="font-semibold text-gray-900 truncate max-w-[160px]">
                                {d.contactName || 'No Name'}
                              </div>
                              {d.contactPhone && (
                                <div className="text-[10px] text-gray-400">{d.contactPhone}</div>
                              )}
                            </td>
                            <td className="py-3 px-3.5">
                              <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md text-[11px] truncate max-w-[150px]" title={d.customFieldValue || d.nationality}>
                                <CountryFlag nationality={d.customFieldValue || d.nationality || ''} className="w-3.5 h-2.5" />
                                <span className="truncate">{d.customFieldValue || d.nationality || 'Unspecified'}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-gray-600 truncate max-w-[140px]">
                              {d.stageName || 'Pipeline Stage'}
                            </td>
                            <td className="py-3 px-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
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
                            <td className="py-3 px-3.5 text-right font-black text-gray-900 text-sm">
                              {formatCurrency(d.monetaryValue || 0)}
                            </td>
                            <td className="py-3 px-3.5 text-right text-gray-500 font-medium">
                              {(d.wonAt || d.createdAt || '').slice(0, 10)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-gray-400">
                            <Briefcase className="w-9 h-9 mx-auto mb-2 text-gray-300" />
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
            <div className="space-y-4">
              <div className="text-xs text-gray-500 flex justify-between items-center">
                <span>Recent & Scheduled Client Consultations:</span>
                <span className="font-bold text-gray-900">{appointments.length} Meetings</span>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-[460px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-3.5">Meeting Title</th>
                        <th className="py-3 px-3.5">Client</th>
                        <th className="py-3 px-3.5">Type</th>
                        <th className="py-3 px-3.5">Status</th>
                        <th className="py-3 px-3.5 text-right">Scheduled Time</th>
                        <th className="py-3 px-3.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {appointments.length > 0 ? (
                        appointments.map((a: any) => (
                          <tr key={a.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="py-3 px-3.5 font-bold text-gray-900">
                              <div className="truncate max-w-[220px]" title={a.title}>
                                {a.title || 'Client Consultation'}
                              </div>
                              {a.calendarName && (
                                <div className="text-[10px] text-gray-400">{a.calendarName}</div>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-gray-600">
                              <div className="font-semibold text-gray-900">{a.clientName || 'Client'}</div>
                              {a.contactPhone && (
                                <div className="text-[10px] text-gray-400">{a.contactPhone}</div>
                              )}
                            </td>
                            <td className="py-3 px-3.5">
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
                            <td className="py-3 px-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
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
                            <td className="py-3 px-3.5 text-right text-gray-700 font-semibold whitespace-nowrap">
                              <div>{new Date(a.startTime).toLocaleDateString()}</div>
                              <div className="text-[10px] text-gray-400">
                                {new Date(a.startTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              {a.meetingUrl ? (
                                <a
                                  href={a.meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                                >
                                  Join <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-gray-400">
                            <CalendarDays className="w-9 h-9 mx-auto mb-2 text-gray-300" />
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
            <div className="space-y-4">
              <div className="text-xs text-gray-500 flex justify-between items-center">
                <span>Follow-up Tasks & Action Items:</span>
                <span className="font-bold text-gray-900">{tasks.length} Total Tasks</span>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-[460px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-3.5">Task Title / Details</th>
                        <th className="py-3 px-3.5">Related Contact</th>
                        <th className="py-3 px-3.5">Status</th>
                        <th className="py-3 px-3.5 text-right">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tasks.length > 0 ? (
                        tasks.map((t: any) => {
                          const isOverdue =
                            !t.completed && t.dueDate && new Date(t.dueDate) < new Date();
                          return (
                            <tr key={t.id} className="hover:bg-blue-50/40 transition-colors">
                              <td className="py-3 px-3.5 font-bold text-gray-900">
                                <div>{t.title || 'Follow-up Task'}</div>
                                {t.body && (
                                  <div className="text-[10px] text-gray-500 font-normal line-clamp-1">
                                    {t.body}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3.5 text-gray-600 font-semibold">
                                {t.contactName || 'Client'}
                              </td>
                              <td className="py-3 px-3.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
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
                              <td className="py-3 px-3.5 text-right whitespace-nowrap">
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
                          <td colSpan={4} className="py-16 text-center text-gray-400">
                            <ListTodo className="w-9 h-9 mx-auto mb-2 text-gray-300" />
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
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shrink-0">
          <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
            <span>Filtered by: <strong className="text-gray-800">{dateBasis === 'won' ? 'Won Date' : 'Created Date'}</strong> ({DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label || dateRange})</span>
            <span>·</span>
            <span>Segregated by: <strong className="text-indigo-700">{cleanSegLabel}</strong></span>
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
            >
              Close
            </button>

            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95 border border-slate-200"
              title="Export complete 360 data to CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
              title="Download executive PDF audit report"
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
