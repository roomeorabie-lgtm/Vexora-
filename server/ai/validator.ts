import type { AISettings } from '../../src/types/index.ts';

export interface ValidationResult {
  isValid: boolean;
  sanitizedResponse: string;
  violations: string[];
}

export class ResponseValidator {
  /**
   * Validates and sanitizes AI generated responses before dispatching to Instagram
   */
  static validate(response: string, aiSettings: AISettings): ValidationResult {
    const violations: string[] = [];
    let text = (response || '').trim();

    // 1. Check for empty or excessively short response
    if (!text || text.length < 2) {
      violations.push('الرد فارغ أو قصير جداً');
      return { isValid: false, sanitizedResponse: '', violations };
    }

    // 2. Check for maximum length (Instagram DMs are conversational, keep max ~450 chars)
    if (text.length > 550) {
      violations.push('الرد طويل جداً وغير مناسب لمحادثات إنستغرام السريعة');
      // Truncate cleanly at last sentence or punctuation if possible
      text = text.substring(0, 480).replace(/(\s[^\s]+)$/, '') + '...';
    }

    // 3. Check for API keys or secret tokens
    const apiKeyPatterns = [
      /AIza[0-9A-Za-z-_]{35}/i,
      /EA[A-Za-z0-9_]{30,}/i,
      /eyJ[A-Za-z0-9-_]{20,}/i, // JWT fragments
      /sk-[a-zA-Z0-9]{20,}/i,
      /bearer\s+[a-zA-Z0-9_\-\.]+/i,
      /api_key\s*[:=]/i,
      /secret\s*[:=]/i,
      /verify_token\s*[:=]/i
    ];
    for (const pattern of apiKeyPatterns) {
      if (pattern.test(text)) {
        violations.push('تسريب محتمل لمفتاح API أو Secret Token');
        return { isValid: false, sanitizedResponse: '', violations };
      }
    }

    // 4. Check for System Prompt or Internal Instruction leak
    const leakKeywords = [
      'system prompt',
      'instruction:',
      'developer prompt',
      'i am an ai model trained by',
      'أنا نموذج ذكاء اصطناعي',
      'تعليمات النظام',
      'قواعد الـ ai',
      'system instruction',
      'أنا برنامج آلي مبرمج بواسطة',
      'gemini-3',
      'database schema',
      'postgres',
      'supabase_service_role_key',
      'json schema'
    ];
    for (const kw of leakKeywords) {
      if (text.toLowerCase().includes(kw)) {
        violations.push(`تسريب محتمل لمعلومات النظام الداخلية (${kw})`);
        return { isValid: false, sanitizedResponse: '', violations };
      }
    }

    // 5. Clean markdown code fences if AI accidentally wrapped response in ``` or quotes
    if (text.startsWith('```') && text.endsWith('```')) {
      text = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    }
    // Remove outer quotation marks if enclosed
    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith('“') && text.endsWith('”'))) {
      text = text.slice(1, -1).trim();
    }

    // 6. Check for forbidden information configured by admin in AISettings
    if (aiSettings?.forbidden_information?.length) {
      for (const forbidden of aiSettings.forbidden_information) {
        if (forbidden.trim() && text.toLowerCase().includes(forbidden.toLowerCase())) {
          violations.push(`يحتوي الرد على مصطلح محظور في الإعدادات: "${forbidden}"`);
          return { isValid: false, sanitizedResponse: '', violations };
        }
      }
    }

    // 7. Verify presence of polite/Egyptian conversational tone
    // Ensure text is not purely robotic jargon
    return {
      isValid: violations.length === 0,
      sanitizedResponse: text,
      violations
    };
  }
}
