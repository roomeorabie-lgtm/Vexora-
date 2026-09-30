import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ShieldAlert,
  Sparkles,
  X
} from 'lucide-react';
import { api } from '../services/api.ts';
import type { Service, Pricing } from '../types/index.ts';

export const ServicesPricingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'pricing'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [serviceModal, setServiceModal] = useState<Partial<Service> | null>(null);
  const [pricingModal, setPricingModal] = useState<Partial<Pricing> | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [srvList, prcList] = await Promise.all([
        api.getServices(false),
        api.getPricing(false)
      ]);
      setServices(srvList);
      setPricing(prcList);
    } catch (err) {
      console.error('Failed to load services and pricing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for Services
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceModal || !serviceModal.name || !serviceModal.description) return;

    try {
      if (serviceModal.id) {
        await api.updateService(serviceModal.id, serviceModal);
      } else {
        await api.createService(serviceModal);
      }
      setServiceModal(null);
      loadData();
    } catch (err) {
      console.error('Failed to save service:', err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;
    try {
      await api.deleteService(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
  };

  const handleToggleServiceActive = async (service: Service) => {
    try {
      await api.updateService(service.id, { is_active: !service.is_active });
      loadData();
    } catch (err) {
      console.error('Failed to toggle service:', err);
    }
  };

  // Handlers for Pricing
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingModal || !pricingModal.title || !pricingModal.service_id) return;

    try {
      const selectedService = services.find(s => s.id === pricingModal.service_id);
      const payload = {
        ...pricingModal,
        service_name: selectedService?.name || 'خدمة Vexora'
      };

      if (pricingModal.id) {
        await api.updatePricing(pricingModal.id, payload);
      } else {
        await api.createPricing(payload);
      }
      setPricingModal(null);
      loadData();
    } catch (err) {
      console.error('Failed to save pricing:', err);
    }
  };

  const handleDeletePricing = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السعر؟')) return;
    try {
      await api.deletePricing(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete pricing:', err);
    }
  };

  const handleTogglePricingActive = async (prc: Pricing) => {
    try {
      await api.updatePricing(prc.id, { is_active: !prc.is_active });
      loadData();
    } catch (err) {
      console.error('Failed to toggle pricing:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice: Zero-Hallucination Source of Truth */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3 text-xs text-indigo-200">
        <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block text-sm mb-0.5">
            مصدر الحقيقة المطلق للذكاء الاصطناعي (Strict Zero-Hallucination Policy)
          </strong>
          كل الخدمات والأسعار التي تضيفها هنا هي فقط ما يُسمح لـ Gemini بذكره لعملاء إنستغرام. إذا تم إخفاء أو حذف سعر خدمة معينة، يمتنع الذكاء الاصطناعي تلقائياً عن اختلاق أي رقم ويوضح للعميل أن السعر يتحدد بدقة بناءً على المواصفات.
        </div>
      </div>

      {/* Tabs & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'services'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>الخدمات المتاحة ({services.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'pricing'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>باقات الأسعار الرسمية ({pricing.length})</span>
          </button>
        </div>

        {activeTab === 'services' ? (
          <button
            onClick={() => setServiceModal({ name: '', description: '', is_active: true, notes: '' })}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة خدمة جديدة</span>
          </button>
        ) : (
          <button
            onClick={() => setPricingModal({
              service_id: services[0]?.id || '',
              title: '',
              starting_price: 5000,
              currency: 'EGP',
              details: '',
              is_active: true
            })}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة باقة سعر رسمية</span>
          </button>
        )}
      </div>

      {/* Services Tab View */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={`p-5 rounded-2xl bg-slate-900 border transition-all ${
                service.is_active ? 'border-slate-800' : 'border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-white text-base">{service.name}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">slug: {service.slug}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleServiceActive(service)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      service.is_active
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                    title={service.is_active ? 'الخدمة ظاهرة للـ AI' : 'الخدمة مخفية عن الـ AI'}
                  >
                    {service.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setServiceModal(service)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="تعديل"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {service.description}
              </p>

              {service.notes && (
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 text-[11px] text-slate-400">
                  <strong className="text-slate-300">ملاحظات داخلية للـ AI:</strong> {service.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pricing Tab View */}
      {activeTab === 'pricing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pricing.map((prc) => (
            <div
              key={prc.id}
              className={`p-5 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between ${
                prc.is_active ? 'border-slate-800' : 'border-slate-800/60 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {prc.service_name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePricingActive(prc)}
                      className={`p-1.5 rounded-lg border text-xs ${
                        prc.is_active
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {prc.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setPricingModal(prc)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePricing(prc.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-white text-base mb-1">{prc.title}</h4>

                <div className="my-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-0.5">يبدأ من:</span>
                  <div className="text-xl font-extrabold text-emerald-400">
                    {prc.starting_price.toLocaleString('ar-EG')} {prc.currency}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {prc.details}
                </p>
              </div>

              {prc.notes && (
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  {prc.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Service Modal */}
      {serviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {serviceModal.id ? 'تعديل الخدمة' : 'إضافة خدمة جديدة لـ Vexora'}
              </h3>
              <button onClick={() => setServiceModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">اسم الخدمة:</label>
                <input
                  type="text"
                  required
                  value={serviceModal.name || ''}
                  onChange={(e) => setServiceModal({ ...serviceModal, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  placeholder="مثال: تصميم وتطوير المتاجر الإلكترونية"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">وصف الخدمة الكامل:</label>
                <textarea
                  rows={3}
                  required
                  value={serviceModal.description || ''}
                  onChange={(e) => setServiceModal({ ...serviceModal, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  placeholder="اشرح ميزات الخدمة بدقة ليتمكن الـ AI من إجابة العملاء بناءً عليها..."
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">ملاحظات فنية أو إضافية للـ AI:</label>
                <textarea
                  rows={2}
                  value={serviceModal.notes || ''}
                  onChange={(e) => setServiceModal({ ...serviceModal, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  placeholder="مثال: تشمل بوابات دفع، استضافة لمدة سنة..."
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-800/40 rounded-xl">
                <input
                  type="checkbox"
                  id="srv_active"
                  checked={serviceModal.is_active !== false}
                  onChange={(e) => setServiceModal({ ...serviceModal, is_active: e.target.checked })}
                />
                <label htmlFor="srv_active" className="text-slate-300 cursor-pointer">
                  تفعيل الخدمة وجعلها متاحة لردود الذكاء الاصطناعي
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setServiceModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  حفظ الخدمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {pricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {pricingModal.id ? 'تعديل السعر الرسمي' : 'إضافة باقة سعر رسمية'}
              </h3>
              <button onClick={() => setPricingModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">الخدمة التابعة لها الباقة:</label>
                <select
                  value={pricingModal.service_id || ''}
                  onChange={(e) => setPricingModal({ ...pricingModal, service_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">عنوان الباقة:</label>
                <input
                  type="text"
                  required
                  value={pricingModal.title || ''}
                  onChange={(e) => setPricingModal({ ...pricingModal, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  placeholder="مثال: باقة المتجر الإلكتروني المتكامل"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">السعر المبدئي (يبدأ من):</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={pricingModal.starting_price || 0}
                    onChange={(e) => setPricingModal({ ...pricingModal, starting_price: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">العملة:</label>
                  <select
                    value={pricingModal.currency || 'EGP'}
                    onChange={(e) => setPricingModal({ ...pricingModal, currency: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">تفاصيل الباقة والمميزات:</label>
                <textarea
                  rows={3}
                  required
                  value={pricingModal.details || ''}
                  onChange={(e) => setPricingModal({ ...pricingModal, details: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  placeholder="تشمل حتى 5 صفحات، دومين مجاني لسنة، استضافة..."
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-800/40 rounded-xl">
                <input
                  type="checkbox"
                  id="prc_active"
                  checked={pricingModal.is_active !== false}
                  onChange={(e) => setPricingModal({ ...pricingModal, is_active: e.target.checked })}
                />
                <label htmlFor="prc_active" className="text-slate-300 cursor-pointer">
                  تفعيل السعر وإتاحته للـ AI
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPricingModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  حفظ السعر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
