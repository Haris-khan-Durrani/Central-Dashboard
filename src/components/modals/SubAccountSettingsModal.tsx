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
} from 'lucide-react';
import { useLocationContext, LocationItem } from '@/context/LocationContext';

interface SubAccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
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
    enableCallStats: false,
  });

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
      enableCallStats: false,
    });
    setTestResult(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (loc: LocationItem) => {
    setIsEditing(true);
    setEditingLocId(loc.locationId);
    setFormData({
      locationId: loc.locationId,
      name: loc.name,
      privateKey: '', // Leave blank unless updating
      currency: loc.currency,
      timezone: loc.timezone,
      enableCallStats: false,
    });
    setTestResult(null);
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setEditingLocId(null);
    setTestResult(null);
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
      if (isEditing && editingLocId) {
        // PUT update
        const res = await fetch(`/api/locations/${editingLocId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            currency: formData.currency,
            timezone: formData.timezone,
            privateKey: formData.privateKey || undefined,
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
          body: JSON.stringify(formData),
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
