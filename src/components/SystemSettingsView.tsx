import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Shield, RefreshCw } from 'lucide-react';
import { api } from '../services/api.ts';
import type { SystemSettings } from '../types/index.ts';

export const SystemSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSuccessMsg(null);
    try {
      const updated = await api.updateSystemSettings(settings);
      setSettings(updated);
      setSuccessMsg('تم حفظ إعدادات النظام بنجاح!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to update system settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-slate-500 text-xs">جاري تحميل إعدادات النظام...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          إعدادات النظام العامة (System Settings)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          تكوين اسم البراند وهوية التطبيق وقنوات الاتصال
        </p>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
        <div>
          <label className="text-slate-300 block mb-1 font-medium">اسم البراند التجاري:</label>
          <input
            type="text"
            value={settings.brand_name}
            onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
          />
        </div>

        <div>
          <label className="text-slate-300 block mb-1 font-medium">وضع تشغيل إنستغرام:</label>
          <select
            value={settings.instagram_mode}
            onChange={(e) => setSettings({ ...settings, instagram_mode: e.target.value as any })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
          >
            <option value="live">وضع الإنتاج الحي (Live Meta Graph API)</option>
            <option value="sandbox">وضع المحاكاة والاختبار (Sandbox)</option>
          </select>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold">
            <Shield className="w-4 h-4" />
            <span>حالة تكامل الخدمات السحابية:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div>
              Gemini AI: <span className="text-emerald-400 font-bold">متصل ونشط (Flash 3.8)</span>
            </div>
            <div>
              Supabase Cloud DB: <span className={settings.supabase_configured ? 'text-emerald-400 font-bold' : 'text-slate-400 font-normal'}>
                {settings.supabase_configured ? 'متصل' : 'قاعدة بيانات محلية مستمرة'}
              </span>
            </div>
            <div>
              Meta Graph API: <span className={settings.instagram_access_token_configured ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {settings.instagram_access_token_configured ? 'توكن الوصول جاهز' : 'وضع المحاكاة متاح'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {successMsg && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {successMsg}
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="mr-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات النظام'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
