import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.ts';
import { InstagramIntegration } from '../integrations/instagram.ts';
import { GeminiEngine } from '../ai/gemini.ts';
import { AutomationTestSuite } from '../tests/testSuite.ts';
import type { Customer, Message } from '../../src/types/index.ts';

export const apiRouter = express.Router();

// ==========================================
// 1. META INSTAGRAM WEBHOOK ENDPOINTS
// ==========================================

/**
 * Meta Webhook Verification Handshake
 * GET /api/webhook/instagram
 */
apiRouter.get('/webhook/instagram', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const result = InstagramIntegration.verifyWebhook(mode, token, challenge);
  if (result.success && result.challenge) {
    return res.status(200).send(result.challenge);
  }
  return res.status(403).send('Verification token mismatch or invalid request');
});

/**
 * Meta Webhook Incoming Event Receiver
 * POST /api/webhook/instagram
 */
apiRouter.post('/webhook/instagram', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    // Meta requires an immediate 200 OK acknowledgment to prevent retries
    res.status(200).send('EVENT_RECEIVED');

    // Asynchronously process the payload through the automation pipeline
    await InstagramIntegration.handleWebhookPayload(payload);
  } catch (err: any) {
    console.error('Error handling Meta webhook POST payload:', err);
  }
});

// ==========================================
// 2. DASHBOARD STATS
// ==========================================
apiRouter.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. CUSTOMER MANAGEMENT (CRM)
// ==========================================
apiRouter.get('/customers', (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const search = req.query.search as string;
    const customers = db.getCustomers({ status, search });
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/customers/:id', (req: Request, res: Response) => {
  try {
    const customer = db.getCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }
    const conversation = db.getConversationByCustomer(customer.id);
    const messages = conversation ? db.getMessages(conversation.id) : [];
    res.json({ customer, conversation, messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/customers', (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      instagram_username: (data.instagram_username || 'customer').replace('@', '').trim(),
      name: data.name || '',
      phone: data.phone || '',
      requested_service: data.requested_service || '',
      lead_status: data.lead_status || 'New',
      lead_score: Number(data.lead_score) || 50,
      notes: data.notes || '',
      human_required: Boolean(data.human_required),
      first_contact_at: new Date().toISOString(),
      last_contact_at: new Date().toISOString()
    };
    const saved = db.saveCustomer(newCustomer);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/customers/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateCustomer(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/customers/:id', (req: Request, res: Response) => {
  try {
    const success = db.deleteCustomer(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف العميل بنجاح' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. CONVERSATIONS & INBOX
// ==========================================
apiRouter.get('/conversations', (_req: Request, res: Response) => {
  try {
    const conversations = db.getConversations();
    // Augment with customer summary
    const enriched = conversations.map(c => {
      const customer = db.getCustomer(c.customer_id);
      return {
        ...c,
        customer_username: customer?.instagram_username || 'unknown',
        customer_name: customer?.name || '',
        lead_status: customer?.lead_status || 'New',
        lead_score: customer?.lead_score || 0,
        human_required: customer?.human_required || false
      };
    });
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/conversations/:id/messages', (req: Request, res: Response) => {
  try {
    const messages = db.getMessages(req.params.id);
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Human agent sends a manual reply
 */
apiRouter.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'نص الرسالة مطلوب' });
    }

    const conversation = db.getConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'المحادثة غير موجودة' });
    }

    const customer = db.getCustomer(conversation.customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    // Try to send via Meta Instagram Send API if recipient user ID exists
    const recipientId = customer.instagram_user_id || `sim_${customer.instagram_username}`;
    const sendResult = await InstagramIntegration.sendInstagramMessage(recipientId, text.trim());

    // Save human reply
    const newMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversation.id,
      customer_id: customer.id,
      sender: 'human_agent',
      message: text.trim(),
      timestamp: new Date().toISOString(),
      message_type: 'text',
      is_ai: false,
      status: sendResult.success ? (sendResult.simulated ? 'simulated' : 'sent') : 'failed'
    };
    db.saveMessage(newMsg);

    customer.last_response = text.trim();
    customer.last_contact_at = new Date().toISOString();
    db.saveCustomer(customer);

    res.status(201).json(newMsg);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Toggle Human Handoff per conversation
 */
apiRouter.post('/conversations/:id/toggle-handoff', (req: Request, res: Response) => {
  try {
    const conversation = db.getConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'المحادثة غير موجودة' });
    }

    const customer = db.getCustomer(conversation.customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'العميل غير موجود' });
    }

    const newHandoffState = conversation.status !== 'human_handoff';
    conversation.status = newHandoffState ? 'human_handoff' : 'active';
    customer.human_required = newHandoffState;
    if (newHandoffState) {
      customer.lead_status = 'Human Required';
    } else if (customer.lead_status === 'Human Required') {
      customer.lead_status = 'Interested';
    }

    db.saveConversation(conversation);
    db.saveCustomer(customer);

    db.addLog({
      event_type: 'human_handoff',
      status: 'warning',
      customer_id: customer.id,
      instagram_username: customer.instagram_username,
      details: {
        action: newHandoffState ? 'تم تفعيل التحويل لموظف بشري يدويًا' : 'تم استئناف الرد الآلي للذكاء الاصطناعي',
        updated_by: 'Admin'
      }
    });

    res.json({ conversation, customer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. SERVICES MANAGEMENT
// ==========================================
apiRouter.get('/services', (req: Request, res: Response) => {
  try {
    const onlyActive = req.query.active === 'true';
    res.json(db.getServices(onlyActive));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/services', (req: Request, res: Response) => {
  try {
    const { name, slug, description, is_active, notes } = req.body;
    if (!name || !description) {
      return res.status(400).json({ error: 'اسم الخدمة والوصف مطلوبان' });
    }
    const newService = {
      id: `srv-${Date.now()}`,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      is_active: is_active !== false,
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.saveService(newService);
    res.status(201).json(newService);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/services/:id', (req: Request, res: Response) => {
  try {
    const existing = db.getService(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'الخدمة غير موجودة' });
    }
    const updated = db.saveService({
      ...existing,
      ...req.body,
      id: existing.id
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/services/:id', (req: Request, res: Response) => {
  try {
    const success = db.deleteService(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'الخدمة غير موجودة' });
    }
    res.json({ success: true, message: 'تم حذف الخدمة بنجاح' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. PRICING MANAGEMENT (Strict Zero-Hallucination)
// ==========================================
apiRouter.get('/pricing', (req: Request, res: Response) => {
  try {
    const onlyActive = req.query.active === 'true';
    res.json(db.getPricing(onlyActive));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/pricing', (req: Request, res: Response) => {
  try {
    const { service_id, service_name, title, starting_price, currency, details, is_active, notes } = req.body;
    if (!service_id || !title || starting_price === undefined) {
      return res.status(400).json({ error: 'الخدمة، عنوان الباقة، والسعر المبدئي مطلوبة' });
    }
    const newPricing = {
      id: `prc-${Date.now()}`,
      service_id,
      service_name: service_name || 'خدمة Vexora',
      title,
      starting_price: Number(starting_price),
      currency: currency || 'EGP',
      details: details || '',
      is_active: is_active !== false,
      notes: notes || '',
      created_at: new Date().toISOString()
    };
    db.savePricing(newPricing);
    res.status(201).json(newPricing);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/pricing/:id', (req: Request, res: Response) => {
  try {
    const existing = db.getPricing().find(p => p.id === req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'بيان السعر غير موجود' });
    }
    const updated = db.savePricing({
      ...existing,
      ...req.body,
      id: existing.id
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/pricing/:id', (req: Request, res: Response) => {
  try {
    const success = db.deletePricing(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'بيان السعر غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف بيان السعر بنجاح' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. OFFERS MANAGEMENT
// ==========================================
apiRouter.get('/offers', (req: Request, res: Response) => {
  try {
    const onlyActive = req.query.active === 'true';
    res.json(db.getOffers(onlyActive));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/offers', (req: Request, res: Response) => {
  try {
    const { title, description, start_date, end_date, is_active } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'عنوان العرض والوصف مطلوبان' });
    }
    const newOffer = {
      id: `ofr-${Date.now()}`,
      title,
      description,
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date: end_date || undefined,
      is_active: is_active !== false,
      created_at: new Date().toISOString()
    };
    db.saveOffer(newOffer);
    res.status(201).json(newOffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/offers/:id', (req: Request, res: Response) => {
  try {
    const existing = db.getOffers().find(o => o.id === req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'العرض غير موجود' });
    }
    const updated = db.saveOffer({
      ...existing,
      ...req.body,
      id: existing.id
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/offers/:id', (req: Request, res: Response) => {
  try {
    const success = db.deleteOffer(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'العرض غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف العرض بنجاح' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. AI SETTINGS & SYSTEM PROMPT
// ==========================================
apiRouter.get('/ai-settings', (_req: Request, res: Response) => {
  try {
    res.json(db.getAISettings());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/ai-settings', (req: Request, res: Response) => {
  try {
    const updated = db.updateAISettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Toggle AI ON / OFF global switch
 */
apiRouter.post('/ai-settings/toggle', (req: Request, res: Response) => {
  try {
    const current = db.getAISettings();
    const updated = db.updateAISettings({ is_ai_enabled: !current.is_ai_enabled });
    
    db.addLog({
      event_type: 'ai_intent',
      status: updated.is_ai_enabled ? 'success' : 'warning',
      details: {
        action: updated.is_ai_enabled ? 'تم تفعيل أتمتة الذكاء الاصطناعي (AI Automation ON)' : 'تم إيقاف أتمتة الذكاء الاصطناعي (AI Automation OFF)',
        updated_by: 'Admin'
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Live test of user message directly through Gemini
 */
apiRouter.post('/ai-settings/test-prompt', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'نص الرسالة مطلوب للاختبار' });
    }
    const startTime = Date.now();
    const analysis = await GeminiEngine.analyzeAndRespond(message.trim());
    const duration = Date.now() - startTime;
    res.json({ ...analysis, duration_ms: duration });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. SYSTEM SETTINGS & INTEGRATIONS
// ==========================================
apiRouter.get('/system-settings', (_req: Request, res: Response) => {
  try {
    const settings = db.getSystemSettings();
    // Mask sensitive access token
    const safeSettings = {
      ...settings,
      instagram_access_token: settings.instagram_access_token ? '••••••••••••••••••••••••••••••••' : ''
    };
    res.json(safeSettings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/system-settings', (req: Request, res: Response) => {
  try {
    const updates = { ...req.body };
    // Only update access token if a real new one was provided (not masked)
    if (updates.instagram_access_token && updates.instagram_access_token.includes('•••')) {
      delete updates.instagram_access_token;
    }
    const updated = db.updateSystemSettings(updates);
    res.json({
      ...updated,
      instagram_access_token: updated.instagram_access_token ? '••••••••••••••••••••••••••••••••' : ''
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. SYSTEM & AUTOMATION LOGS
// ==========================================
apiRouter.get('/logs', (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 100;
    res.json(db.getLogs(limit));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/logs', (_req: Request, res: Response) => {
  try {
    db.clearLogs();
    res.json({ success: true, message: 'تم مسح السجلات بنجاح' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. AUTOMATED TEST SUITE (10 CHECKS)
// ==========================================
apiRouter.post('/test-suite/run', async (_req: Request, res: Response) => {
  try {
    const report = await AutomationTestSuite.runAllTests();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 12. INSTAGRAM SIMULATOR (LIVE TRIAL IN DASHBOARD)
// ==========================================
apiRouter.post('/simulate/incoming', async (req: Request, res: Response) => {
  try {
    const { username, message, senderId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'نص الرسالة مطلوب' });
    }
    const cleanUser = (username || 'simulated_lead').replace('@', '').trim();
    const uid = senderId || `sim_user_${cleanUser}_${Date.now()}`;

    const result = await InstagramIntegration.processIncomingMessage(
      uid,
      message.trim(),
      undefined,
      cleanUser
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
