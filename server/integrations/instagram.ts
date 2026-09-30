import crypto from 'crypto';
import { db } from '../db/database.ts';
import { GeminiEngine } from '../ai/gemini.ts';
import { ResponseValidator } from '../ai/validator.ts';
import type { Customer, Conversation, Message, AutomationLog } from '../../src/types/index.ts';

export interface MetaWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    time: number;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        attachments?: any[];
      };
      delivery?: any;
      read?: any;
    }>;
  }>;
}

export class InstagramIntegration {
  /**
   * Step 1: Webhook Handshake Verification (Meta Hub Challenge)
   */
  static verifyWebhook(mode?: string, token?: string, challenge?: string): { success: boolean; challenge?: string; error?: string } {
    const systemSettings = db.getSystemSettings();
    const expectedToken = process.env.INSTAGRAM_VERIFY_TOKEN || systemSettings.instagram_verify_token;

    if (mode === 'subscribe' && token === expectedToken) {
      db.addLog({
        event_type: 'webhook_received',
        status: 'success',
        details: { mode, verified: true, timestamp: new Date().toISOString() }
      });
      return { success: true, challenge };
    }

    db.addLog({
      event_type: 'error',
      status: 'error',
      details: {
        reason: 'فشل التحقق من Webhook Token',
        received_token: token ? `${token.substring(0, 4)}***` : 'none',
        expected_token: `${expectedToken.substring(0, 4)}***`
      }
    });

    return { success: false, error: 'Verification token mismatch or invalid mode' };
  }

