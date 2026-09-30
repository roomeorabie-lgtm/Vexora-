import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Save, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  MessageSquare,
  HelpCircle,
  Clock
} from 'lucide-react';
import { api } from '../services/api.ts';
import type { AISettings } from '../types/index.ts';

export const AISettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New rule & forbidden input
  const [newRule, setNewRule] = useState('');
  const [newForbidden, setNewForbidden] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  // Live prompt test state
  const [testQuery, setTestQuery] = useState('المتجر بكام وعايز أعرف عندكم عروض إيه؟');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getAISettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load AI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await api.updateAISettings(settings);
      setSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update AI settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRule = () => {
    if (!newRule.trim() || !settings) return;
    setSettings({
      ...settings,
      rules: [...(settings.rules || []), newRule.trim()]
    });
    setNewRule('');
  };

  const handleRemoveRule = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      rules: settings.rules.filter((_, i) => i !== index)
    });
  };

  const handleAddForbidden = () => {
    if (!newForbidden.trim() || !settings) return;
    setSettings({
      ...settings,
      forbidden_information: [...(settings.forbidden_information || []), newForbidden.trim()]
    });
    setNewForbidden('');
  };

  const handleRemoveForbidden = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      forbidden_information: settings.forbidden_information.filter((_, i) => i !== index)
    });
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim() || !settings) return;
    setSettings({
      ...settings,
      human_handoff_keywords: [...(settings.human_handoff_keywords || []), newKeyword.trim()]
    });
    setNewKeyword('');
  };

  const handleRemoveKeyword = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      human_handoff_keywords: settings.human_handoff_keywords.filter((_, i) => i !== index)
    });
  };

  const handleRunTestPrompt = async () => {
    if (!testQuery.trim()) return;
    setTestLoading(true);
    try {
      const res = await api.testAIPrompt(testQuery.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ error: err.message || 'فشل الاختبار' });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-slate-500 text-xs">جاري تحميل إعدادات الذكاء الاصطناعي...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            إعدادات الذكاء الاصطناعي واللهجة المصرية (AI System Prompt)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            خصص شخصية المساعد الذكي، صياغة اللهجة المصرية، قواعد منع الهلوسة، وكلمات التحويل لموظف بشري بدون تعديل الكود
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>تم حفظ التعديلات بنجاح!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form (2 Cols) */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          {/* Identity & Dialect Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              هوية البراند واللهجة المصرية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">اسم البراند:</label>
                <input
                  type="text"
                  value={settings.business_name}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">اللهجة المستهدفة:</label>
                <input
                  type="text"
                  value={settings.dialect}
                  onChange={(e) => setSettings({ ...settings, dialect: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  placeholder="المصرية (طبيعية وودية)"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="text-slate-300 block mb-1">وصف البراند والخدمات الأساسية:</label>
              <textarea
                rows={2}
                value={settings.business_description}
                onChange={(e) => setSettings({ ...settings, business_description: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>

            <div className="text-xs">
              <label className="text-slate-300 block mb-1">شخصية ونبرة الـ AI (Personality & Tone):</label>
              <textarea
                rows={2}
                value={settings.personality}
                onChange={(e) => setSettings({ ...settings, personality: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">طول الرد في محادثات إنستغرام:</label>
                <select
                  value={settings.response_length}
                  onChange={(e) => setSettings({ ...settings, response_length: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="concise">مختصر وسريع (الأفضل لـ Instagram)</option>
                  <option value="balanced">متوسط ومتوازن</option>
                  <option value="detailed">مفصل</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">أقصى عدد أسئلة في الرد الواحد:</label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={settings.max_questions_per_reply || 2}
                  onChange={(e) => setSettings({ ...settings, max_questions_per_reply: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Rules Builder Card (Zero Hallucination Rules) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              قواعد ومحددات الـ AI الإلزامية (Anti-Hallucination Rules)
            </h3>

            <div className="space-y-2 text-xs">
              {settings.rules.map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 gap-3">
                  <span className="text-slate-200">{rule}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    className="p-1 text-slate-400 hover:text-rose-400 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="أضف قاعدة جديدة (مثال: لا تذكر أي أسعار غير موجودة في قاعدة البيانات)..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddRule}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            </div>
          </div>

          {/* Forbidden Information Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              المعلومات المحظورة نهائياً عن الذكاء الاصطناعي (Forbidden Data)
            </h3>

            <div className="space-y-2 text-xs">
              {settings.forbidden_information.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 gap-3">
                  <span className="text-rose-200">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveForbidden(idx)}
                    className="p-1 text-slate-400 hover:text-rose-400 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newForbidden}
                onChange={(e) => setNewForbidden(e.target.value)}
                placeholder="أضف موضوعاً أو معلومة محظورة..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddForbidden}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
            </div>
          </div>

          {/* Human Handoff Configuration */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              إعدادات التحويل لموظف بشري (Human Handoff)
            </h3>

            <div className="text-xs">
              <label className="text-slate-300 block mb-1">الرسالة التي يرسلها الـ AI عند التحويل لموظف:</label>
              <textarea
                rows={2}
                value={settings.human_handoff_message}
                onChange={(e) => setSettings({ ...settings, human_handoff_message: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 text-xs block mb-1.5">الكلمات الدلالية التي تُفعّل التحويل لموظف تلقائياً:</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {settings.human_handoff_keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(idx)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="أضف كلمة دلالية (مثال: كلمني فون)..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري حفظ الإعدادات...' : 'حفظ إعدادات الـ AI بالكامل'}</span>
          </button>
        </form>

        {/* Live Prompt Tester Pane (1 Col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 sticky top-20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                فحص واستجابة الـ Prompt الحية
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                Gemini 3.8 Flash
              </span>
            </div>

            <p className="text-xs text-slate-400">
              اكتب أي رسالة لاختبار كيف سيحللها Gemini، واطلع على النية، درجة الاهتمام، والرد المصري المولّد:
            </p>

            <textarea
              rows={3}
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="اكتب رسالة تجريبية..."
            />

            <button
              type="button"
              onClick={handleRunTestPrompt}
              disabled={testLoading || !testQuery.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              {testLoading ? (
                <span>جاري استدعاء Gemini AI...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تحليل الرسالة وتوليد الرد</span>
                </>
              )}
            </button>

            {/* Test Results Output */}
            {testResult && (
              <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                {testResult.error ? (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    {testResult.error}
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>النية (Intent): <strong className="text-indigo-400">{testResult.intent}</strong></span>
                        <span>Score: <strong className="text-emerald-400">{testResult.lead_score}%</strong></span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        الخدمة: <span className="text-slate-200">{testResult.service || 'غير محددة'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        تحويل لموظف: <span className={testResult.needs_human_handoff ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                          {testResult.needs_human_handoff ? 'نعم' : 'لا'}
                        </span>
                      </div>
                      {testResult.duration_ms && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>زمن الاستجابة: {testResult.duration_ms} مللي ثانية</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-slate-100 leading-relaxed">
                      <span className="text-indigo-400 block font-semibold text-[11px] mb-1">
                        الرد المصري المقترح:
                      </span>
                      "{testResult.suggested_response}"
                    </div>

                    {testResult.reasoning && (
                      <div className="p-2.5 bg-slate-800/40 rounded-xl text-[11px] text-slate-400">
                        <strong className="text-slate-300">التعليل:</strong> {testResult.reasoning}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
