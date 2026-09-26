'use client';

import React from 'react';
import {
  Zap,
  LayoutDashboard,
  BarChart3,
  GitMerge,
  CheckSquare,
  Users,
  Settings,
  Calendar,
} from 'lucide-react';
import { useLocationContext } from '@/context/LocationContext';

interface SidebarProps {
  activeSection?: string;
  onNavigate?: (section: string) => void;
  onOpenTasks?: () => void;
  onOpenCalendar?: () => void;
}

export default function Sidebar({
  activeSection = 'dashboard',
  onNavigate,
  onOpenTasks,
  onOpenCalendar,
}: SidebarProps) {
  const { setIsSettingsModalOpen } = useLocationContext();

  const handleNav = (section: string) => {
    if (section === 'tasks') {
      if (onOpenTasks) {
        onOpenTasks();
        return;
      }
    }
    if (section === 'calendar') {
      const el = document.getElementById('meetings-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        if (onNavigate) onNavigate('calendar');
        return;
      }
      if (onOpenCalendar) {
        onOpenCalendar();
        return;
      }
    }
    if (onNavigate) {
      onNavigate(section);
    } else {
      const el = document.getElementById(`${section}-section`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else if (section === 'dashboard') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <aside className="w-16 lg:w-20 bg-white border-r border-gray-200 flex flex-col items-center py-5 shrink-0 select-none z-30 sticky top-0 h-screen">
      {/* Brand Icon */}
      <div
        onClick={() => handleNav('dashboard')}
        className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 mb-8 cursor-pointer hover:bg-blue-700 transition-colors"
        title="Sales Command Center"
      >
        <Zap className="w-5 h-5" />
      </div>

      {/* Main Nav */}
      <nav className="flex flex-col items-center gap-4 w-full px-2">
        <button
          onClick={() => handleNav('dashboard')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            activeSection === 'dashboard'
              ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10'
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          }`}
          title="Sales Dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleNav('analytics')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            activeSection === 'analytics'
              ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10'
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          }`}
          title="Lead Source & Analytics"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleNav('pipelines')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            activeSection === 'pipelines'
              ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10'
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          }`}
          title="Pipeline Funnel & Stages"
        >
          <GitMerge className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleNav('tasks')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            activeSection === 'tasks'
              ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10'
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          }`}
          title="Tasks & Bottlenecks Action Modal"
        >
          <CheckSquare className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleNav('team')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            activeSection === 'team'
              ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10'
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          }`}
          title="Sales Team & Agent Performance"
        >
          <Users className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleNav('calendar')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            activeSection === 'calendar'
              ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-500/10'
              : 'text-gray-400 hover:bg-gray-50 hover:text-indigo-600'
          }`}
          title="Appointment Calendar & Schedule"
        >
          <Calendar className="w-5 h-5" />
        </button>
      </nav>

      {/* Bottom Settings Button */}
      <div className="mt-auto flex flex-col items-center gap-4">
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="w-12 h-12 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-blue-600 flex items-center justify-center transition-all"
          title="Sub-Account & API Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