  /**
   * Step 2: Full Automation Pipeline for incoming message
   */
  static async processIncomingMessage(
    senderId: string,
    messageText: string,
    messageMid?: string,
    providedUsername?: string
  ): Promise<{
    success: boolean;
    customer: Customer;
    replyText?: string;
    aiResponded: boolean;
    reason?: string;
  }> {
    const startTime = Date.now();
    const cleanMid = messageMid || `sim_mid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Duplicate event prevention
    if (db.isDuplicateWebhook(cleanMid)) {
      db.addLog({
        event_type: 'duplicate_skipped',
        status: 'warning',
        message_snippet: messageText,
        details: { mid: cleanMid, reason: 'تم تجاهل الرسالة لأنها مكررة بالفعل لمنع الرد المزدوج' }
      });
      return {
        success: true,
        customer: db.getCustomerByInstagram(senderId) || ({} as Customer),
        aiResponded: false,
        reason: 'Duplicate event skipped'
      };
    }
    db.recordWebhookEvent(cleanMid, { senderId, text: messageText }, 'processed');

    // 2. Find or create Customer
    let customer = db.getCustomerByInstagram(senderId);
    let username = providedUsername || (customer ? customer.instagram_username : `user_${senderId.slice(-6)}`);

    // Attempt to fetch profile info from Meta Graph API if access token is available
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || db.getSystemSettings().instagram_access_token;
    if (!customer && accessToken && !providedUsername) {
      try {
        const metaProfileRes = await fetch(`https://graph.facebook.com/v21.0/${senderId}?fields=name,username&access_token=${accessToken}`);
        if (metaProfileRes.ok) {
          const profileData = await metaProfileRes.json();
          if (profileData.username) username = profileData.username;
        }
      } catch (err) {
        console.warn('Could not fetch Meta profile for sender, using fallback username:', err);
      }
    }

    if (!customer) {
      customer = {
        id: crypto.randomUUID(),
        instagram_username: username,
        instagram_user_id: senderId,
        first_contact_at: new Date().toISOString(),
        last_contact_at: new Date().toISOString(),
        lead_status: 'New',
        lead_score: 50,
        human_required: false,
        last_message: messageText
      };
      db.saveCustomer(customer);
    } else {
      customer.last_message = messageText;
      customer.last_contact_at = new Date().toISOString();
      db.saveCustomer(customer);
    }

    // 3. Find or create Conversation
    let conversation = db.getConversationByCustomer(customer.id);
    if (!conversation) {
      conversation = {
        id: crypto.randomUUID(),
        customer_id: customer.id,
        channel: 'instagram',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_preview: messageText,
        last_message_at: new Date().toISOString()
      };
      db.saveConversation(conversation);
    }

    // 4. Save Customer incoming message to database
    const incomingMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversation.id,
      customer_id: customer.id,
      sender: 'customer',
      message: messageText,
      timestamp: new Date().toISOString(),
      message_type: 'text',
      is_ai: false,
      status: 'received',
      instagram_mid: cleanMid
    };
    db.saveMessage(incomingMsg);

    // 5. Check Global AI Switch
    const aiSettings = db.getAISettings();
    if (!aiSettings.is_ai_enabled) {
      db.addLog({
        event_type: 'ai_intent',
        status: 'warning',
        customer_id: customer.id,
        instagram_username: customer.instagram_username,
        message_snippet: messageText,
        details: { reason: 'نظام الرد الآلي للذكاء الاصطناعي متوقف يدوياً من لوحة التحكم (AI Automation OFF)' }
      });
      return {
        success: true,
        customer,
        aiResponded: false,
        reason: 'AI Automation is currently disabled globally.'
      };
    }

    // 6. Check Human Handoff status
    if (customer.human_required || conversation.status === 'human_handoff') {
      db.addLog({
        event_type: 'human_handoff',
        status: 'warning',
        customer_id: customer.id,
        instagram_username: customer.instagram_username,
        message_snippet: messageText,
        details: { reason: 'تم إيقاف الرد التلقائي لهذا العميل لوجود طلب تواصل مع موظف بشري' }
      });
      return {
        success: true,
        customer,
        aiResponded: false,
        reason: 'Customer is assigned to a human agent.'
      };
    }

    // 7. Get conversation history for contextual memory
    const pastMessages = db.getMessages(conversation.id);
    const historyContext = pastMessages.slice(-6).map(m => ({
      role: m.is_ai ? ('model' as const) : ('user' as const),
      text: m.message
    }));

    // 8. Analyze with Gemini AI
    const analysis = await GeminiEngine.analyzeAndRespond(messageText, historyContext);
    const responseTime = Date.now() - startTime;

    // 9. Guardrail Validation of suggested response
    const validation = ResponseValidator.validate(analysis.suggested_response, aiSettings);
    if (!validation.isValid) {
      db.addLog({
        event_type: 'guardrail_blocked',
        status: 'error',
        customer_id: customer.id,
        instagram_username: customer.instagram_username,
        message_snippet: analysis.suggested_response,
        details: { violations: validation.violations, action: 'حظر الرد وتفعيل التنبيه' }
      });

      // Update customer state safely without sending invalid response
      customer.lead_status = 'Waiting';
      db.saveCustomer(customer);

      return {
        success: false,
        customer,
        aiResponded: false,
        reason: `Response failed guardrail check: ${validation.violations.join(', ')}`
      };
    }

    const finalResponseText = validation.sanitizedResponse;

    // 10. Check if Human Handoff was triggered by AI
    if (analysis.needs_human_handoff) {
      customer.human_required = true;
      customer.lead_status = 'Human Required';
      conversation.status = 'human_handoff';
      db.saveConversation(conversation);

      db.addLog({
        event_type: 'human_handoff',
        status: 'warning',
        customer_id: customer.id,
        instagram_username: customer.instagram_username,
        message_snippet: messageText,
        details: { reason: analysis.reasoning, handoff_message: finalResponseText }
      });
    } else {
      customer.lead_status = analysis.lead_status;
    }

    // Update customer stats
    customer.lead_score = analysis.lead_score;
    if (analysis.service) {
      customer.requested_service = analysis.service;
    }
    customer.last_response = finalResponseText;
    db.saveCustomer(customer);

    // 11. Dispatch reply via Meta Instagram Graph API
    const sendResult = await this.sendInstagramMessage(senderId, finalResponseText);

    // 12. Save AI response message to database
    const outgoingMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversation.id,
      customer_id: customer.id,
      sender: 'ai',
      message: finalResponseText,
      timestamp: new Date().toISOString(),
      message_type: 'text',
      is_ai: true,
      status: sendResult.success ? (sendResult.simulated ? 'simulated' : 'sent') : 'failed',
      metadata: {
        intent: analysis.intent,
        lead_score: analysis.lead_score,
        response_time_ms: responseTime,
        human_handoff_triggered: analysis.needs_human_handoff,
        error_message: sendResult.error
      }
    };
    db.saveMessage(outgoingMsg);

    // 13. Record Success Log
    db.addLog({
      event_type: 'ai_response',
      status: sendResult.success ? 'success' : 'warning',
      customer_id: customer.id,
      instagram_username: customer.instagram_username,
      message_snippet: finalResponseText,
      intent: analysis.intent,
      lead_score: analysis.lead_score,
      response_time_ms: responseTime,
      details: {
        delivery: sendResult.simulated ? 'محاكاة بيئة الاختبار (بدون رمز وصول ميتا نشط)' : 'تم الإرسال عبر Meta Graph API',
        confidence: analysis.confidence,
        missing_info: analysis.missing_info
      }
    });

    return {
      success: true,
      customer,
      replyText: finalResponseText,
      aiResponded: true
    };
  }

  /**
   * Step 3: Send message to Meta Instagram Graph API
   */
  static async sendInstagramMessage(
    recipientId: string,
    text: string
  ): Promise<{ success: boolean; simulated?: boolean; messageId?: string; error?: string }> {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || db.getSystemSettings().instagram_access_token;

    // If no access token is configured, or if recipient is a simulated test user
    if (!accessToken || recipientId.startsWith('sim_') || recipientId.startsWith('test_')) {
      return {
        success: true,
        simulated: true,
        messageId: `sim_out_${Date.now()}`
      };
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/me/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Meta Instagram API error response:', data);
        return {
          success: false,
          error: data.error?.message || 'Meta API returned an error'
        };
      }

      return {
        success: true,
        messageId: data.message_id
      };
    } catch (err: any) {
      console.error('Failed to send Instagram message via network:', err);
      return {
        success: false,
        error: err.message || 'Network error connecting to Meta Graph API'
      };
    }
  }

  /**
   * Parse Meta Webhook payload batch
   */
  static async handleWebhookPayload(payload: MetaWebhookPayload) {
    if (payload.object !== 'instagram' && payload.object !== 'page') {
      return { processedCount: 0, reason: 'Not an instagram/page event' };
    }

    let processedCount = 0;
    if (payload.entry && Array.isArray(payload.entry)) {
      for (const entry of payload.entry) {
        if (entry.messaging && Array.isArray(entry.messaging)) {
          for (const msgEvent of entry.messaging) {
            // Only process incoming text messages from customer
            if (msgEvent.message && msgEvent.message.text && msgEvent.sender && msgEvent.sender.id) {
              await this.processIncomingMessage(
                msgEvent.sender.id,
                msgEvent.message.text,
                msgEvent.message.mid
              );
              processedCount++;
            }
          }
        }
      }
    }

    return { processedCount };
  }
}
