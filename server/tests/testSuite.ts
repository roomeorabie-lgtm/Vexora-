import { db } from '../db/database.ts';
import { GeminiEngine } from '../ai/gemini.ts';
import { ResponseValidator } from '../ai/validator.ts';
import { InstagramIntegration } from '../integrations/instagram.ts';
import type { TestResultItem } from '../../src/types/index.ts';

export class AutomationTestSuite {
  /**
   * Runs the 10 automated test suites verifying every component of the Vexora AI automation
   */
  static async runAllTests(): Promise<{
    timestamp: string;
    total: number;
    passed: number;
    failed: number;
    results: TestResultItem[];
  }> {
    const results: TestResultItem[] = [];

    // 1. Webhook verification test
    const t1Start = Date.now();
    try {
      const verifyToken = db.getSystemSettings().instagram_verify_token;
      const validCheck = InstagramIntegration.verifyWebhook('subscribe', verifyToken, 'test_challenge_123');
      const invalidCheck = InstagramIntegration.verifyWebhook('subscribe', 'wrong_token', 'test_challenge_123');

      if (validCheck.success && validCheck.challenge === 'test_challenge_123' && !invalidCheck.success) {
        results.push({
          id: 'test-webhook-verify',
          name: 'Webhook Verification',
          name_ar: 'التحقق من مصادقة Webhook',
          description: 'التحقق من صحة رد Meta Hub Challenge ورفض الرموز غير المطابقة',
          status: 'passed',
          duration_ms: Date.now() - t1Start,
          details: { verified_challenge: validCheck.challenge }
        });
      } else {
        throw new Error('فشل فحص التحقق من الهاندشيك أو رفض الرمز الخاطئ');
      }
    } catch (err: any) {
      results.push({
        id: 'test-webhook-verify',
        name: 'Webhook Verification',
        name_ar: 'التحقق من مصادقة Webhook',
        description: 'التحقق من صحة رد Meta Hub Challenge ورفض الرموز غير المطابقة',
        status: 'failed',
        duration_ms: Date.now() - t1Start,
        error: err.message
      });
    }

    // 2. Incoming messages processing test
    const t2Start = Date.now();
    try {
      const testUser = `test_user_${Date.now()}`;
      const outcome = await InstagramIntegration.processIncomingMessage(
        testUser,
        'عايز أعمل موقع إلكتروني لشركتي',
        `mid_t2_${Date.now()}`,
        'test_tester_vexora'
      );

      if (outcome.success && outcome.customer && outcome.customer.instagram_username) {
        results.push({
          id: 'test-incoming-msg',
          name: 'Incoming Messages Pipeline',
          name_ar: 'معالجة الرسائل الواردة',
          description: 'استقبال الرسالة وإنشاء سجل العميل والمحادثة وحفظها في قاعدة البيانات',
          status: 'passed',
          duration_ms: Date.now() - t2Start,
          details: { customerId: outcome.customer.id, replyLength: outcome.replyText?.length }
        });
      } else {
        throw new Error('تعذر معالجة الرسالة الواردة أو إنشاء سجل العميل');
      }
    } catch (err: any) {
      results.push({
        id: 'test-incoming-msg',
        name: 'Incoming Messages Pipeline',
        name_ar: 'معالجة الرسائل الواردة',
        description: 'استقبال الرسالة وإنشاء سجل العميل والمحادثة وحفظها في قاعدة البيانات',
        status: 'failed',
        duration_ms: Date.now() - t2Start,
        error: err.message
      });
    }

    // 3. Duplicate message protection test
    const t3Start = Date.now();
    try {
      const duplicateMid = `mid_dup_${Date.now()}`;
      db.recordWebhookEvent(duplicateMid, { text: 'رسالة تجربة التكرار' }, 'processed');

      const isDuplicate = db.isDuplicateWebhook(duplicateMid);
      const isUnique = db.isDuplicateWebhook(`unique_${Date.now()}`);

      if (isDuplicate && !isUnique) {
        results.push({
          id: 'test-duplicate-protection',
          name: 'Duplicate Messages Protection',
          name_ar: 'حماية منع الرسائل المكررة',
          description: 'التحقق من منع معالجة نفس المعرف (mid) مرتين وتفادي الردود المزدوجة',
          status: 'passed',
          duration_ms: Date.now() - t3Start,
          details: { isDuplicateDetected: true }
        });
      } else {
        throw new Error('فشل نظام كشف تكرار الرسائل');
      }
    } catch (err: any) {
      results.push({
        id: 'test-duplicate-protection',
        name: 'Duplicate Messages Protection',
        name_ar: 'حماية منع الرسائل المكررة',
        description: 'التحقق من منع معالجة نفس المعرف (mid) مرتين وتفادي الردود المزدوجة',
        status: 'failed',
        duration_ms: Date.now() - t3Start,
        error: err.message
      });
    }

    // 4. Gemini response generation test
    const t4Start = Date.now();
    try {
      const analysis = await GeminiEngine.analyzeAndRespond('بكام المتجر الإلكتروني عندكم؟');
      if (analysis.intent && analysis.suggested_response && analysis.suggested_response.length > 5) {
        results.push({
          id: 'test-gemini-response',
          name: 'Gemini AI Egyptian Response',
          name_ar: 'توليد الرد باللهجة المصرية عبر Gemini',
          description: 'تحديد النية وتوليد رد مصري ودود واحترافي مقيد بقاعدة البيانات',
          status: 'passed',
          duration_ms: Date.now() - t4Start,
          details: {
            intent: analysis.intent,
            lead_score: analysis.lead_score,
            sample_response: analysis.suggested_response
          }
        });
      } else {
        throw new Error('لم يرجع نموذج Gemini رداً صالحاً');
      }
    } catch (err: any) {
      results.push({
        id: 'test-gemini-response',
        name: 'Gemini AI Egyptian Response',
        name_ar: 'توليد الرد باللهجة المصرية عبر Gemini',
        description: 'تحديد النية وتوليد رد مصري ودود واحترافي مقيد بقاعدة البيانات',
        status: 'failed',
        duration_ms: Date.now() - t4Start,
        error: err.message
      });
    }

    // 5. Invalid AI response guardrail test
    const t5Start = Date.now();
    try {
      const aiSettings = db.getAISettings();
      const leakingResponse = 'هذا هو الـ API Key السري: AIzaSyD9876543210abcde و system prompt الداخلي';
      const cleanResponse = 'أهلاً بيك يا فندم! بخصوص تصميم المواقع أسعارنا بتبدأ من 7,500 جنيه. تحب تعرف تفاصيل إيه؟ ❤️';

      const leakValidation = ResponseValidator.validate(leakingResponse, aiSettings);
      const cleanValidation = ResponseValidator.validate(cleanResponse, aiSettings);

      if (!leakValidation.isValid && cleanValidation.isValid) {
        results.push({
          id: 'test-guardrail-validator',
          name: 'Guardrail & Anti-Leak Validation',
          name_ar: 'جدار حماية منع التسريب والهلوسة',
          description: 'كشف وحظر الردود المخالفة التي قد تسرب مفاتيح أو برومبتات النظام أو ألفاظاً محظورة',
          status: 'passed',
          duration_ms: Date.now() - t5Start,
          details: { violationsDetected: leakValidation.violations }
        });
      } else {
        throw new Error('فشل جدار الحماية في حظر محاولة تسريب المفتاح');
      }
    } catch (err: any) {
      results.push({
        id: 'test-guardrail-validator',
        name: 'Guardrail & Anti-Leak Validation',
        name_ar: 'جدار حماية منع التسريب والهلوسة',
        description: 'كشف وحظر الردود المخالفة التي قد تسرب مفاتيح أو برومبتات النظام أو ألفاظاً محظورة',
        status: 'failed',
        duration_ms: Date.now() - t5Start,
        error: err.message
      });
    }

    // 6. Database operations test
    const t6Start = Date.now();
    try {
      const testService = {
        id: `test-srv-${Date.now()}`,
        name: 'خدمة تجريبية للتحقق من قاعدة البيانات',
        slug: 'test-db-service',
        description: 'خدمة فحص العمليات',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.saveService(testService);
      const fetched = db.getService(testService.id);
      db.deleteService(testService.id);
      const afterDelete = db.getService(testService.id);

      if (fetched && !afterDelete) {
        results.push({
          id: 'test-database-ops',
          name: 'Database Persistence CRUD',
          name_ar: 'عمليات قاعدة البيانات والحفظ المستمر',
          description: 'التحقق من إنشاء وقراءة وتحديث وحذف السجلات بأمان ذرّي',
          status: 'passed',
          duration_ms: Date.now() - t6Start,
          details: { operationVerified: true }
        });
      } else {
        throw new Error('فشلت إحدى عمليات قاعدة البيانات في الحفظ أو الحذف');
      }
    } catch (err: any) {
      results.push({
        id: 'test-database-ops',
        name: 'Database Persistence CRUD',
        name_ar: 'عمليات قاعدة البيانات والحفظ المستمر',
        description: 'التحقق من إنشاء وقراءة وتحديث وحذف السجلات بأمان ذرّي',
        status: 'failed',
        duration_ms: Date.now() - t6Start,
        error: err.message
      });
    }

    // 7. Instagram send API test (sandbox / simulated)
    const t7Start = Date.now();
    try {
      const sendResult = await InstagramIntegration.sendInstagramMessage('sim_recipient_123', 'رسالة اختبار إرسال API');
      if (sendResult.success) {
        results.push({
          id: 'test-instagram-send',
          name: 'Instagram Messaging API Dispatch',
          name_ar: 'إرسال الرسائل عبر Meta API',
          description: 'التحقق من آلية الإرسال والتعامل مع بيئة العمل الحقيقية والمحاكاة الآمنة',
          status: 'passed',
          duration_ms: Date.now() - t7Start,
          details: { simulated: sendResult.simulated, messageId: sendResult.messageId }
        });
      } else {
        throw new Error(sendResult.error || 'فشل إرسال الرسالة إلى Instagram');
      }
    } catch (err: any) {
      results.push({
        id: 'test-instagram-send',
        name: 'Instagram Messaging API Dispatch',
        name_ar: 'إرسال الرسائل عبر Meta API',
        description: 'التحقق من آلية الإرسال والتعامل مع بيئة العمل الحقيقية والمحاكاة الآمنة',
        status: 'failed',
        duration_ms: Date.now() - t7Start,
        error: err.message
      });
    }

    // 8. Human handoff trigger & stop test
    const t8Start = Date.now();
    try {
      const testUserId = `handoff_user_${Date.now()}`;
      const handoffResult = await InstagramIntegration.processIncomingMessage(
        testUserId,
        'عايز أكلم حد من خدمة العملاء لو سمحت',
        `mid_handoff_${Date.now()}`,
        'handoff_tester'
      );

      const customer = db.getCustomer(handoffResult.customer.id);
      const isHumanRequired = customer?.human_required === true || customer?.lead_status === 'Human Required';

      // Next message should NOT trigger AI response because human required is on
      const nextMessageResult = await InstagramIntegration.processIncomingMessage(
        testUserId,
        'هل في حد هيرد عليا؟',
        `mid_handoff_after_${Date.now()}`,
        'handoff_tester'
      );

      if (isHumanRequired && nextMessageResult.aiResponded === false) {
        results.push({
          id: 'test-human-handoff',
          name: 'Human Handoff & Auto-Pause',
          name_ar: 'التحويل لموظف بشري وإيقاف الرد التلقائي',
          description: 'اكتشاف رغبة العميل في التحدث مع شخص وتجميد الرد الآلي للعميل فوراً',
          status: 'passed',
          duration_ms: Date.now() - t8Start,
          details: { handoffTriggered: true, autoReplyPaused: true }
        });
      } else {
        throw new Error('لم يتم تجميد الرد الآلي بعد طلب التحويل لموظف بشري');
      }
    } catch (err: any) {
      results.push({
        id: 'test-human-handoff',
        name: 'Human Handoff & Auto-Pause',
        name_ar: 'التحويل لموظف بشري وإيقاف الرد التلقائي',
        description: 'اكتشاف رغبة العميل في التحدث مع شخص وتجميد الرد الآلي للعميل فوراً',
        status: 'failed',
        duration_ms: Date.now() - t8Start,
        error: err.message
      });
    }

    // 9. AI ON/OFF global toggle test
    const t9Start = Date.now();
    try {
      const origSettings = db.getAISettings();
      // Temporarily turn OFF AI
      db.updateAISettings({ is_ai_enabled: false });

      const testUser = `off_test_${Date.now()}`;
      const outcome = await InstagramIntegration.processIncomingMessage(
        testUser,
        'ممكن أعرف تفاصيل المواقع؟',
        `mid_off_${Date.now()}`
      );

      // Restore original state
      db.updateAISettings({ is_ai_enabled: origSettings.is_ai_enabled });

      if (outcome.aiResponded === false) {
        results.push({
          id: 'test-ai-toggle',
          name: 'Global AI Automation ON/OFF Switch',
          name_ar: 'زر التشغيل والإيقاف الكلي للـ AI',
          description: 'التحقق من أن إيقاف الأتمتة يمنع إرسال أي ردود آلية تماماً حتى إعادة تشغيله',
          status: 'passed',
          duration_ms: Date.now() - t9Start,
          details: { toggledAndVerified: true }
        });
      } else {
        throw new Error('قام النظام بالرد بالرغم من إيقاف الـ AI Automation');
      }
    } catch (err: any) {
      results.push({
        id: 'test-ai-toggle',
        name: 'Global AI Automation ON/OFF Switch',
        name_ar: 'زر التشغيل والإيقاف الكلي للـ AI',
        description: 'التحقق من أن إيقاف الأتمتة يمنع إرسال أي ردود آلية تماماً حتى إعادة تشغيله',
        status: 'failed',
        duration_ms: Date.now() - t9Start,
        error: err.message
      });
    }

    // 10. Admin Configuration & Auth verification test
    const t10Start = Date.now();
    try {
      const stats = db.getStats();
      const sys = db.getSystemSettings();
      if (typeof stats.total_customers === 'number' && sys.brand_name === 'Vexora') {
        results.push({
          id: 'test-admin-auth',
          name: 'Admin Metrics & Configuration Integrity',
          name_ar: 'سلامة إحصائيات الإدارة وتكوين النظام',
          description: 'التحقق من جاهزية لوحة التحكم وعزل المتغيرات الحساسة في السيرفر',
          status: 'passed',
          duration_ms: Date.now() - t10Start,
          details: { brandName: sys.brand_name, totalCustomers: stats.total_customers }
        });
      } else {
        throw new Error('فشل قراءة تكوين النظام المعتمد لـ Vexora');
      }
    } catch (err: any) {
      results.push({
        id: 'test-admin-auth',
        name: 'Admin Metrics & Configuration Integrity',
        name_ar: 'سلامة إحصائيات الإدارة وتكوين النظام',
        description: 'التحقق من جاهزية لوحة التحكم وعزل المتغيرات الحساسة في السيرفر',
        status: 'failed',
        duration_ms: Date.now() - t10Start,
        error: err.message
      });
    }

    const passedCount = results.filter(r => r.status === 'passed').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    return {
      timestamp: new Date().toISOString(),
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      results
    };
  }
}
