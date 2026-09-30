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
  Check
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
  const [pageId, setPageId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  // Webhook live handshake test state
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemSettings();
      setSettings(data);
      const activeToken = data.instagram_verify_token && data.instagram_verify_token.trim()
        ? data.instagram_verify_token
        : 'vexora_secure_webhook_token_2026';
      setVerifyToken(activeToken);
      setPageId(data.instagram_page_id || '');
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
        instagram_page_id: pageId
      };
      if (accessToken && !accessToken.includes('••••')) {
        payload.instagram_access_token = accessToken;
      }
      const updated = await api.updateSystemSettings(payload);
      setSettings(updated);
      setSuccessMsg('تم حفظ إعدادات الربط بنجاح!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhookHandshake = async () => {
    setTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await api.testWebhookHandshake(verifyToken);
      setWebhookTestResult(res);
    } catch (err: any) {
      setWebhookTestResult({ success: false, message: err.message || 'فشل الفحص' });
    } finally {
      setTestingWebhook(false);
    }
  };

  const currentHost = window.location.origin;
  const activeBaseUrl = customDomain.trim() ? customDomain.replace(/\/+$/, '') : currentHost;
  const webhookFullUrl = `${activeBaseUrl}/api/webhook/instagram`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-400" />
            إعداد ربط إنستغرام عبر Meta Graph API الرسمي
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            دليل إعداد الـ Webhook ورموز التحقق خطوة بخطوة بالواجهات الرسمية لشركة Meta
          </p>
        </div>

        {/* Status Indicator */}
        <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          settings?.instagram_access_token_configured
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${settings?.instagram_access_token_configured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          <span>{settings?.instagram_access_token_configured ? 'Meta API متصل ونشط' : 'بانتظار إضافة Meta Access Token'}</span>
        </div>
      </div>

      {/* CRITICAL EXPLANATION BANNER: What is Verify Token? */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/40 to-slate-900 border-2 border-indigo-500/40 shadow-xl space-y-3">
        <div className="flex items-center gap-2.5 text-indigo-300 font-bold text-sm">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <span>توضيح هام جداً: ما هو رمز التحقق (Verify Token)؟</span>
        </div>

        <div className="text-xs text-slate-200 leading-relaxed space-y-2">
          <p>
            كثير من المستخدمين يعتقدون أن شركة <strong>Meta (فيسبوك)</strong> هي التي ستعطيهم رمز التحقق Verify Token، ولكن في الحقيقة:
          </p>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-indigo-500/30 font-medium text-emerald-300">
            💡 <strong>رمز التحقق (Verify Token) هو كلمة سر خاصة بك أنت</strong> يقوم نظامك بإنشائها لتأمين الـ Webhook الخاص بك، ثم تقوم <strong>أنت بنسخها ولصقها في خانة Verify Token داخل صفحة Meta Developers</strong> ليتأكد فيسبوك أن هذا الموقع يخصك!
          </div>
          <p className="text-slate-300">
            نظامك قام بالفعل بتعيين رمز افتراضي آمن جاهز لك، ويمكنك استخدامه فوراً أو الضغط على زر <strong>"توليد رمز جديد"</strong> ليتم نسخه وتفعيله بضغطة زر واحدة.
          </p>
        </div>
      </div>

      {/* Webhook URLs & Verify Token Box */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            بيانات الـ Webhook المطلوبة داخل صفحة Meta Developers
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            جاهز للاستخدام
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Callback URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold block">
                1. Callback URL (رابط الـ Webhook المباشر):
              </label>
              <span className="text-[10px] text-slate-500">انسخه وضعه في خانة Callback URL في Meta</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookFullUrl}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-[11px] select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopy(webhookFullUrl, 'url')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/20 transition-all"
              >
                {copiedField === 'url' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedField === 'url' ? 'تم النسخ!' : 'نسخ الرابط'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              * إذا قمت بنشر موقعك على دومين خارجي مخصص أو Vercel، يمكنك كتابة الدومين الخاص بك في الأسفل.
            </p>
          </div>

          {/* Verify Token */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold block">
                2. Verify Token (رمز التحقق الخاص بك):
              </label>
              <span className="text-[10px] text-emerald-400 font-medium">مفعّل وجاهز</span>
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
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-600/20 transition-all"
              >
                {copiedField === 'token' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedField === 'token' ? 'تم النسخ!' : 'نسخ الرمز'}</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateNewToken}
                disabled={generatingToken}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="توليد رمز تحقق عشوائي جديد"
              >
                <RefreshCw className={`w-4 h-4 ${generatingToken ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">
                انسخ هذا الرمز والصقه كما هو في خانة <strong>Verify Token</strong> داخل Meta Developers.
              </span>
              <button
                type="button"
                onClick={handleGenerateNewToken}
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>توليد كود جديد</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Domain Input for Vercel / External Deployments */}
        <div className="pt-3 border-t border-slate-800/80">
          <label className="text-slate-400 text-xs block mb-1">
            دومين النشر المخصص (إذا كنت نشرت الموقع على Vercel أو دومين خارجي):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="مثال: https://vexora-automation.vercel.app (اتركه فارغاً لاستخدام الرابط الحالي تلقائياً)"
              className="flex-1 bg-slate-800/50 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono"
            />
            {customDomain && (
              <button
                type="button"
                onClick={() => setCustomDomain('')}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs border border-slate-700"
              >
                إعادة للرابط الحالي
              </button>
            )}
          </div>
        </div>

        {/* Webhook Handshake Live Ping Tester */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                أداة الفحص الذاتي للـ Webhook (Webhook Live Ping Tester)
              </span>
            </div>

            <button
              type="button"
              onClick={handleTestWebhookHandshake}
              disabled={testingWebhook}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {testingWebhook ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الفحص...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>فحص استجابة الرابط والرمز الآن</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            اضغط هنا للتأكد بنفسك قبل الذهاب إلى فيسبوك من أن السيرفر يستجيب بشكل سليم للرمز الحالي ويرجع الـ challenge المطلوب.
          </p>

          {webhookTestResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
              webhookTestResult.success 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
            }`}>
              {webhookTestResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold">
                  {webhookTestResult.success ? 'جاهز 100%! السيرفر متوافق تماماً مع Meta' : 'فشل الفحص'}
                </div>
                <div className="text-[11px] opacity-90">{webhookTestResult.message}</div>
                {webhookTestResult.challengeReturned && (
                  <div className="font-mono text-[10px] text-slate-400">
                    Challenge Response: {webhookTestResult.challengeReturned} (HTTP 200 OK)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Meta API Keys Configuration Form */}
      <form onSubmit={handleSave} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Key className="w-4 h-4 text-pink-400" />
          تكوين مفاتيح Meta Graph API
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-medium">
              Instagram Page ID أو Instagram Business Account ID:
            </label>
            <input
              type="text"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              placeholder="مثال: 104829104829104"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-medium">
              Instagram Graph API Permanent User/Page Access Token:
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={settings?.instagram_access_token_configured ? '•••••••••••••••••••••••••••••••• (مضبوط ومخفي للأمان)' : 'الصق الـ Access Token من Meta App هنا...'}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              يتم حفظ التوكن في السيرفر فقط ولا يتم كشفه للواجهة الأمامية منعاً للاختراق.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {successMsg && (
            <span className="text-xs text-emerald-400 font-medium">{successMsg}</span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="mr-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ بيانات الربط'}</span>
          </button>
        </div>
      </form>

      {/* Step by Step Visual Guide for Non-Programmers */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base">
            دليل إعداد تطبيق Meta للمستخدم العادي (بدون برمجة)
          </h3>
          <a
            href="https://developers.facebook.com/apps/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
          >
            <span>فتح Meta Developers</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              1
            </span>
            <div>
              <strong className="text-white block text-sm mb-0.5">إنشاء تطبيق جديد في Meta Developers</strong>
              ادخل على <code className="text-indigo-300">developers.facebook.com</code> ثم اضغط على <strong>Create App</strong>، واختر نوع التطبيق <strong>Business</strong> ثم سمّه <strong>Vexora Instagram AI</strong>.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              2
            </span>
            <div>
              <strong className="text-white block text-sm mb-0.5">إضافة منتج Instagram Graph API</strong>
              من لوحة التطبيق، ابحث عن <strong>Instagram Graph API</strong> أو <strong>Messenger</strong> واضغط على <strong>Set Up</strong>. تأكد من ربط صفحة فيسبوك المرتبطة بحساب إنستغرام لبراند Vexora.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              3
            </span>
            <div>
              <strong className="text-white block text-sm mb-0.5">ضبط الـ Webhook بالبيانات الموضحة في الأعلى</strong>
              ادخل على تبويب <strong>Webhooks</strong> في القائمة الجانبية، اختر <strong>Instagram</strong> ثم اضغط <strong>Edit Subscription</strong>:
              <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-300">
                <li>في خانة <strong>Callback URL</strong>: الصق رابط الـ Webhook المنسوخ من المستطيل رقم (1) أعلاه.</li>
                <li>في خانة <strong>Verify Token</strong>: الصق رمز التحقق المنسوخ من المستطيل رقم (2) أعلاه (<code className="text-emerald-300 font-mono">{verifyToken}</code>).</li>
                <li>اضغط على <strong>Verify and Save</strong> (سيقوم Meta بالتحقق فورياً وسيعطيك علامة خضراء).</li>
                <li>بعد الحفظ، فعّل الاشتراك (Subscribe) في حقل <strong>messages</strong> و <strong>messaging_postbacks</strong>.</li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              4
            </span>
            <div>
              <strong className="text-white block text-sm mb-0.5">توليد الـ Access Token</strong>
              من صفحة إعدادات Instagram، اختر صفحة Vexora واضغط <strong>Generate Token</strong>، انسخ التوكن والصقه في الحقل المخصص أعلاه واضغط حفظ.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              5
            </span>
            <div>
              <strong className="text-white block text-sm mb-0.5">تجربة إرسال رسالة حقيقية</strong>
              الآن أرسل رسالة من أي حساب إنستغرام إلى حساب Vexora، وسيتم استقبالها فوراً، تحليلها بـ Gemini، وإرسال الرد المصري للعميل في خلال ثانية واحدة!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
