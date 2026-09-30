import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Briefcase,
  DollarSign,
  Tag,
  Bot,
  Instagram,
  Settings,
  ScrollText,
  ShieldCheck,
  BookOpen,
  UserCheck,
  X
} from 'lucide-react';
import type { DashboardStats } from '../types/index.ts';

export type NavItemKey =
  | 'dashboard'
  | 'conversations'
  | 'customers'
  | 'services'
  | 'pricing'
  | 'offers'
  | 'ai-settings'
  | 'instagram-setup'
  | 'system-settings'
  | 'logs'
  | 'testing-lab'
  | 'deployment-guide';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpen: boolean;
  onClose: () => void;
  stats: DashboardStats | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  stats
}) => {
  const navItems: Array<{
    key: NavItemKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    {
      key: 'dashboard',
      label: 'لوحة القيادة',
      icon: LayoutDashboard
    },
    {
      key: 'conversations',
      label: 'صندوق المحادثات',
      icon: MessageSquare,
      badge: stats?.human_required_count ? `${stats.human_required_count} مطلوب` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    },
    {
      key: 'customers',
      label: 'العملاء وإدارة الليدز',
      icon: Users,
      badge: stats?.total_customers ? stats.total_customers : undefined
    },
    {
      key: 'services',
      label: 'إدارة الخدمات',
      icon: Briefcase
    },
    {
      key: 'pricing',
      label: 'إدارة الأسعار (Zero Hallucination)',
      icon: DollarSign
    },
    {
      key: 'offers',
      label: 'العروض الترويجية',
      icon: Tag
    },
    {
      key: 'ai-settings',
      label: 'إعدادات الـ AI واللهجة المصرية',
      icon: Bot
    },
    {
      key: 'instagram-setup',
      label: 'ربط إنستغرام وميتا API',
      icon: Instagram
    },
    {
      key: 'logs',
      label: 'سجلات الأتمتة المباشرة',
      icon: ScrollText
    },
    {
      key: 'testing-lab',
      label: 'مختبر الفحص (10 Tests)',
      icon: ShieldCheck,
      badge: 'فحص آلي',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
    },
    {
      key: 'deployment-guide',
      label: 'دليل النشر والتكامل السريع',
      icon: BookOpen
    },
    {
      key: 'system-settings',
      label: 'إعدادات النظام العامة',
      icon: Settings
    }
  ];

  const handleItemClick = (key: NavItemKey) => {
    onSelectTab(key);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Header in mobile */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
              V
            </div>
            <span className="font-bold text-white">Vexora Automation</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            القائمة الرئيسية
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleItemClick(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Vexora Brand Summary */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">Vexora Engine v1.0</div>
              <div className="text-[10px] text-slate-400">Gemini 3.8 Flash • Meta API</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
