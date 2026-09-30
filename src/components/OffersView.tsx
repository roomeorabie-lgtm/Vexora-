import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit3, Trash2, CheckCircle2, Eye, EyeOff, Calendar, Sparkles, X } from 'lucide-react';
import { api } from '../services/api.ts';
import type { Offer } from '../types/index.ts';

export const OffersView: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [offerModal, setOfferModal] = useState<Partial<Offer> | null>(null);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const list = await api.getOffers(false);
      setOffers(list);
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerModal || !offerModal.title || !offerModal.description) return;

    try {
      if (offerModal.id) {
        await api.updateOffer(offerModal.id, offerModal);
      } else {
        await api.createOffer(offerModal);
      }
      setOfferModal(null);
      loadOffers();
    } catch (err) {
      console.error('Failed to save offer:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا العرض الترويجي؟')) return;
    try {
      await api.deleteOffer(id);
      loadOffers();
    } catch (err) {
      console.error('Failed to delete offer:', err);
    }
  };

  const handleToggleActive = async (o: Offer) => {
    try {
      await api.updateOffer(o.id, { is_active: !o.is_active });
      loadOffers();
    } catch (err) {
      console.error('Failed to toggle offer active state:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-400" />
            إدارة العروض الترويجية والخصومات (Offers Management)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            العروض المفعلة هنا تظهر للذكاء الاصطناعي ويذكرها للعملاء عند الاستفسار
          </p>
        </div>

        <button
          onClick={() => setOfferModal({
            title: '',
            description: '',
            start_date: new Date().toISOString().split('T')[0],
            is_active: true
          })}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عرض جديد</span>
        </button>
      </div>

      {/* Offers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            لا توجد عروض مسجلة حالياً. أضف عروضك مثل "دومين مجاني لمدة سنة" ليذكرها الـ AI لعملائك!
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className={`p-5 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between ${
                offer.is_active
                  ? 'border-indigo-500/30 shadow-lg shadow-indigo-500/5'
                  : 'border-slate-800 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      offer.is_active
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      {offer.is_active ? 'العرض نشط ومتاح للـ AI' : 'العرض متوقف'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(offer)}
                      className={`p-1.5 rounded-lg border text-xs ${
                        offer.is_active
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                      title={offer.is_active ? 'إيقاف العرض' : 'تفعيل العرض'}
                    >
                      {offer.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setOfferModal(offer)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="تعديل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(offer.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  {offer.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {offer.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  بدء العرض: {offer.start_date}
                </span>
                {offer.end_date && (
                  <span>ينتهي في: {offer.end_date}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Offer Modal */}
      {offerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {offerModal.id ? 'تعديل العرض' : 'إضافة عرض ترويجي جديد'}
              </h3>
              <button onClick={() => setOfferModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">عنوان العرض:</label>
                <input
                  type="text"
                  required
                  value={offerModal.title || ''}
                  onChange={(e) => setOfferModal({ ...offerModal, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  placeholder="مثال: دومين مجاني لمدة سنة كاملة"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">تفاصيل وشروط العرض:</label>
                <textarea
                  rows={3}
                  required
                  value={offerModal.description || ''}
                  onChange={(e) => setOfferModal({ ...offerModal, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  placeholder="احصل على دومين واستضافة مجاناً عند التعاقد على موقع أو متجر جديد..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">تاريخ البدء:</label>
                  <input
                    type="date"
                    required
                    value={offerModal.start_date || ''}
                    onChange={(e) => setOfferModal({ ...offerModal, start_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">تاريخ الانتهاء (اختياري):</label>
                  <input
                    type="date"
                    value={offerModal.end_date || ''}
                    onChange={(e) => setOfferModal({ ...offerModal, end_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-800/40 rounded-xl">
                <input
                  type="checkbox"
                  id="offer_active"
                  checked={offerModal.is_active !== false}
                  onChange={(e) => setOfferModal({ ...offerModal, is_active: e.target.checked })}
                />
                <label htmlFor="offer_active" className="text-slate-300 cursor-pointer">
                  تفعيل العرض وجعله متاحاً للذكاء الاصطناعي
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOfferModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  حفظ العرض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
