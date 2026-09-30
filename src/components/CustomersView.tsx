import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Phone, 
  Calendar, 
  MessageSquare, 
  Flame, 
  Check, 
  X, 
  UserCheck,
  Plus
} from 'lucide-react';
import { api } from '../services/api.ts';
import type { Customer, LeadStatus } from '../types/index.ts';

interface CustomersViewProps {
  customers: Customer[];
  onRefresh: () => void;
  onOpenConversation?: (customerId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onRefresh,
  onOpenConversation
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const statuses: Array<{ value: LeadStatus; label: string; color: string }> = [
    { value: 'New', label: 'جديد (New)', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { value: 'Interested', label: 'مهتم (Interested)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { value: 'Waiting', label: 'في الانتظار (Waiting)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { value: 'Converted', label: 'تم التحويل (Converted)', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { value: 'Not Interested', label: 'غير مهتم (Not Interested)', color: 'bg-slate-700/50 text-slate-400 border-slate-700' },
    { value: 'Human Required', label: 'مطلوب موظف (Human Required)', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
  ];

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.instagram_username.toLowerCase().includes(search.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search)) ||
      (c.requested_service && c.requested_service.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || c.lead_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setIsSaving(true);
    try {
      await api.updateCustomer(editingCustomer.id, editingCustomer);
      setEditingCustomer(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to update customer:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا العميل ومحادثاته؟')) return;
    try {
      await api.deleteCustomer(id);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete customer:', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            إدارة العملاء ودرجات الاهتمام (CRM & Lead Scoring)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            متابعة العملاء القادمين من إنستغرام، تحديث حالات الطلبات، وإضافة الملاحظات
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم، @username، أو الهاتف..."
              className="bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52 sm:w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">كل الحالات ({customers.length})</option>
            <option value="New">جديد (New)</option>
            <option value="Interested">مهتم (Interested)</option>
            <option value="Waiting">في الانتظار (Waiting)</option>
            <option value="Converted">تم التعاقد (Converted)</option>
            <option value="Human Required">مطلوب موظف (Human Required)</option>
            <option value="Not Interested">غير مهتم</option>
          </select>
        </div>
      </div>

      {/* Customers Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">العميل / إنستغرام</th>
                <th className="py-3.5 px-4">الخدمة المطلوبة</th>
                <th className="py-3.5 px-4">درجة الاهتمام (Lead Score)</th>
                <th className="py-3.5 px-4">حالة العميل</th>
                <th className="py-3.5 px-4">آخر تواصل</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    لا يوجد عملاء مطابقين للبحث. يمكنك إضافة عملاء أو استخدام محاكي إنستغرام لإنشاء عملاء جدد فورياً.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const score = cust.lead_score || 50;
                  const scoreColor =
                    score >= 80 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                    score >= 50 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                    score >= 20 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                    'text-slate-400 bg-slate-800 border-slate-700';

                  const statusConfig = statuses.find(s => s.value === cust.lead_status);

                  return (
                    <tr key={cust.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                            {cust.instagram_username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white">
                              @{cust.instagram_username}
                            </div>
                            {cust.name && (
                              <div className="text-[11px] text-slate-400">{cust.name}</div>
                            )}
                            {cust.phone && (
                              <div className="text-[11px] text-indigo-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />
                                <span>{cust.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Requested Service */}
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {cust.requested_service ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/60 inline-block">
                            {cust.requested_service}
                          </span>
                        ) : (
                          <span className="text-slate-500">لم تحدد</span>
                        )}
                      </td>

                      {/* Lead Score */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                score >= 80 ? 'bg-rose-500' :
                                score >= 50 ? 'bg-emerald-500' :
                                score >= 20 ? 'bg-amber-500' :
                                'bg-slate-500'
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${scoreColor}`}>
                            {score}%
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusConfig?.color || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                          {statusConfig?.label || cust.lead_status}
                        </span>
                      </td>

                      {/* Last Contact */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(cust.last_contact_at).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingCustomer(cust)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="تعديل بيانات العميل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cust.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                تعديل بيانات العميل (@{editingCustomer.instagram_username})
              </h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">اسم العميل:</label>
                  <input
                    type="text"
                    value={editingCustomer.name || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                    placeholder="الاسم الحقيقي"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    value={editingCustomer.phone || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                    placeholder="010XXXXXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">حالة العميل (Status):</label>
                  <select
                    value={editingCustomer.lead_status}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, lead_status: e.target.value as LeadStatus })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    {statuses.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">درجة الاهتمام (0-100):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingCustomer.lead_score}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, lead_score: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">الخدمة المطلوبة:</label>
                <input
                  type="text"
                  value={editingCustomer.requested_service || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, requested_service: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  placeholder="تصميم موقع شركة، متجر إلكتروني..."
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-800/40 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  id="human_req"
                  checked={editingCustomer.human_required}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, human_required: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <label htmlFor="human_req" className="text-slate-300 font-medium cursor-pointer">
                  تحويل لموظف بشري (إيقاف الرد التلقائي للـ AI لهذا العميل)
                </label>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ملاحظات داخلية (Notes):</label>
                <textarea
                  rows={3}
                  value={editingCustomer.notes || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  placeholder="سجل أي تفاصيل خاصة باتفاق أو ميزانية العميل هنا..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
