import React, { useState, useEffect } from 'react';
import { 
  ScrollText, 
  Trash2, 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Bot, 
  UserCheck, 
  Clock,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api.ts';
import type { AutomationLog } from '../types/index.ts';

export const LogsView: React.FC = () => {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getLogs(150);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClear = async () => {
    if (!confirm('هل أنت متأكد من مسح جميع السجلات؟')) return;
    try {
      await api.clearLogs();
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesFilter = filterType === 'all' || l.event_type === filterType || l.status === filterType;
    const matchesSearch = 
      (l.message_snippet && l.message_snippet.toLowerCase().includes(search.toLowerCase())) ||
      (l.instagram_username && l.instagram_username.toLowerCase().includes(search.toLowerCase())) ||
      (l.intent && l.intent.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-indigo-400" />
            سجلات الأتمتة والعمليات (Automation & System Logs)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            سجل لحظي لكل رسالة واردة، تحليل Gemini، استجابة الـ Webhook، وأي تحذيرات أمنية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="تحديث السجلات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-950/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح السجلات</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في السجلات بالرسالة أو اسم المستخدم أو النية..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
        >
          <option value="all">كافة أنواع الأحداث ({logs.length})</option>
          <option value="ai_response">ردود الذكاء الاصطناعي (ai_response)</option>
          <option value="webhook_received">أحداث Webhook (webhook_received)</option>
          <option value="human_handoff">تحويل لموظف (human_handoff)</option>
          <option value="guardrail_blocked">حظر جدار الحماية (guardrail_blocked)</option>
          <option value="duplicate_skipped">رسائل مكررة (duplicate_skipped)</option>
          <option value="error">أخطاء (error)</option>
        </select>
      </div>

      {/* Logs Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">الحالة والنوع</th>
                <th className="py-3 px-4">العميل / المعرّف</th>
                <th className="py-3 px-4">مقتطف الحدث</th>
                <th className="py-3 px-4">النية والتفاصيل</th>
                <th className="py-3 px-4">زمن الاستجابة</th>
                <th className="py-3 px-4 text-left">التوقيت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    لا توجد سجلات مطابقة. كل العمليات السليمة تظهر هنا في الوقت الفعلي.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isSuccess = log.status === 'success';
                  const isWarning = log.status === 'warning';
                  const isError = log.status === 'error';

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                          {isError && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${
                            isSuccess ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            isWarning ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {log.event_type}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {log.instagram_username ? (
                          <span className="font-semibold text-white">@{log.instagram_username}</span>
                        ) : log.customer_id ? (
                          <span className="font-mono text-slate-400 text-[10px]">{log.customer_id.substring(0, 8)}...</span>
                        ) : (
                          <span className="text-slate-500">System</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        {log.message_snippet ? (
                          <span className="text-slate-300 line-clamp-1">"{log.message_snippet}"</span>
                        ) : log.details?.reason ? (
                          <span className="text-slate-400">{log.details.reason}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {log.intent && (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
                              {log.intent}
                            </span>
                          )}
                          {log.lead_score !== undefined && (
                            <span className="text-slate-400 text-[10px]">
                              Score: {log.lead_score}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {log.response_time_ms ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {log.response_time_ms}ms
                          </span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-left font-mono text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
