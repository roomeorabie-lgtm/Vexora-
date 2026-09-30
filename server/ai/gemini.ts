import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../db/database.ts';
import { ResponseValidator } from './validator.ts';
import type { AIAnalysisResult, IntentType, LeadStatus } from '../../src/types/index.ts';

// Server-side initialization following @google/genai skill requirements
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export class GeminiEngine {
  /**
   * Main analyzer: determines intent, detected service, lead score, missing information,
   * checks whether human handoff is needed, and synthesizes a natural Egyptian Arabic response.
   */
  static async analyzeAndRespond(
    customerMessage: string,
    historyContext: Array<{ role: 'user' | 'model'; text: string }> = []
  ): Promise<AIAnalysisResult> {
    const aiSettings = db.getAISettings();
    const activeServices = db.getServices(true);
    const activePricing = db.getPricing(true);
    const activeOffers = db.getOffers(true);

    // Fast-path check: Check for direct human handoff keywords
    const lowerMessage = customerMessage.toLowerCase().trim();
    const isExplicitHumanRequest = (aiSettings.human_handoff_keywords || []).some(kw => 
      lowerMessage.includes(kw.toLowerCase())
    );

    if (isExplicitHumanRequest) {
      return {
        intent: 'human_agent_request',
        service: null,
        lead_score: 85, // High interest because they want to speak with sales
        lead_status: 'Human Required',
        needs_human_handoff: true,
        missing_info: ['رقم الهاتف أو وسيلة الاتصال'],
        suggested_response: aiSettings.human_handoff_message,
        confidence: 0.98,
        reasoning: 'طلب العميل صراحة التحدث مع موظف أو شخص حقيقي.'
      };
    }

    // Build the dynamic knowledge boundary from Database ONLY (anti-hallucination)
    const servicesContext = activeServices.map(s => `- ${s.name} (${s.slug}): ${s.description} [ملاحظات: ${s.notes || 'لا يوجد'}]`).join('\n');
    const pricingContext = activePricing.map(p => `- ${p.service_name} / ${p.title}: السعر يبدأ من ${p.starting_price} ${p.currency}. التفاصيل: ${p.details}`).join('\n');
    const offersContext = activeOffers.map(o => `- ${o.title}: ${o.description}`).join('\n');

    const systemPrompt = `
أنت المساعد الذكي والممثل الرقمي لبراند "${aiSettings.business_name}".
${aiSettings.business_description}

شخصيتك وأسلوبك:
- ${aiSettings.personality}
- اللهجة: ${aiSettings.dialect} بطبيعية كاملة بدون تقعر، وبدون عبارات روبوتية مكررة.
- الطول: ردود سريعة ومختصرة مناسبة لمحادثات إنستغرام (Instagram Direct).
- الحد الأقصى للأسئلة: لا تسأل أكثر من ${aiSettings.max_questions_per_reply} سؤال لجمع المتطلبات الناقصة.

🚫 قواعد صارمة جداً لمنع اختلاق المعلومات (Zero-Hallucination Policy):
1. استخدم حصراً المعلومات التالية الموجودة في قاعدة البيانات فقط:
[الخدمات المتاحة]:
${servicesContext || 'لا توجد خدمات مسجلة حالياً.'}

[الأسعار الرسمية المتاحة]:
${pricingContext || 'الأسعار لم تحدد برقم ثابت؛ السعر يتحدد حسب المواصفات والمتطلبات.'}

[العروض الحالية]:
${offersContext || 'لا توجد عروض ترويجية نشطة حالياً.'}

2. إذا سأل العميل عن السعر:
- إذا كان هناك سعر يبدأ من موجود أعلاه للخدمة، اذكره كبداية (مثال: "بيبدأ من X جنيه...") ثم اسأله عن تفاصيل مشروعه لتحديد السعر الدقيق.
- إذا لم يوجد سعر في القائمة أعلاه، ممنوع تماماً أن تذكر أي رقم من خيالك، ورد قائلاً بلهجة ودودة: "السعر بيختلف حسب تفاصيل الموقع/المتجر اللي محتاجه، قولي تحب يكون فيه إيه بالظبط عشان أقدر أحددلك التكلفة بالتفصيل ❤️".

3. إذا سأل عن مدة التنفيذ أو عروض غير موجودة، لا تخترع أي تاريخ أو عرض.

4. إذا طلب التحدث مع شخص أو موظف، اجعل needs_human_handoff = true.

5. تصنيف درجة الاهتمام (Lead Score):
- 0-20: غير مهتم / رسائل عشوائية / سبام / شتائم
- 21-50: اهتمام أولي أو استفسار عابر
- 51-80: مهتم ويسأل عن خدمة محددة
- 81-100: عميل محتمل جداً، يسأل عن السعر أو طريقة التعاقد ومستعد للبدء
`;

    const userPrompt = `
سياق المحادثة السابقة:
${historyContext.length > 0 ? historyContext.map(h => `${h.role === 'user' ? 'العميل' : 'المساعد'}: ${h.text}`).join('\n') : 'لا يوجد سياق سابق (محادثة جديدة)'}

رسالة العميل الحالية:
"${customerMessage}"

قم بتحليل الرسالة بالكامل وأرجع كائن JSON بالهيكل المحدد:
- intent: نوع الطلب من القائمة (website_request, ecommerce_request, domain_request, pricing_question, portfolio_request, support_request, general_question, human_agent_request, other)
- service: اسم الخدمة المطلوبة من القائمة الرسمية فقط أو null
- lead_score: رقم من 0 إلى 100
- lead_status: واحد من ('New', 'Interested', 'Waiting', 'Converted', 'Not Interested', 'Human Required')
- needs_human_handoff: هل يحتاج تحويل لموظف بشري (true/false)
- missing_info: مصفوفة بالمعلومات الناقصة اللازمة للتسعير أو البدء
- suggested_response: الرد النهائي باللهجة المصرية الطبيعية المختصرة والودية وفق القواعد الصارمة.
- confidence: نسبة الثقة من 0 إلى 1
- reasoning: توضيح موجز باللغة العربية لسبب هذا التصنيف والرد.
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.35, // Low temperature for high factual consistency
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: {
                type: Type.STRING,
                description: 'Classified intent of the customer'
              },
              service: {
                type: Type.STRING,
                description: 'Detected matching Vexora service name or empty string if none'
              },
              lead_score: {
                type: Type.INTEGER,
                description: 'Lead score between 0 and 100'
              },
              lead_status: {
                type: Type.STRING,
                description: 'Status of lead: New, Interested, Waiting, Converted, Not Interested, Human Required'
              },
              needs_human_handoff: {
                type: Type.BOOLEAN,
                description: 'Whether human intervention is required'
              },
              missing_info: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Missing project specs needed to quote'
              },
              suggested_response: {
                type: Type.STRING,
                description: 'Final response in natural Egyptian Arabic dialect'
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence score between 0 and 1'
              },
              reasoning: {
                type: Type.STRING,
                description: 'Brief explanation of classification'
              }
            },
            required: ['intent', 'lead_score', 'lead_status', 'needs_human_handoff', 'suggested_response']
          }
        }
      });

      const rawText = response.text?.trim() || '{}';
      const parsed = JSON.parse(rawText);

      // Guardrail validation of the generated response
      const validation = ResponseValidator.validate(parsed.suggested_response || '', aiSettings);

      let finalResponse = validation.isValid 
        ? validation.sanitizedResponse 
        : 'أهلاً بحضرتك في Vexora! ❤️ استلمنا استفسارك ومسؤول المبيعات هيرد على كافة التفاصيل في أقرب وقت.';

      // Safe normalization
      const safeIntent = (parsed.intent as IntentType) || 'general_question';
      let safeStatus: LeadStatus = (parsed.lead_status as LeadStatus) || 'Interested';
      if (parsed.needs_human_handoff) {
        safeStatus = 'Human Required';
      }

      return {
        intent: safeIntent,
        service: parsed.service || null,
        lead_score: Math.min(100, Math.max(0, Number(parsed.lead_score) || 50)),
        lead_status: safeStatus,
        needs_human_handoff: Boolean(parsed.needs_human_handoff),
        missing_info: Array.isArray(parsed.missing_info) ? parsed.missing_info : [],
        suggested_response: finalResponse,
        confidence: Number(parsed.confidence) || 0.9,
        reasoning: parsed.reasoning || 'تم التحليل بنجاح عبر Gemini AI'
      };
    } catch (error: any) {
      console.error('Gemini AI Engine processing error:', error);
      // Fallback response maintaining Egyptian dialect and zero hallucination
      return {
        intent: 'general_question',
        service: null,
        lead_score: 50,
        lead_status: 'Waiting',
        needs_human_handoff: false,
        missing_info: [],
        suggested_response: 'أهلاً بيك في Vexora! ❤️ استفسارك وصل، قولي إيه تفاصيل الموقع أو المتجر اللي حابب تعمله ويسعدنا نساعدك فوراً.',
        confidence: 0.5,
        reasoning: `تعذر إكمال استجابة الذكاء الاصطناعي بدقة: ${error.message || 'خطأ غير متوقع'}`
      };
    }
  }
}
