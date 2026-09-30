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
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api.ts';
import type { SystemSettings } from '../types/index.ts';

export const InstagramSetupView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [verifyToken, setVerifyToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemSettings();
      setSettings(data);
      setVerifyToken(data.instagram_verify_token || '');
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
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      const payload: Partial<SystemSettings> = {
        instagram_verify_token: verifyToken,
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

  const appHostUrl = window.location.origin;
  const webhookFullUrl = `${appHostUrl}/api/webhook/instagram`;

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
            دليل إعداد الـ Webhook ورموز الوصول خطوة بخطوة بالواجهات الرسمية لشركة Meta
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

      {/* Webhook URLs & Endpoints Box */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-400" />
          بيانات الـ Webhook المطلوبة داخل Meta Developers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Callback URL (رابط الـ Webhook):</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookFullUrl}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={() => handleCopy(webhookFullUrl, 'url')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 shrink-0"
              >
                {copiedField === 'url' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedField === 'url' ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Verify Token (رمز التحقق الخاص بك):</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={verifyToken}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={() => handleCopy(verifyToken, 'token')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 shrink-0"
              >
                {copiedField === 'token' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedField === 'token' ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>
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

          <div>
            <label className="text-slate-300 block mb-1 font-medium">
              Verify Token المخصص (يمكنك تغييره متى شئت):
            </label>
            <input
              type="text"
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
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

      {/* Step by Step Visual Guide for Beginners */}
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
              <strong className="text-white block text-sm mb-0.5">ضبط الـ Webhook</strong>
              ادخل على تبويب <strong>Webhooks</strong> في القائمة الجانبية، اختر <strong>Instagram</strong> ثم اضغط <strong>Edit Subscription</strong>:
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                <li>الصق رابط الـ Callback URL الموضح بالأعلى.</li>
                <li>الصق الـ Verify Token الموضح بالأعلى.</li>
                <li>اضغط على <strong>Verify and Save</strong> (سيقوم Meta بالتحقق فورياً ويرجع أخضر).</li>
                <li>فعّل الاشتراك في حقل <strong>messages</strong> و <strong>messaging_postbacks</strong>.</li>
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
