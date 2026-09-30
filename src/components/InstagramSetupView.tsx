import React, { useState, useEffect } from 'react';
import { 
  Instagram, 
  Key, 
  Globe, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  AlertCircle, 
  ShieldCheck, 
  Send, 
  Save, 
  RefreshCw,
  Sparkles,
  HelpCircle,
  Play,
  Check,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api.ts';
import type { SystemSettings } from '../types/index.ts';

export const InstagramSetupView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [verifyToken, setVerifyToken] = useState('vexora_secure_webhook_token_2026');
  const [appSecret, setAppSecret] = useState('');
  const [appId, setAppId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');

  // Selected Host: default to Vercel production as requested by user
  const [selectedHostType, setSelectedHostType] = useState<'vercel' | 'current'>('vercel');
  const vercelBase = 'https://vexora-x.vercel.app';
  const currentBase = window.location.origin;
  const activeBaseUrl = selectedHostType === 'vercel' ? vercelBase : currentBase;
  const webhookCallbackUrl = `${activeBaseUrl}/api/instagram/webhook`;

  // Webhook live ping test state
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [pingResult, setPingResult] = useState<{
    status: 'idle' | 'success' | 'failed';
    message: string;
    details?: string;
    httpCode?: number;
  }>({ status: 'idle', message: '' });

  // Webhook display status
  const [localTestedReady, setLocalTestedReady] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemSettings();
      setSettings(data);
      const activeToken = (data.instagram_verify_token && data.instagram_verify_token.trim())
        ? data.instagram_verify_token
        : 'vexora_secure_webhook_token_2026';
      setVerifyToken(activeToken);
      setAccountId(data.instagram_account_id || data.instagram_page_id || '');
      setAppId(data.meta_app_id || '');
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateNewToken = async () => {
    setGeneratingToken(true);
    try {
      const res = await api.generateVerifyToken();
      setVerifyToken(res.token);
      setSettings(res.settings);
      setSuccessMsg('تم توليد وحفظ رمز تحقق جديد بنجاح!');
      setTimeout(() => setSuccessMsg(null), 3000);
      handleCopy(res.token, 'token');
    } catch (err: any) {
      console.error('Failed to generate token:', err);
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      const payload: Partial<SystemSettings> = {
        instagram_verify_token: verifyToken.trim() || 'vexora_secure_webhook_token_2026',
        instagram_account_id: accountId.trim(),
        instagram_page_id: accountId.trim(),
        meta_app_id: appId.trim()
      };
      if (accessToken && !accessToken.includes('••••')) {
        payload.instagram_access_token = accessToken.trim();
      }
      const updated = await api.updateSystemSettings(payload);
      setSettings(updated);
      setSuccessMsg('تم حفظ بيانات الربط بنجاح في السيرفر!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Real Webhook Ping Tester:
   * Performs an actual HTTP GET to /api/instagram/webhook using Meta's exact handshake:
   * ?hub.mode=subscribe&hub.verify_token=VERIFY_TOKEN&hub.challenge=TEST_CHALLENGE
   */
  const handleTestWebhookLive = async () => {
    setTestingWebhook(true);
    setPingResult({ status: 'idle', message: '' });

    const testChallenge = `challenge_${Math.floor(100000 + Math.random() * 900000)}`;
    const testUrl = `${activeBaseUrl}/api/instagram/webhook?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken.trim())}&hub.challenge=${testChallenge}`;

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Accept': 'text/plain' }
      });

      const bodyText = await response.text();

      if (response.status === 200 && bodyText.trim() === testChallenge) {
        setPingResult({
          status: 'success',
          httpCode: 200,
          message: '✅ Webhook يعمل بنجاح! السيرفر رد بـ HTTP 200 وبنفس قيمة الـ Challenge النصية، وهو متوافق تماماً مع Meta.',
          details: `تم استقبال Challenge: ${bodyText.trim()}`
        });
        setLocalTestedReady(true);
      } else if (response.status === 403) {
        setPingResult({
          status: 'failed',
          httpCode: 403,
          message: '❌ Verify Token غير مطابق: السيرفر رفض الرمز بـ HTTP 403 لأن الرمز المرسل لا يطابق المسجل.',
          details: `Response: ${bodyText}`
        });
      } else if (response.status === 404) {
        setPingResult({
          status: 'failed',
          httpCode: 404,
          message: '❌ Endpoint غير موجود (HTTP 404): المسار غير مفعل أو أن منصة الاستضافة لم تنشر مسار /api/instagram/webhook.',
          details: `URL: ${testUrl}`
        });
      } else if (bodyText.includes('<!doctype html>') || bodyText.includes('<html')) {
        setPingResult({
          status: 'failed',
          httpCode: response.status,
          message: '❌ HTTP status غير صحيح: السيرفر أرجع صفحة HTML بدلاً من الـ Challenge النصي (Vercel SPA Fallback).',
          details: 'تأكد من وجود vercel.json الذي يوجه /api/instagram/webhook إلى Serverless Function.'
        });
      } else {
        setPingResult({
          status: 'failed',
          httpCode: response.status,
          message: `❌ فشل الفحص: كود الحالة HTTP ${response.status}`,
          details: `استجابة السيرفر: ${bodyText.slice(0, 100)}`
        });
      }
    } catch (err: any) {
      setPingResult({
        status: 'failed',
        message: `❌ تعذر الاتصال بالرابط (Network Error): ${err.message || 'خطأ في الشبكة'}`,
        details: testUrl
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  // Determine True Status
  const isVerifiedByMeta = settings?.meta_webhook_verified === true;
  const isReady = localTestedReady && !isVerifiedByMeta;
  const isDisconnected = !isVerifiedByMeta && !isReady;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-400" />
            إعداد ربط إنستغرام وميتا الرسمية (Meta Graph API)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Endpoint متوافق 100% مع Vercel Production و Meta Hub Verification
          </p>
        </div>

        {/* Real Status Badge (No simulation deception) */}
        <div className="flex items-center gap-2">
          {isVerifiedByMeta ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Webhook Status: ● Meta Webhook Verified</span>
            </div>
          ) : isReady ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <span>Webhook Status: ● جاهز للتحقق من Meta</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span>Webhook Status: ● غير متصل</span>
            </div>
          )}
        </div>
      </div>

      {/* Clear Separation Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>تكامل إنستغرام الحقيقي (Meta Production API)</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          هذا المسار مخصص لاستقبال رسائل Instagram Direct الحقيقية من شركة Meta عبر 
          <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded mx-1">/api/instagram/webhook</code>.
          وضع المحاكاة (Simulation) مفصول تماماً ومخصص للاختبارات الداخلية فقط في اللوحة ولا يتم اعتباره اتصالاً حقيقياً بميتا.
        </p>
      </div>

      {/* Webhook URLs & Verify Token Box */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            بيانات الاعتماد المطلوبة داخل Meta Developers
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">النطاق المستهدف:</span>
            <button
              type="button"
              onClick={() => setSelectedHostType('vercel')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                selectedHostType === 'vercel'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              Vercel Production
            </button>
            <button
              type="button"
              onClick={() => setSelectedHostType('current')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                selectedHostType === 'current'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              النطاق الحالي (Dev/Preview)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* 1. Callback URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold block">
                Callback URL (رابط الـ Webhook النهائي):
              </label>
              <span className="text-[10px] text-slate-500">انسخه وضعه في Meta</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookCallbackUrl}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-[11px] select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopy(webhookCallbackUrl, 'url')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/20 transition-all"
              >
                {copiedField === 'url' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>نسخ Callback URL</span>
              </button>
            </div>
            <p className="text-[11px] text-indigo-300/90 font-mono">
              GET & POST: {webhookCallbackUrl}
            </p>
          </div>

          {/* 2. Verify Token */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold block">
                Verify Token (رمز التحقق الخاص بك):
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold">مضبوط في السيرفر</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="vexora_secure_webhook_token_2026"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500 select-all"
              />
              <button
                type="button"
                onClick={() => handleCopy(verifyToken, 'token')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-600/20 transition-all"
              >
                {copiedField === 'token' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>نسخ Verify Token</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateNewToken}
                disabled={generatingToken}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0"
                title="توليد رمز جديد"
              >
                <RefreshCw className={`w-4 h-4 ${generatingToken ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              * Environment Variable: <code className="text-slate-200 font-mono">INSTAGRAM_VERIFY_TOKEN</code>
            </p>
          </div>
        </div>

        {/* Live Webhook Ping Tester (Testing same exact Meta method) */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                فحص استجابة الرابط والرمز الآن (Meta Handshake Simulator)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                يقوم بإرسال GET Request فعلي مع hub.mode=subscribe و hub.verify_token و hub.challenge لفحص النتيجة فوراً
              </p>
            </div>

            <button
              type="button"
              onClick={handleTestWebhookLive}
              disabled={testingWebhook}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 shrink-0"
            >
              {testingWebhook ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري فحص الـ Webhook...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>فحص استجابة الرابط والرمز الآن</span>
                </>
              )}
            </button>
          </div>

          {/* Test Result Message */}
          {pingResult.status !== 'idle' && (
            <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in ${
              pingResult.status === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {pingResult.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span>{pingResult.message}</span>
              </div>
              {pingResult.details && (
                <div className="font-mono text-[11px] text-slate-300 pr-7">
                  {pingResult.details}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Meta API Keys Configuration Form (Server-Side Storage Only) */}
      <form onSubmit={handleSave} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-pink-400" />
            مفاتيح وتكوين Meta Graph API (Backend Environment)
          </h3>
          <span className="text-[10px] text-slate-400">
            تُحفظ في السيرفر فقط ولا تظهر للمتصفح
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-medium">
              Instagram Account ID (معرف حساب إنستغرام للأعمال):
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="مثال: 17841400000000000"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              متغير البيئة: <code className="text-slate-400">INSTAGRAM_ACCOUNT_ID</code>
            </span>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-medium">
              Meta App ID:
            </label>
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="مثال: 987654321098765"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              متغير البيئة: <code className="text-slate-400">META_APP_ID</code>
            </span>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-medium">
              Meta Access Token (رمز وصول إنستغرام الدائم للردود):
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={settings?.instagram_access_token_configured ? '•••••••••••••••••••••••••••••••• (مضبوط في السيرفر ومخفي للأمان)' : 'الصق META_ACCESS_TOKEN هنا...'}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              متغير البيئة: <code className="text-slate-400">META_ACCESS_TOKEN</code> (يتطلب صلاحية instagram_manage_messages)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {successMsg && (
            <span className="text-xs text-emerald-400 font-semibold">{successMsg}</span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="mr-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ بيانات الربط في السيرفر'}</span>
          </button>
        </div>
      </form>

      {/* Step by Step Action Plan for Meta Developers */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base">
            ما الخطوة التي يجب أن تفعلها داخل Meta Developers الآن؟
          </h3>
          <a
            href="https://developers.facebook.com/apps/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
          >
            <span>فتح Meta Developers</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-3 text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              1
            </span>
            <div>
              <strong className="text-white block text-sm mb-0.5">افتح صفحة Webhooks في تطبيقك في Meta</strong>
              من القائمة الجانبية اليسرى اضغط على <strong>Webhooks</strong>، ومن القائمة المنسدلة اختر <strong>Instagram</strong>.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              2
            </span>
            <div>
              <strong className="text-white block text-sm mb-0.5">اضغط على زر Edit Subscription</strong>
              ستظهر لك نافذة منبثقة تطلب حقلين:
              <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-300">
                <li>
                  في خانة <strong>Callback URL</strong>: الصق الرابط:
                  <div className="p-2 bg-slate-950 rounded-lg font-mono text-indigo-300 text-[11px] my-1">
                    https://vexora-x.vercel.app/api/instagram/webhook
                  </div>
                </li>
                <li>
                  في خانة <strong>Verify Token</strong>: الصق رمز التحقق الخاص بك:
                  <div className="p-2 bg-slate-950 rounded-lg font-mono text-emerald-300 text-[11px] my-1">
                    {verifyToken}
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              3
            </span>
            <div>
              <strong className="text-white block text-sm mb-0.5">اضغط على زر Verify and Save</strong>
              سيقوم خادم Meta بإرسال طلب فحص مباشر وسيرد خادم Vercel بنجاح مع HTTP 200 وستظهر علامة صح خضراء فوراً.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              4
            </span>
            <div>
              <strong className="text-white block text-sm mb-0.5">تفعيل اشتراك الأحداث (Subscribe)</strong>
              في جدول الأحداث المتاح في نفس الصفحة، اضغط <strong>Subscribe</strong> أمام:
              <span className="inline-flex gap-1.5 mr-2 font-mono text-indigo-300 font-semibold">
                [ messages ] [ messaging_postbacks ] [ messaging_seen ] [ messaging_reactions ] [ comments ] [ mentions ]
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
