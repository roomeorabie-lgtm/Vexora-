import type { 
  Customer, 
  Conversation, 
  Message, 
  Service, 
  Pricing, 
  Offer, 
  AISettings, 
  SystemSettings, 
  AutomationLog, 
  DashboardStats,
  AIAnalysisResult,
  TestResultItem
} from '../types/index.ts';

const BASE_URL = '/api';

export const api = {
  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${BASE_URL}/stats`);
    if (!res.ok) throw new Error('فشل جلب إحصائيات لوحة التحكم');
    return res.json();
  },

  // Customers
  async getCustomers(status?: string, search?: string): Promise<Customer[]> {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);
    const res = await fetch(`${BASE_URL}/customers?${params.toString()}`);
    if (!res.ok) throw new Error('فشل جلب قائمة العملاء');
    return res.json();
  },

  async getCustomer(id: string): Promise<{ customer: Customer; conversation?: Conversation; messages: Message[] }> {
    const res = await fetch(`${BASE_URL}/customers/${id}`);
    if (!res.ok) throw new Error('فشل جلب تفاصيل العميل');
    return res.json();
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const res = await fetch(`${BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('فشل تحديث بيانات العميل');
    return res.json();
  },

  async deleteCustomer(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/customers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('فشل حذف العميل');
  },

  // Conversations & Messages
  async getConversations(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/conversations`);
    if (!res.ok) throw new Error('فشل جلب المحادثات');
    return res.json();
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`);
    if (!res.ok) throw new Error('فشل جلب الرسائل');
    return res.json();
  },

  async sendHumanReply(conversationId: string, text: string): Promise<Message> {
    const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error('فشل إرسال الرد البشري');
    return res.json();
  },

  async toggleHumanHandoff(conversationId: string): Promise<{ conversation: Conversation; customer: Customer }> {
    const res = await fetch(`${BASE_URL}/conversations/${conversationId}/toggle-handoff`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('فشل تعديل حالة التحويل لموظف بشري');
    return res.json();
  },

  // Services
  async getServices(activeOnly = false): Promise<Service[]> {
    const res = await fetch(`${BASE_URL}/services?active=${activeOnly}`);
    if (!res.ok) throw new Error('فشل جلب الخدمات');
    return res.json();
  },

  async createService(data: Partial<Service>): Promise<Service> {
    const res = await fetch(`${BASE_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('فشل إنشاء الخدمة');
    return res.json();
  },

  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    const res = await fetch(`${BASE_URL}/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('فشل تحديث الخدمة');
    return res.json();
  },

  async deleteService(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/services/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('فشل حذف الخدمة');
  },

  // Pricing
  async getPricing(activeOnly = false): Promise<Pricing[]> {
    const res = await fetch(`${BASE_URL}/pricing?active=${activeOnly}`);
    if (!res.ok) throw new Error('فشل جلب الأسعار');
    return res.json();
  },

  async createPricing(data: Partial<Pricing>): Promise<Pricing> {
    const res = await fetch(`${BASE_URL}/pricing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('فشل إنشاء بيان السعر');
    return res.json();
  },

  async updatePricing(id: string, data: Partial<Pricing>): Promise<Pricing> {
    const res = await fetch(`${BASE_URL}/pricing/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('فشل تحديث بيان السعر');
    return res.json();
  },

  async deletePricing(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/pricing/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('فشل حذف بيان السعر');
  },

  // Offers
  async getOffers(activeOnly = false): Promise<Offer[]> {
    const res = await fetch(`${BASE_URL}/offers?active=${activeOnly}`);
    if (!res.ok) throw new Error('فشل جلب العروض');
    return res.json();
  },

  async createOffer(data: Partial<Offer>): Promise<Offer> {
    const res = await fetch(`${BASE_URL}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('فشل إنشاء العرض');
    return res.json();
  },

  async updateOffer(id: string, data: Partial<Offer>): Promise<Offer> {
    const res = await fetch(`${BASE_URL}/offers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('فشل تحديث العرض');
    return res.json();
  },

  async deleteOffer(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/offers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('فشل حذف العرض');
  },

  // AI Settings
  async getAISettings(): Promise<AISettings> {
    const res = await fetch(`${BASE_URL}/ai-settings`);
    if (!res.ok) throw new Error('فشل جلب إعدادات الذكاء الاصطناعي');
    return res.json();
  },

  async updateAISettings(data: Partial<AISettings>): Promise<AISettings> {
    const res = await fetch(`${BASE_URL}/ai-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('فشل تحديث إعدادات الذكاء الاصطناعي');
    return res.json();
  },

  async toggleAIAutomation(): Promise<AISettings> {
    const res = await fetch(`${BASE_URL}/ai-settings/toggle`, { method: 'POST' });
    if (!res.ok) throw new Error('فشل تغيير حالة الذكاء الاصطناعي');
    return res.json();
  },

  async testAIPrompt(message: string): Promise<AIAnalysisResult & { duration_ms: number }> {
    const res = await fetch(`${BASE_URL}/ai-settings/test-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('فشل اختبار الرد الذكي');
    return res.json();
  },

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    const res = await fetch(`${BASE_URL}/system-settings`);
    if (!res.ok) throw new Error('فشل جلب إعدادات النظام');
    return res.json();
  },

  async updateSystemSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch(`${BASE_URL}/system-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('فشل حفظ إعدادات النظام');
    return res.json();
  },

  // Logs
  async getLogs(limit = 100): Promise<AutomationLog[]> {
    const res = await fetch(`${BASE_URL}/logs?limit=${limit}`);
    if (!res.ok) throw new Error('فشل جلب السجلات');
    return res.json();
  },

  async clearLogs(): Promise<void> {
    const res = await fetch(`${BASE_URL}/logs`, { method: 'DELETE' });
    if (!res.ok) throw new Error('فشل مسح السجلات');
  },

  // Automated Test Suite
  async runTestSuite(): Promise<{
    timestamp: string;
    total: number;
    passed: number;
    failed: number;
    results: TestResultItem[];
  }> {
    const res = await fetch(`${BASE_URL}/test-suite/run`, { method: 'POST' });
    if (!res.ok) throw new Error('فشل تشغيل حزمة الاختبارات');
    return res.json();
  },

  // Live Simulator
  async simulateIncoming(username: string, message: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/simulate/incoming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, message })
    });
    if (!res.ok) throw new Error('فشل محاكاة رسالة إنستغرام');
    return res.json();
  }
};
