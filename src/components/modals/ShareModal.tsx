'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  Globe,
  Lock,
  Trash2,
  Loader2,
  Link2,
  RefreshCw,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  locationId: string | null;
  locationName: string;
  dateRange: string;
  dateBasis: string;
  pipelineId: string;
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function ShareModal({
  isOpen,
  locationId,
  locationName,
  dateRange,
  dateBasis,
  pipelineId,
  onClose,
  onToast,
}: ShareModalProps) {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Compute the public share URL
  const shareUrl = shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}`
    : '';

  // Load existing share on open
  useEffect(() => {
    if (!isOpen || !locationId) return;

    setIsLoading(true);
    fetch(`/api/shares?locationId=${locationId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.token) {
          setShareToken(json.token);
        } else {
          setShareToken(null);
        }
      })
      .catch(() => setShareToken(null))
      .finally(() => setIsLoading(false));
  }, [isOpen, locationId]);

  const handleCreateShare = async () => {
    if (!locationId) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          title: `${locationName} — Live KPI Dashboard`,
          dateRange,
          dateBasis,
          pipelineId,
          agentId: 'all',
        }),
      });
      const json = await res.json();
      if (json.success && json.token) {
        setShareToken(json.token);
        onToast('Public share link created! Anyone with the link can view this dashboard.', 'success');
      } else {
        onToast('Failed to create share link: ' + json.error, 'error');
      }
    } catch (err: any) {
      onToast('Network error creating share: ' + err.message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!locationId) return;
    if (!confirm('Revoke this share link? Anyone using it will lose access immediately.')) return;
    setIsRevoking(true);
    try {
      const res = await fetch('/api/shares', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId }),
      });
      const json = await res.json();
      if (json.success) {
        setShareToken(null);
        onToast('Share link revoked. The link is now disabled.', 'info');
      }
    } catch (err: any) {
      onToast('Error revoking share: ' + err.message, 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRegenerateShare = async () => {
    if (!locationId) return;
    if (!confirm('Regenerate share link? The old link will stop working.')) return;
    // Revoke first, then create new
    setIsCreating(true);
    try {
      // Disable old one
      await fetch('/api/shares', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId }),
      });
      // Create new
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          title: `${locationName} — Live KPI Dashboard`,
          dateRange,
          dateBasis,
          pipelineId,
          agentId: 'all',
        }),
      });
      const json = await res.json();
      if (json.success && json.token) {
        setShareToken(json.token);
        onToast('Share link regenerated. Old link is now disabled.', 'success');
      }
    } catch (err: any) {
      onToast('Error regenerating share: ' + err.message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onToast('Share link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Share Dashboard Publicly</h2>
              <p className="text-[11px] text-blue-200 mt-0.5">
                {locationName} · Read-only public view
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500 ml-2">Checking share status...</span>
            </div>
          ) : shareToken ? (
            /* Share is Active */
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                <Globe className="w-4 h-4" />
                <span>Share link is ACTIVE — anyone with the link can view this dashboard</span>
              </div>

              {/* URL Box */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">
                  Public Share URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2 overflow-hidden">
                    <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-xs text-gray-700 font-mono truncate">{shareUrl}</span>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`shrink-0 px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                      copied
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Open in new tab */}
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                Open Public Dashboard in New Tab
              </a>

              {/* Security info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Privacy & Security Guarantees
                </div>
                <ul className="space-y-0.5 text-amber-700 ml-4 list-disc">
                  <li>Private API keys are <strong>never</strong> exposed on the public page</li>
                  <li>Admin settings and credentials are completely hidden</li>
                  <li>Public viewers get read-only access — no editing possible</li>
                  <li>Revoke the link at any time to instantly disable access</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleRegenerateShare}
                  disabled={isCreating}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  {isCreating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Regenerate Link
                </button>
                <button
                  onClick={handleRevokeShare}
                  disabled={isRevoking}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all ml-auto"
                >
                  {isRevoking ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Revoke Access
                </button>
              </div>
            </div>
          ) : (
            /* Share is not active yet */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                <Lock className="w-4 h-4 text-gray-400" />
                <span>No public share link exists yet for this dashboard</span>
              </div>

              {/* Benefits */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-gray-700">Create a public link to:</p>
                <ul className="space-y-2 text-xs text-gray-600">
                  {[
                    '📺 Display on a TV screen in the office with live data',
                    '👔 Share with management, investors, or clients',
                    '🔗 Embed in reports or Slack channels',
                    '🌐 Access from any device without logging in',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Privacy note */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-800">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Lock className="w-3 h-3" /> 100% Secure — Private Keys Never Shared
                </div>
                The public dashboard shows live KPI metrics only. API credentials and admin settings are
                completely hidden from public viewers.
              </div>

              <button
                onClick={handleCreateShare}
                disabled={isCreating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Share Link...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    Generate Public Share Link
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
