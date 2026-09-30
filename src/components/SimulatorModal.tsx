import React, { useState } from 'react';
import { Send, Bot, CheckCircle, AlertTriangle, UserCheck, Sparkles, RefreshCw, X } from 'lucide-react';
import { api } from '../services/api.ts';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({ isOpen, onClose, onRefreshData }) => {
  const [username, setUsername] = useState('ahmed_business');
  const [message, setMessage] = useState('عايز أعرف تفاصيل وأسعار تصميم متجر إلكتروني للملابس');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.simulateIncoming(username, message);
      setLastResult(res);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setError(err.message || 'فشل تشغيل المحاكاة');
    } finally {
      setLoading(false);
    }
  };

  const sampleMessages = [
    'عايز أعمل متجر إلكتروني لمحل ملابس',
    'بكام الموقع التعريفي للشركات؟',
    'عندكم عرض الدومين المجاني؟',
    'ممكن أكلم حد من المبيعات ضروري؟',
    'عايز صفحة هبوط لمنتج واحد بيبدأ من كام؟'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                محاكي رسائل إنستغرام المباشرة
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  Instagram DM Simulator
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                اختبر تجربة العميل الحقيقية وتحليل Gemini والرد المصري بدون الحاجة لفتح تطبيق إنستغرام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-2">
              نماذج رسائل سريعة للاختبار:
            </label>
            <div className="flex flex-wrap gap-2">
              {sampleMessages.map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMessage(sample)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 transition-all text-right"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSimulate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  اسم مستخدم إنستغرام (@username)
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-2.5 text-slate-500 text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl pr-8 pl-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  الوجهة المستهدفة
                </label>
                <div className="px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-400 flex items-center justify-between">
                  <span>صفحة Vexora الرسمية</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Webhook نشط
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                نص رسالة العميل (DM)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="اكتب استفسار العميل هنا باللهجة المصرية أو العربية..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري معالجة الرسالة عبر Gemini AI والأتمتة...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>إرسال الرسالة وتشغيل الأتمتة فوراً</span>
                </>
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Live Pipeline Execution Trace */}
          {lastResult && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                نتيجة مسار الأتمتة (Pipeline Trace):
              </h4>

              {/* Status Banner */}
              <div className={`p-4 rounded-xl border ${
                lastResult.aiResponded 
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                  : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {lastResult.aiResponded ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-sm">
                        {lastResult.aiResponded ? 'تم إرسال رد الذكاء الاصطناعي بنجاح' : 'تم استلام الرسالة بدون رد آلي'}
                      </div>
                      <div className="text-xs opacity-90">
                        {lastResult.reason || 'تم استيفاء كافة معايير الفحص والتحقق الأمني'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                    Lead Score: {lastResult.customer?.lead_score || 50}/100
                  </span>
                </div>
              </div>

              {/* Response Bubble */}
              {lastResult.replyText && (
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                      <Bot className="w-3.5 h-3.5" />
                      رد Vexora التلقائي (باللهجة المصرية):
                    </span>
                    <span>Instagram Direct</span>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-indigo-950/40 to-slate-900 rounded-xl text-slate-100 text-sm leading-relaxed border border-indigo-500/20">
                    "{lastResult.replyText}"
                  </div>
                </div>
              )}

              {/* Customer State Updates */}
              {lastResult.customer && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-400 block">حالة العميل:</span>
                    <span className="font-semibold text-white">{lastResult.customer.lead_status}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-400 block">الخدمة المرصودة:</span>
                    <span className="font-semibold text-indigo-300 truncate block">
                      {lastResult.customer.requested_service || 'عام'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-400 block">تحويل لموظف:</span>
                    <span className={`font-semibold ${lastResult.customer.human_required ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {lastResult.customer.human_required ? 'نعم (مطلوب)' : 'لا'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-400 block">المعرّف (ID):</span>
                    <span className="font-mono text-slate-400 truncate block text-[10px]">
                      {lastResult.customer.id.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
