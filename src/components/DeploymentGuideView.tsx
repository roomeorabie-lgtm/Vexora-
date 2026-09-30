import React, { useState } from 'react';
import { 
  BookOpen, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  Server, 
  Database, 
  Globe, 
  ShieldCheck, 
  Code2, 
  Key 
} from 'lucide-react';

export const DeploymentGuideView: React.FC = () => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const envSample = `# المتغيرات البيئية لـ Vexora AI Automation في Vercel
GEMINI_API_KEY="AIzaSy..." # مفتاح Gemini من Google AI Studio
INSTAGRAM_VERIFY_TOKEN="vexora_secure_webhook_token_2026" # رمز التحقق الذي تضعه في Meta Webhook
META_APP_SECRET="abc123..." # سري التطبيق للتحقق من X-Hub-Signature-256
META_ACCESS_TOKEN="EAA..." # توكن وصول إنستغرام الدائم للردود
INSTAGRAM_ACCOUNT_ID="1784..." # معرف حساب إنستغرام للأعمال
META_APP_ID="987..." # معرف تطبيق Meta
SUPABASE_URL="https://your-project.supabase.co" # رابط Supabase (اختياري)
SUPABASE_SERVICE_ROLE_KEY="eyJ..." # مفتاح الخدمة السري لـ Supabase (اختياري)
PORT=3000
NODE_ENV="production"`;

  const supabaseSql = `-- جدول العملاء وإدارة الليدز
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_username TEXT NOT NULL,
  instagram_user_id TEXT,
  name TEXT,
  phone TEXT,
  requested_service TEXT,
  last_message TEXT,
  last_response TEXT,
  first_contact_at TIMESTAMPTZ DEFAULT NOW(),
  last_contact_at TIMESTAMPTZ DEFAULT NOW(),
  lead_status TEXT DEFAULT 'New',
  lead_score INTEGER DEFAULT 50,
  notes TEXT,
  human_required BOOLEAN DEFAULT FALSE,
  tags TEXT[]
);

-- جدول المحادثات
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  channel TEXT DEFAULT 'instagram',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ
);

-- جدول الرسائل
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  message_type TEXT DEFAULT 'text',
  is_ai BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'received',
  instagram_mid TEXT,
  metadata JSONB
);

-- جدول الخدمات الرسمية
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الأسعار
CREATE TABLE IF NOT EXISTS pricing (
  id TEXT PRIMARY KEY,
  service_id TEXT,
  service_name TEXT,
  title TEXT NOT NULL,
  starting_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'EGP',
  details TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول العروض
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          دليل التشغيل والنشر Production خطوة بخطوة للمبتدئين
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          شرح مبسط وواضح لإعداد Supabase، Meta Developer App، Vercel، وربط Instagram بدون الحاجة لخبرة برمجية مسبقة
        </p>
      </div>

      {/* 15 Steps Accordion/Cards */}
      <div className="space-y-4 text-xs">
        {/* Step 1 & 2: Env Vars */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                1
              </span>
              المتغيرات البيئية (Environment Variables)
            </h3>
            <button
              onClick={() => handleCopy(envSample, 'env')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
            >
              {copiedItem === 'env' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedItem === 'env' ? 'تم النسخ' : 'نسخ ملف .env'}</span>
            </button>
          </div>
          <p className="text-slate-300">
            أنشئ ملفاً باسم <code className="text-indigo-300">.env</code> في المجلد الرئيسي وضع به القيم التالية (لا تضع أي مفاتيح في كود الفرونت إند أبداً):
          </p>
          <pre className="p-4 bg-slate-950 rounded-xl font-mono text-[11px] text-indigo-300 overflow-x-auto border border-slate-800">
            {envSample}
          </pre>
        </div>

        {/* Step 3 & 4: Supabase Setup */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                2
              </span>
              إعداد قاعدة بيانات Supabase (اختياري للربط السحابي)
            </h3>
            <div className="flex items-center gap-2">
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-700 flex items-center gap-1"
              >
                <span>فتح Supabase</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => handleCopy(supabaseSql, 'sql')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
              >
                {copiedItem === 'sql' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedItem === 'sql' ? 'تم نسخ SQL' : 'نسخ كود الجداول SQL'}</span>
              </button>
            </div>
          </div>
          <p className="text-slate-300">
            النظام يأتي مزوداً بمخزن بيانات متكامل دائم محلياً على السيرفر. إذا أردت ربط Supabase أيضاً:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-300">
            <li>افتح موقع Supabase وأنشئ مشروعاً جديداً.</li>
            <li>ادخل على <strong>SQL Editor</strong> والصق الكود الموجود أدناه لتوليد كل الجداول والعلاقات بضغطة زر.</li>
            <li>انسخ رابط المشروع <code>SUPABASE_URL</code> ومفتاح <code>service_role</code> وضعهما في إعدادات البيئة.</li>
          </ol>
          <pre className="p-4 bg-slate-950 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-48 border border-slate-800">
            {supabaseSql}
          </pre>
        </div>

        {/* Step 5: Gemini API */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              3
            </span>
            مفتاح Gemini API من Google AI Studio
          </h3>
          <p className="text-slate-300 leading-relaxed">
            داخل Google AI Studio يتم حقن مفتاح <code className="text-indigo-300">GEMINI_API_KEY</code> تلقائياً من إعدادات الـ Secrets. في حال النشر الخارجي على سيرفر خاص أو Vercel، احصل على المفتاح مجاناً من <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 underline">aistudio.google.com/app/apikey</a> وضعه في متغيرات البيئة.
          </p>
        </div>

        {/* Step 6 to 11: Meta & Instagram */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              4
            </span>
            ربط Meta Developer App و Webhook إنستغرام
          </h3>
          <div className="space-y-2 text-slate-300 leading-relaxed">
            <p>
              1. ادخل على <strong>Meta for Developers</strong> وأنشئ تطبيقاً من نوع <strong>Business</strong>.
            </p>
            <p>
              2. أضف منتج <strong>Instagram Graph API</strong> واربطه بصفحة فيسبوك المتصلة بحساب إنستغرام لبراند Vexora.
            </p>
            <p>
              3. ادخل على <strong>Webhooks</strong> ثم <strong>Instagram</strong> واضغط <strong>Edit Subscription</strong>:
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-slate-400 font-mono text-[11px]">
              <div>Callback URL: <span className="text-indigo-300 font-bold">https://vexora-x.vercel.app/api/instagram/webhook</span></div>
              <div>Verify Token: <span className="text-emerald-300 font-bold">vexora_secure_webhook_token_2026</span> (أو الرمز من لوحة التحكم)</div>
            </div>
            <p>
              4. اضغط <strong>Verify and Save</strong>، ثم ضع علامة صح بجوار <strong>messages</strong> لتستقبل الرسائل النصية.
            </p>
            <p>
              5. من إعدادات Instagram في التطبيق، اضغط <strong>Generate Token</strong> وانسخ الـ Access Token وضعه في تبويب <em>ربط إنستغرام وميتا API</em> بلوحة التحكم.
            </p>
          </div>
        </div>

        {/* Step 14 & 15: Vercel Deployment */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              5
            </span>
            نشر المشروع على Vercel (Production Serverless)
          </h3>
          <div className="space-y-2 text-slate-300 leading-relaxed">
            <p>
              1. تأكد من وجود ملف <code>vercel.json</code> ومجلد <code>api/instagram/webhook.ts</code> المرفقين بالمشروع لدعم وظائف Serverless.
            </p>
            <p>
              2. في لوحة تحكم مشروعك في <strong>Vercel (Settings &gt; Environment Variables)</strong> أضف:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400 font-mono">
              <li>GEMINI_API_KEY</li>
              <li>INSTAGRAM_VERIFY_TOKEN</li>
              <li>META_APP_SECRET</li>
              <li>META_ACCESS_TOKEN</li>
              <li>INSTAGRAM_ACCOUNT_ID</li>
              <li>META_APP_ID</li>
            </ul>
            <p>
              3. بعد الـ Redeploy، يصبح الرابط <code>https://vexora-x.vercel.app/api/instagram/webhook</code> نشطاً ومستعداً لمصادقة Meta الفورية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
