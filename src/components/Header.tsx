import React, { useState } from 'react';
import { 
  Bot, 
  Power, 
  Instagram, 
  Sun, 
  Moon, 
  Menu, 
  Play, 
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import type { DashboardStats } from '../types/index.ts';

interface HeaderProps {
  stats: DashboardStats | null;
  onToggleAI: () => void;
  onOpenSimulator: () => void;
  onOpenTesting: () => void;
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  onToggleAI,
  onOpenSimulator,
  onOpenTesting,
  onToggleSidebar,
  darkMode,
  onToggleTheme
}) => {
  const [confirmToggle, setConfirmToggle] = useState(false);
  const isAiOn = stats?.ai_automation_enabled ?? true;

  const handleAIToggleClick = () => {
    if (isAiOn) {
      setConfirmToggle(true);
    } else {
      onToggleAI();
    }
  };

  const handleConfirmTurnOff = () => {
    setConfirmToggle(false);
    onToggleAI();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 transition-colors">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Right: Hamburger + Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <span className="font-extrabold text-lg tracking-wider">V</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white tracking-wide">Vexora</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    AI Automation
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>نظام إدارة الرسائل الذكي</span>
                </div>
              </div>
            </div>
          </div>

          {/* Left: Quick Actions & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Instagram status badge */}
            <div className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border ${
              stats?.instagram_connected
                ? 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}>
              <Instagram className="w-3.5 h-3.5" />
              <span>{stats?.instagram_connected ? 'Instagram متصل' : 'Instagram وضع المحاكاة'}</span>
            </div>

            {/* Quick Test Lab Button */}
            <button
              onClick={onOpenTesting}
              className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>مختبر الفحص (10 Tests)</span>
            </button>

            {/* Open Simulator Modal */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-300 border border-pink-500/30 font-medium transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
              <span>محاكي إنستغرام</span>
            </button>

            {/* AI ON/OFF Toggle Switch */}
            <button
              onClick={handleAIToggleClick}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                isAiOn
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-sm shadow-emerald-500/10'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
              }`}
              title={isAiOn ? 'الذكاء الاصطناعي يعمل، اضغط للإيقاف' : 'الذكاء الاصطناعي متوقف، اضغط للتشغيل'}
            >
              <Power className={`w-3.5 h-3.5 ${isAiOn ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="hidden sm:inline">AI Automation:</span>
              <span>{isAiOn ? 'ON' : 'OFF'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Confirmation Dialog for Turning Off AI */}
      {confirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">إيقاف الرد الآلي للذكاء الاصطناعي؟</h4>
                <p className="text-xs text-slate-400">AI Automation Global Switch</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              عند إيقاف الـ AI، سيستمر النظام في استلام رسائل العملاء وحفظها، لكن <strong>لن يتم إرسال أي رد تلقائي</strong> للعميل حتى تعيد تفعيل النظام يدوياً.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmToggle(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmTurnOff}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-colors"
              >
                تأكيد إيقاف الـ AI
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
