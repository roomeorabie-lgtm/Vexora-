import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { api } from '../services/api.ts';
import type { TestResultItem } from '../types/index.ts';

export const TestingLabView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testSummary, setTestSummary] = useState<{
    timestamp: string;
    total: number;
    passed: number;
    failed: number;
    results: TestResultItem[];
  } | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleRunAllTests = async () => {
    setIsRunning(true);
    try {
      const res = await api.runTestSuite();
      setTestSummary(res);
    } catch (err: any) {
      console.error('Failed to run test suite:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            مختبر الفحص الآلي الشامل (10 Automated Verification Tests)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            فحص حي متكامل لكل من Webhook، Gemini AI، الحماية من الهلوسة، العمليات الذرية لقاعدة البيانات، والتحويل لموظف
          </p>
        </div>

        <button
          onClick={handleRunAllTests}
          disabled={isRunning}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>جاري تشغيل الفحص الآلي الآن...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>تشغيل كافة الاختبارات العشرة الآن</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Banner if executed */}
      {testSummary && (
        <div className={`p-5 rounded-2xl border flex items-center justify-between flex-wrap gap-4 ${
          testSummary.failed === 0 
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-3">
            {testSummary.failed === 0 ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            )}
            <div>
              <h3 className="font-bold text-base text-white">
                {testSummary.failed === 0 ? 'نجحت جميع الاختبارات بنسبة 100%' : `فشل ${testSummary.failed} من أصل ${testSummary.total} اختبار`}
              </h3>
              <p className="text-xs opacity-90">
                تم الفحص في: {new Date(testSummary.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {testSummary.passed} ناجح
            </span>
            {testSummary.failed > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {testSummary.failed} راسب
              </span>
            )}
          </div>
        </div>
      )}

      {/* 10 Tests Grid / List */}
      <div className="space-y-3">
        {(testSummary?.results || [
          { id: '1', name_ar: 'التحقق من مصادقة Webhook (Hub Challenge)', description: 'التحقق من هاندشيك Meta ورفض الرموز غير المطابقة', status: 'skipped' },
          { id: '2', name_ar: 'معالجة الرسائل الواردة وإنشاء العميل والمحادثة', description: 'استقبال الرسالة الواردة وحفظها بقاعدة البيانات', status: 'skipped' },
          { id: '3', name_ar: 'حماية منع تكرار الرسائل (Deduplication Protection)', description: 'التأكد من عدم الرد مرتين على نفس الرسالة في حال تكرار الحدث من إنستغرام', status: 'skipped' },
          { id: '4', name_ar: 'توليد الرد باللهجة المصرية عبر Gemini 3.8 Flash', description: 'تحديد النية ودرجة الاهتمام وتوليد رد ودود مقيد بالبيانات الحقيقية فقط', status: 'skipped' },
          { id: '5', name_ar: 'جدار الحماية ومنع الهلوسة وتسريب البرومبت والمفاتيح', description: 'حظر الردود المخالفة واكتشاف أي محاولة لتسريب المفاتيح', status: 'skipped' },
          { id: '6', name_ar: 'عمليات قاعدة البيانات الذرية (CRUD Persistence)', description: 'التحقق من إنشاء وقراءة وتحديث وحذف السجلات بأمان', status: 'skipped' },
          { id: '7', name_ar: 'إرسال الرسائل عبر Meta Instagram Graph API', description: 'فحص جاهزية التوكن والتعامل مع المحاكاة الآمنة', status: 'skipped' },
          { id: '8', name_ar: 'التحويل لموظف بشري وتجميد الرد الآلي (Human Handoff)', description: 'اكتشاف رغبة العميل في التحدث مع شخص وتجميد الـ AI فورياً للعميل', status: 'skipped' },
          { id: '9', name_ar: 'الزر العام لإيقاف وتشغيل أتمتة الـ AI (ON/OFF)', description: 'التحقق من أن إيقاف الأتمتة يمنع الردود التلقائية بالكامل', status: 'skipped' },
          { id: '10', name_ar: 'سلامة تكوين النظام وعزل المتغيرات الحساسة', description: 'فحص عزل الـ API Keys في السيرفر وعدم كشفها للواجهة', status: 'skipped' }
        ]).map((item, index) => {
          const isPassed = item.status === 'passed';
          const isFailed = item.status === 'failed';
          const isSkipped = item.status === 'skipped';
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isPassed ? 'bg-slate-900 border-emerald-500/20' :
                isFailed ? 'bg-rose-950/20 border-rose-500/30' :
                'bg-slate-900 border-slate-800'
              }`}
            >
              <div 
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{item.name_ar}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {'duration_ms' in item && typeof item.duration_ms === 'number' && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {item.duration_ms}ms
                    </span>
                  )}

                  {isPassed && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ناجح (Passed)</span>
                    </span>
                  )}
                  {isFailed && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>راسب (Failed)</span>
                    </span>
                  )}
                  {isSkipped && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs">
                      جاهز للاختبار
                    </span>
                  )}

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-300 space-y-2">
                  {'error' in item && item.error && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono">
                      الخطأ: {item.error}
                    </div>
                  )}

                  {'details' in item && item.details && (
                    <div>
                      <span className="font-semibold text-slate-400 block mb-1">تفاصيل فحص المخرجات:</span>
                      <pre className="p-3 bg-slate-900 rounded-xl font-mono text-[11px] text-indigo-300 overflow-x-auto border border-slate-800">
                        {JSON.stringify(item.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
