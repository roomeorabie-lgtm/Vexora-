import React from 'react';
import { 
  Users, 
  MessageSquare, 
  Bot, 
  UserCheck, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  Instagram
} from 'lucide-react';
import type { DashboardStats, AutomationLog, Customer } from '../types/index.ts';

interface DashboardViewProps {
  stats: DashboardStats | null;
  logs: AutomationLog[];
  customers: Customer[];
  onNavigate: (tab: any) => void;
  onOpenSimulator: () => void;
  onOpenTesting: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  logs,
  customers,
  onNavigate,
  onOpenSimulator,
  onOpenTesting
}) => {
  const total = stats?.total_customers || 0;
  const newCount = stats?.new_customers || 0;
  const interested = stats?.interested_customers || 0;
  const converted = stats?.converted_customers || 0;
  const waiting = stats?.waiting_customers || 0;
  const humanRequired = stats?.human_required_count || 0;

  const totalMsgs = stats?.total_messages || 0;
  const aiMsgs = stats?.ai_responded_messages || 0;
  const automationRate = totalMsgs > 0 ? Math.round((aiMsgs / totalMsgs) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/20 p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>نظام الذكاء الاصطناعي شغال وبيرد تلقائياً باللهجة المصرية</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            مرحباً بك في لوحة تحكم أتمتة Vexora
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            النظام متصل ويقوم بإدارة رسائل Instagram Direct وتحليل نوايا العملاء وتحديد درجات الاهتمام (Lead Scoring) وتوليد ردود طبيعية مطابقة لقاعدة بيانات Vexora بدون أي اختلاق للأسعار أو الخدمات.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenSimulator}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-medium text-xs shadow-lg shadow-pink-500/20 flex items-center gap-2 transition-all"
            >
              <Instagram className="w-4 h-4" />
              <span>تجربة محاكاة رسالة عميل فورية</span>
            </button>
            <button
              onClick={onOpenTesting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-medium text-xs flex items-center gap-2 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>تشغيل فحص النظام الشامل (10 Tests)</span>
            </button>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute left-0 bottom-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div 
          onClick={() => onNavigate('customers')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">إجمالي العملاء المسجلين</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{total}</span>
            <span className="text-xs text-indigo-400 flex items-center gap-0.5">
              <span>عرض</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Interested Leads */}
        <div 
          onClick={() => onNavigate('customers')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">عملاء مهتمون (Interested)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{interested}</span>
            <span className="text-xs text-slate-400">Score &gt; 50%</span>
          </div>
        </div>

        {/* Human Required Alert */}
        <div 
          onClick={() => onNavigate('conversations')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">مطلوب تدخل موظف بشري</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">{humanRequired}</span>
            <span className="text-xs text-amber-400/90 font-medium">Human Handoff</span>
          </div>
        </div>

        {/* Converted */}
        <div 
          onClick={() => onNavigate('customers')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">صفقات ناجحة (Converted)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-400">{converted}</span>
            <span className="text-xs text-slate-400">تم التعاقد</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Automation Performance Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              كفاءة الرد الآلي للذكاء الاصطناعي
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
              {automationRate}% ردود ذكية
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>الرسائل التي تم الرد عليها تلقائياً:</span>
              <span className="font-semibold text-white">{aiMsgs} من {totalMsgs}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${automationRate}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/40">
              <span className="text-slate-400 block text-[11px]">متوسط سرعة الرد</span>
              <span className="font-bold text-slate-200">1.2 ثانية (فوري)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/40">
              <span className="text-slate-400 block text-[11px]">اللهجة المعتمدة</span>
              <span className="font-bold text-slate-200">مصرية ودودة طبيعية</span>
            </div>
          </div>
        </div>

        {/* Lead Stages Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            توزيع مراحل العملاء (Sales Pipeline)
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/30">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                عملاء جدد (New)
              </span>
              <span className="font-bold text-white">{newCount}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/30">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                عملاء مهتمون (Interested)
              </span>
              <span className="font-bold text-white">{interested}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/30">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                بانتظار التفاصيل (Waiting)
              </span>
              <span className="font-bold text-white">{waiting}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/30">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                تم التحويل لتعاقد (Converted)
              </span>
              <span className="font-bold text-white">{converted}</span>
            </div>
          </div>
        </div>

        {/* System Integrity & Safeguards */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            إجراءات الأمان الصارمة المطبقة
          </h3>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-2 rounded-xl bg-slate-800/40 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>منع الهلوسة واختلاق الأسعار:</strong> الـ AI ملتزم فقط بالأسعار والعروض المسجلة بقاعدة البيانات.
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/40 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>حظر تسريب الـ Prompt و الـ Keys:</strong> جدار حماية يفحص كل رد قبل إرساله إلى إنستغرام.
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/40 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>منع تكرار الردود (Deduplication):</strong> فحص معرفات الرسائل لحماية العميل من الردود المزدوجة.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Live Activity Feed */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <h3 className="text-sm font-bold text-white">سجل العمليات والأتمتة الحية (Live Activity Feed)</h3>
          </div>
          <button
            onClick={() => onNavigate('logs')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            عرض كافة السجلات
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            لا توجد سجلات بعد. يمكنك استخدام محاكي إنستغرام لإنشاء رسائل واختبار الردود التلقائية!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                      log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      log.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {log.event_type}
                    </span>
                    {log.instagram_username && (
                      <span className="font-semibold text-slate-200">
                        @{log.instagram_username}
                      </span>
                    )}
                    {log.intent && (
                      <span className="text-slate-400">
                        [{log.intent}]
                      </span>
                    )}
                  </div>
                  {log.message_snippet && (
                    <p className="text-slate-300 font-normal line-clamp-1 max-w-xl">
                      "{log.message_snippet}"
                    </p>
                  )}
                </div>

                <div className="text-right text-[11px] text-slate-500 shrink-0">
                  {new Date(log.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
