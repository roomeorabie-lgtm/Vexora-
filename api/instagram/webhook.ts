import type { IncomingMessage, ServerResponse } from 'http';
import { InstagramIntegration } from '../../server/integrations/instagram.ts';
import { db } from '../../server/db/database.ts';

// Helper to parse query parameters from URL in Vercel serverless environment
function getQueryParams(urlStr: string = ''): Record<string, string> {
  try {
    const url = new URL(urlStr, 'http://localhost');
    const params: Record<string, string> = {};
    url.searchParams.forEach((val, key) => {
      params[key] = val;
    });
    return params;
  } catch {
    return {};
  }
}

// Helper to read raw body buffer in Vercel serverless environment
async function getRawBody(req: any): Promise<Buffer> {
  if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
    return req.rawBody;
  }
  if (req.body && typeof req.body === 'object') {
    return Buffer.from(JSON.stringify(req.body));
  }
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(Buffer.alloc(0)));
  });
}

/**
 * Dedicated Vercel Serverless Function for Instagram Webhook
 * Route: /api/instagram/webhook
 * Handlers: GET (Verification), POST (Meta Webhook Events)
 */
export default async function handler(req: any, res: any) {
  // CORS & Methods
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, X-Hub-Signature-256');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  // 1. GET Request: Meta Webhook Verification Handshake
  if (req.method === 'GET') {
    const query = req.query || getQueryParams(req.url);
    const mode = (query['hub.mode'] || query.mode) as string;
    const token = (query['hub.verify_token'] || query.verify_token) as string;
    const challenge = (query['hub.challenge'] || query.challenge) as string;

    const result = InstagramIntegration.verifyWebhook(mode, token, challenge);

    if (result.success && result.challenge) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.statusCode = 200;
      return res.end(result.challenge);
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.statusCode = 403;
    return res.end(result.error || 'Verification token mismatch or invalid mode');
  }

  // 2. POST Request: Incoming Events from Meta
  if (req.method === 'POST') {
    try {
      const signature = req.headers['x-hub-signature-256'] as string;
      const rawBody = await getRawBody(req);

      // Verify signature if META_APP_SECRET is present
      const isValid = InstagramIntegration.verifySignature(rawBody, signature);
      if (!isValid) {
        res.statusCode = 403;
        return res.end('Invalid signature');
      }

      // Parse JSON body safely
      let payload = req.body;
      if (typeof payload === 'string' || Buffer.isBuffer(payload)) {
        try {
          payload = JSON.parse(payload.toString('utf-8'));
        } catch {
          payload = {};
        }
      }

      // Meta requires immediate 200 OK acknowledgment to prevent retries
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.statusCode = 200;
      res.end('EVENT_RECEIVED');

      // Process payload asynchronously in background
      if (payload && typeof payload === 'object') {
        InstagramIntegration.handleWebhookPayload(payload).catch((err) => {
          console.error('Async webhook processing error on Vercel:', err);
        });
      }
    } catch (err: any) {
      console.error('Error handling Vercel webhook POST:', err);
      if (!res.writableEnded) {
        res.statusCode = 200;
        res.end('EVENT_RECEIVED');
      }
    }
    return;
  }

  res.statusCode = 405;
  res.end('Method Not Allowed');
}
