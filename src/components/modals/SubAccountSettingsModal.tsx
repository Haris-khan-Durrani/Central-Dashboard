'use client';

import React, { useState } from 'react';
import {
  X,
  Building2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Plus,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Trash2,
  Users,
  Calendar,
  Search,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Target,
} from 'lucide-react';
import { useLocationContext, LocationItem } from '@/context/LocationContext';

interface SubAccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export interface DiscoveredAgent {
  ghlUserId: string;
  name: string;
  email: string | null;
  role: string;
  avatarUrl: string | null;
  isActive: boolean;
  targetRevenue?: number;
}

export interface DiscoveredCalendar {
  id: string;
  name: string;
  calendarType?: string;
  description?: string;
  isSelected: boolean;
}

export default function SubAccountSettingsModal({
  isOpen,
  onClose,
  onToast,
}: SubAccountSettingsModalProps) {
  const {
    locations,
    activeLocationId,
    setActiveLocationId,
    refreshLocations,
  } = useLocationContext();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLocId, setEditingLocId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    locationId: '',
    name: '',
    privateKey: '',
    currency: 'AED',
    timezone: 'Asia/Dubai',
    enableBookings: true,
    enableCallStats: false,
  });

  const [discoveredAgents, setDiscoveredAgents] = useState<DiscoveredAgent[]>([]);
  const [agentSearch, setAgentSearch] = useState('');
  const [bulkTargetInput, setBulkTargetInput] = useState<number>(50000);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  const [discoveredCalendars, setDiscoveredCalendars] = useState<DiscoveredCalendar[]>([]);
  const [trackAllCalendars, setTrackAllCalendars] = useState(true);
  const [calendarSearch, setCalendarSearch] = useState('');
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingLocId(null);
    setFormData({
      locationId: '',
      name: '',
      privateKey: '',
      currency: 'AED',
      timezone: 'Asia/Dubai',
      enableBookings: true,
      enableCallStats: false,
    });
    setDiscoveredAgents([]);
    setAgentSearch('');
    setDiscoveredCalendars([]);
    setTrackAllCalendars(true);
    setCalendarSearch('');
    setTestResult(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = async (loc: LocationItem) => {
    setIsEditing(true);
    setEditingLocId(loc.locationId);
    setFormData({
      locationId: loc.locationId,
      name: loc.name,
      privateKey: '', // Leave blank unless updating
      currency: loc.currency,
      timezone: loc.timezone,
      enableBookings: loc.enableBookings !== false,
      enableCallStats: false,
    });
    setDiscoveredAgents([]);
    setAgentSearch('');
    setDiscoveredCalendars([]);
    setTrackAllCalendars(true);
    setCalendarSearch('');
    setTestResult(null);
    setIsFormOpen(true);

    // Fetch existing agents from DB for this location
    setIsLoadingAgents(true);
    try {
      const res = await fetch(`/api/locations/${loc.locationId}/agents`);
      const data = await res.json();
      if (data.success && Array.isArray(data.agents)) {
        setDiscoveredAgents(
          data.agents.map((a: any) => ({
            ghlUserId: a.ghlUserId,
            name: a.name,
            email: a.email,
            role: a.role,
            avatarUrl: a.avatarUrl,
            isActive: a.isActive !== false,
            targetRevenue: a.targetRevenue ?? 50000,
          }))
        );
      }
    } catch (e) {
      console.error('Error fetching agents for location:', e);
    } finally {
      setIsLoadingAgents(false);
    }

    // Fetch existing calendars from DB / GHL for this location
    setIsLoadingCalendars(true);
    try {
      const res = await fetch(`/api/locations/${loc.locationId}/calendars`);
      const data = await res.json();
      if (data.success && Array.isArray(data.calendars)) {
        setDiscoveredCalendars(
          data.calendars.map((c: any) => ({
            id: c.id,
            name: c.name,
            calendarType: c.calendarType,
            description: c.description,
            isSelected: c.isSelected !== false,
          }))
        );
        setTrackAllCalendars(
          data.selectedAll !== false &&
            (!data.selectedCalendarIds || data.selectedCalendarIds.length === 0)
        );
      }
    } catch (e) {
      console.error('Error fetching calendars for location:', e);
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setEditingLocId(null);
    setDiscoveredAgents([]);
    setAgentSearch('');
    setDiscoveredCalendars([]);
    setTrackAllCalendars(true);
    setCalendarSearch('');
    setTestResult(null);
  };

  const handleToggleAgent = (ghlUserId: string) => {
    setDiscoveredAgents((prev) =>
      prev.map((a) => (a.ghlUserId === ghlUserId ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const handleSelectAllAgents = (select: boolean) => {
    setDiscoveredAgents((prev) => prev.map((a) => ({ ...a, isActive: select })));
  };

  const handleUpdateAgentTarget = (ghlUserId: string, targetRevenue: number) => {
    setDiscoveredAgents((prev) =>
      prev.map((a) => (a.ghlUserId === ghlUserId ? { ...a, targetRevenue } : a))
    );
  };

  const handleApplyBulkTarget = () => {
    setDiscoveredAgents((prev) =>
      prev.map((a) => ({ ...a, targetRevenue: bulkTargetInput }))
    );
    onToast(`Applied ${bulkTargetInput.toLocaleString()} ${formData.currency || 'AED'} target to all agents.`);
  };

  const handleToggleCalendar = (id: string) => {
    setDiscoveredCalendars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isSelected: !c.isSelected } : c))
    );
  };

  const handleSelectAllCalendars = (select: boolean) => {
    setDiscoveredCalendars((prev) => prev.map((c) => ({ ...c, isSelected: select })));
  };

  const handleTestConnection = async () => {
    const locId = formData.locationId.trim();
    if (!locId) {
      setTestResult({
        success: false,
        message: 'Please provide Location ID first.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`/api/locations/${locId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey: formData.privateKey || undefined }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Connected successfully!' : data.error || 'Connection failed'),
      });

      if (data.success && Array.isArray(data.agents)) {
        // Merge with existing discoveredAgents to keep any active toggles & targets
        setDiscoveredAgents((prev) => {
          const prevMap = new Map(
            prev.map((a) => [a.ghlUserId, { isActive: a.isActive, targetRevenue: a.targetRevenue }])
          );
          return data.agents.map((a: any) => {
            const existing = prevMap.get(a.ghlUserId);
            return {
              ghlUserId: a.ghlUserId,
              name: a.name,
              email: a.email,
              role: a.role,
              avatarUrl: a.avatarUrl,
              isActive: existing ? existing.isActive : a.isActive !== false,
              targetRevenue: existing?.targetRevenue ?? a.targetRevenue ?? 50000,
            };
          });
        });
      }

      if (data.success && Array.isArray(data.calendars)) {
        setDiscoveredCalendars((prev) => {
          const prevMap = new Map(prev.map((c) => [c.id, c.isSelected]));
          return data.calendars.map((c: any) => ({
            id: c.id,
            name: c.name,
            calendarType: c.calendarType,
            description: c.description,
            isSelected: prevMap.has(c.id)
              ? (prevMap.get(c.id) as boolean)
              : c.isSelected !== false,
          }));
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error testing connection',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSubAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const selectedCalendarIds = trackAllCalendars
        ? null
        : discoveredCalendars.filter((c) => c.isSelected).map((c) => c.id);

      if (isEditing && editingLocId) {
        // PUT update
        const res = await fetch(`/api/locations/${editingLocId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            currency: formData.currency,
            timezone: formData.timezone,
            enableBookings: formData.enableBookings,
            selectedCalendarIds,
            privateKey: formData.privateKey || undefined,
            agents: discoveredAgents,
          }),
        });
        const data = await res.json();
        if (data.success) {
          onToast(`Sub-account "${formData.name}" updated successfully!`);
          await refreshLocations();
          handleCancelForm();
        } else {
          alert(data.error || 'Failed to update sub-account');
        }
      } else {
        // POST create
        if (!formData.privateKey) {
          alert('Private Integration Key is required for new sub-accounts.');
          setIsSaving(false);
          return;
        }

        const res = await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            selectedCalendarIds,
            agents: discoveredAgents,
          }),
        });
        const data = await res.json();
        if (data.success) {
          onToast(`Sub-account "${formData.name}" added successfully!`);
          await refreshLocations();
          setActiveLocationId(formData.locationId);
          handleCancelForm();
        } else {
          alert(data.error || 'Failed to save sub-account');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error saving sub-account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubAccount = async (loc: LocationItem) => {
    if (locations.length <= 1) {
      alert('You must have at least one configured sub-account in the system.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${loc.name}" (${loc.locationId})?\n\nThis will remove its credentials, pipelines, tasks, and historical reporting from the central database.`
    );
    if (!confirmed) return;

    setIsDeleting(loc.locationId);
    try {
      const res = await fetch(`/api/locations/${loc.locationId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        onToast(`Sub-account "${loc.name}" deleted.`);
        await refreshLocations();
        // If active location was deleted, pick another
        if (loc.locationId === activeLocationId) {
          const remaining = locations.filter((l) => l.locationId !== loc.locationId);
          if (remaining.length > 0) {
            setActiveLocationId(remaining[0].locationId);
          }
        }
      } else {
        alert(data.error || 'Failed to delete sub-account');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting sub-account');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSyncLocation = async (locId: string) => {
    setIsSyncing(locId);
    try {
      const res = await fetch(`/api/locations/${locId}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onToast(data.message || 'Data synchronized successfully!');
        await refreshLocations();
      } else {
        alert(data.error || data.message || 'Sync failed');
      }
    } catch (err: any) {
      alert(err.message || 'Sync error');
    } finally {
      setIsSyncing(null);
    }
  };

  const currentWebhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/ghl/${activeLocationId}`
    : `/api/webhooks/ghl/${activeLocationId}`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(currentWebhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
    onToast('Webhook endpoint copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl p-6 md:p-8 border border-gray-200 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-gray-100">
          <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Sub-Account Management & GHL Credentials
            </h2>
            <p className="text-xs text-gray-500">
              Manage independent GoHighLevel sub-accounts with private integration tokens, custom currencies, and isolated dashboards.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Sub-Accounts List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Configured Sub-Accounts ({locations.length})
              </h3>
              {!isFormOpen && (
                <button
                  onClick={handleOpenAdd}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sub-Account</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {locations.map((loc) => {
                const isCurrent = loc.locationId === activeLocationId;
                return (
                  <div
                    key={loc.locationId}
                    className={`rounded-2xl p-4 border transition-all relative group/card ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50/40 shadow-sm'
                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-gray-900 truncate" title={loc.name}>
                            {loc.name}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full shrink-0">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5 truncate">
                          ID: {loc.locationId}
                        </p>
                      </div>

                      {/* Currency badge & Edit/Delete Action Icons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-2 py-0.5 bg-white border border-gray-200 text-xs font-bold rounded-lg text-gray-700">
                          {loc.currency}
                        </span>
                        <button
                          onClick={() => handleOpenEdit(loc)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-white transition-colors"
                          title="Edit Sub-Account Settings"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubAccount(loc)}
                          disabled={isDeleting === loc.locationId}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-white transition-colors"
                          title="Delete Sub-Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1 mb-3">
                      <div className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-mono text-gray-700">{loc.keyHint || '••••••••'}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          Encrypted
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">
                        Timezone: <span className="text-gray-700 font-medium">{loc.timezone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60">
                      {!isCurrent && (
                        <button
                          onClick={() => {
                            setActiveLocationId(loc.locationId);
                            onToast(`Switched dashboard to ${loc.name}`);
                          }}
                          className="flex-1 py-1.5 px-2.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition-colors active:scale-95"
                        >
                          Select Dashboard
                        </button>
                      )}
                      <button
                        onClick={() => handleSyncLocation(loc.locationId)}
                        disabled={isSyncing === loc.locationId}
                        className="py-1.5 px-2.5 bg-white hover:bg-gray-100 text-blue-600 text-xs font-semibold rounded-xl border border-gray-200 transition-colors flex items-center gap-1 active:scale-95"
                        title="Sync now with GHL"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            isSyncing === loc.locationId ? 'animate-spin' : ''
                          }`}
                        />
                        <span>Sync</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add / Edit Sub-Account Form Panel */}
          {isFormOpen && (
            <div className="bg-gray-50 rounded-2xl p-5 border border-blue-200 shadow-sm animate-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  {isEditing ? `Edit Sub-Account: ${formData.name}` : 'Add New Sub-Account'}
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveSubAccount} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Sub-Account Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dubai Business Setup"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      GHL Location ID *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7qK9mPxR8vL2..."
                      value={formData.locationId}
                      readOnly={isEditing}
                      onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                      required
                      className={`w-full px-3 py-2 rounded-xl border font-mono ${
                        isEditing
                          ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                          : 'bg-white border-gray-200 focus:outline-none focus:border-blue-500'
                      }`}
                    />
                    {isEditing && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Location ID is immutable.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Private Integration Key (API Token) {isEditing ? '(Optional)' : '*'}
                  </label>
                  <input
                    type="password"
                    placeholder={
                      isEditing
                        ? 'Leave blank to keep existing encrypted key'
                        : 'pit-xxxxxxxxxxxxxxxxxxxxxxxx'
                    }
                    value={formData.privateKey}
                    onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                    required={!isEditing}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Stored securely using AES-256-GCM encryption with local hardware key.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Currency Code</label>
                    <input
                      type="text"
                      placeholder="e.g. AED, USD, EUR"
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 uppercase font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Timezone</label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Asia/Dubai">Asia/Dubai (GST +4)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Riyadh">Asia/Riyadh (AST +3)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>

                {/* Track Call & WhatsApp Activity Toggle */}
                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableCallStats}
                      onChange={(e) =>
                        setFormData({ ...formData, enableCallStats: e.target.checked })
                      }
                      className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-semibold text-gray-800 text-xs">
                        Track Call & WhatsApp Activity (GHL Dialer)
                      </div>
                      <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
                        Leave unchecked if your sales team does not use the GoHighLevel dialer. When unchecked, call & WhatsApp stats are hidden from agent cards.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Bookings & Calendar Tracking Toggle */}
                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableBookings}
                      onChange={(e) =>
                        setFormData({ ...formData, enableBookings: e.target.checked })
                      }
                      className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-semibold text-gray-800 text-xs flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Enable Bookings & Calendar Tracking</span>
                      </div>
                      <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
                        Syncs calendar appointments and shows booking metrics on agent cards and in the upcoming bookings popup on the status bar.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Calendar Configuration Panel */}
                {formData.enableBookings && (
                  <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                      <div>
                        <div className="font-bold text-gray-900 text-xs flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span>Calendar Selection</span>
                          {!trackAllCalendars && discoveredCalendars.length > 0 && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-extrabold rounded-full border border-blue-100">
                              {discoveredCalendars.filter((c) => c.isSelected).length} of {discoveredCalendars.length} selected
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Configure which calendars are monitored for bookings & appointments.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl shrink-0">
                        <button
                          type="button"
                          onClick={() => setTrackAllCalendars(true)}
                          className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                            trackAllCalendars
                              ? 'bg-white text-blue-600 shadow-sm font-bold'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          All Calendars
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrackAllCalendars(false)}
                          className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                            !trackAllCalendars
                              ? 'bg-white text-blue-600 shadow-sm font-bold'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Specific Calendars
                        </button>
                      </div>
                    </div>

                    {trackAllCalendars ? (
                      <div className="space-y-2">
                        <div className="py-2.5 px-3 bg-blue-50/50 rounded-xl border border-blue-100/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-xs text-blue-800 font-medium">
                              Tracking all active & future calendars in this sub-account ({discoveredCalendars.length} discovered).
                            </span>
                          </div>
                          {discoveredCalendars.length === 0 && (
                            <button
                              type="button"
                              onClick={handleTestConnection}
                              disabled={isTesting}
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline"
                            >
                              Discover Calendars
                            </button>
                          )}
                        </div>
                        {discoveredCalendars.length === 0 && (
                          <div className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                            <span className="text-sm shrink-0">💡</span>
                            <div>
                              <span className="font-bold">GHL Permission Tip:</span> To enable automatic calendar discovery and live bookings, make sure your HighLevel Private Integration Token has the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">calendars.readonly</code> scope checked.
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-gray-500 font-medium">
                            Check the specific calendars to display on this dashboard:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSelectAllCalendars(true)}
                              className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectAllCalendars(false)}
                              className="px-2 py-0.5 text-[10px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>

                        {discoveredCalendars.length > 4 && (
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              placeholder="Search calendars by name..."
                              value={calendarSearch}
                              onChange={(e) => setCalendarSearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                            />
                          </div>
                        )}

                        {isLoadingCalendars ? (
                          <div className="py-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                            <span>Loading calendars...</span>
                          </div>
                        ) : discoveredCalendars.length === 0 ? (
                          <div className="py-4 text-center text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p>No calendars loaded yet.</p>
                            <button
                              type="button"
                              onClick={handleTestConnection}
                              disabled={isTesting}
                              className="mt-1.5 px-3 py-1 bg-white hover:bg-gray-100 text-blue-600 text-xs font-bold rounded-lg border border-gray-200 shadow-sm"
                            >
                              Test Connection to Load Calendars
                            </button>
                          </div>
                        ) : (
                          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-50">
                            {discoveredCalendars
                              .filter((c) => !calendarSearch || c.name.toLowerCase().includes(calendarSearch.toLowerCase()))
                              .map((cal) => (
                                <div
                                  key={cal.id}
                                  onClick={() => handleToggleCalendar(cal.id)}
                                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${
                                    cal.isSelected
                                      ? 'bg-blue-50/40 border-blue-200/60 hover:bg-blue-50/70'
                                      : 'bg-gray-50/60 border-transparent hover:bg-gray-100/70 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={cal.isSelected}
                                      onChange={() => {}} // handled by click
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                                    />
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-gray-900 truncate">
                                        {cal.name}
                                      </div>
                                      {cal.description && (
                                        <div className="text-[10px] text-gray-500 truncate">
                                          {cal.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-md shrink-0 uppercase tracking-wider">
                                    {cal.calendarType || 'Standard'}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Connection Test Result */}
                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                {/* Agent Visibility & Target Revenue Configuration Panel */}
                {(discoveredAgents.length > 0 || isLoadingAgents) && (
                  <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                      <div>
                        <div className="font-bold text-gray-900 text-xs flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>Sales Agents & Revenue Targets</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-extrabold rounded-full border border-blue-100">
                            {discoveredAgents.filter((a) => a.isActive).length} of {discoveredAgents.length} visible
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Set custom monthly revenue targets for each sales rep and select who appears on the Central Dashboard.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSelectAllAgents(true)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Select All</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectAllAgents(false)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <UserX className="w-3 h-3" />
                          <span>Deselect All</span>
                        </button>
                      </div>
                    </div>

                    {/* Bulk Set Target Helper Bar */}
                    {discoveredAgents.length > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-blue-50/70 rounded-xl border border-blue-200/80 text-xs">
                        <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-[11px]">
                          <Target className="w-3.5 h-3.5 text-blue-600" />
                          <span>Bulk Set Target for All Reps:</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center bg-white border border-blue-200 rounded-lg px-2 py-1 shadow-2xs">
                            <span className="text-[10px] font-bold text-gray-400 mr-1.5 uppercase">
                              {formData.currency || 'AED'}
                            </span>
                            <input
                              type="number"
                              value={bulkTargetInput}
                              onChange={(e) => setBulkTargetInput(Number(e.target.value))}
                              className="w-24 text-xs font-bold text-gray-800 bg-transparent focus:outline-none text-right"
                              step={5000}
                              min={0}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleApplyBulkTarget}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all active:scale-95 shadow-2xs"
                          >
                            Apply to All
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Search filter for agents */}
                    {discoveredAgents.length > 4 && (
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Filter agents by name or email..."
                          value={agentSearch}
                          onChange={(e) => setAgentSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                        />
                      </div>
                    )}

                    {isLoadingAgents ? (
                      <div className="py-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading team members...</span>
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-gray-50">
                        {discoveredAgents
                          .filter(
                            (a) =>
                              !agentSearch ||
                              a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
                              (a.email && a.email.toLowerCase().includes(agentSearch.toLowerCase()))
                          )
                          .map((agent) => (
                            <div
                              key={agent.ghlUserId}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl transition-all border gap-2.5 ${
                                agent.isActive
                                  ? 'bg-blue-50/40 border-blue-200/60 hover:bg-blue-50/70'
                                  : 'bg-gray-50/60 border-gray-200/50 hover:bg-gray-100/70 opacity-60'
                              }`}
                            >
                              {/* Left: Checkbox + Avatar + Name & Email */}
                              <div
                                onClick={() => handleToggleAgent(agent.ghlUserId)}
                                className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={agent.isActive}
                                  onChange={() => handleToggleAgent(agent.ghlUserId)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <img
                                  src={
                                    agent.avatarUrl ||
                                    `https://placehold.co/80x80/e2e8f0/1e293b?text=${agent.name.slice(0, 2)}`
                                  }
                                  alt={agent.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://placehold.co/80x80/e2e8f0/1e293b?text=${agent.name.slice(0, 2)}`;
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-gray-900 truncate">
                                    {agent.name}
                                  </div>
                                  <div className="text-[10px] text-gray-500 truncate">
                                    {agent.role || 'Sales Consultant'} {agent.email ? `• ${agent.email}` : ''}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Individual Target Revenue Input & Visibility Toggle */}
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                {/* Custom Target Input */}
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2 py-1 shadow-2xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20"
                                >
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                                    Target ({formData.currency || 'AED'}):
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    step={5000}
                                    value={agent.targetRevenue ?? 50000}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                      handleUpdateAgentTarget(agent.ghlUserId, Number(e.target.value))
                                    }
                                    className="w-24 text-xs font-bold text-gray-800 text-right bg-transparent focus:outline-none"
                                    title="Set individual monthly revenue target for this sales consultant"
                                  />
                                </div>

                                {/* Visibility Toggle Badge */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleAgent(agent.ghlUserId)}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-lg shrink-0 flex items-center gap-1 transition-colors ${
                                    agent.isActive
                                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  }`}
                                >
                                  {agent.isActive ? (
                                    <>
                                      <Eye className="w-3 h-3 text-emerald-600" />
                                      <span>Visible</span>
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="w-3 h-3 text-gray-400" />
                                      <span>Hidden</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold rounded-xl transition-all flex items-center gap-2 active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center gap-1.5"
                    >
                      <span>
                        {isSaving
                          ? 'Saving...'
                          : isEditing
                          ? 'Update Sub-Account'
                          : 'Save Sub-Account'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Webhook Configuration for Active Sub-Account */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>GoHighLevel Webhook Setup for Current Sub-Account</span>
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              Add this Webhook URL inside GoHighLevel sub-account automation or settings to receive instant &lt;15ms delta updates:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentWebhookUrl}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 select-all"
              />
              <button
                onClick={handleCopyWebhook}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                {copiedWebhook ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
