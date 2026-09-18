// Ivan Caffe - Supabase Edge Function Webhook Dispatcher
// Handles reliable webhook dispatch, HMAC signature generation, and exponential backoff retry

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

interface WebhookRecord {
  id: string;
  event_type: string;
  aggregate_id: string;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'delivered' | 'failed';
  attempts: number;
  max_attempts: number;
}

// Compute HMAC-SHA256 hex signature
async function computeHmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase credentials missing in Edge runtime environment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch Webhook configuration from settings
    const { data: settings, error: settingsErr } = await supabase
      .from('settings')
      .select('webhook_url, webhook_secret, webhook_enabled')
      .eq('id', 'default')
      .single();

    if (settingsErr || !settings) {
      return new Response(
        JSON.stringify({ error: 'Failed to load cafe settings', details: settingsErr }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings.webhook_enabled || !settings.webhook_url) {
      return new Response(
        JSON.stringify({ message: 'Webhooks are disabled or no target URL configured in settings' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Identify events to dispatch
    let eventsToProcess: WebhookRecord[] = [];
    let isDirectPayload = false;

    // Check if request body contains a direct DB webhook insert payload
    try {
      const body = await req.json();
      if (body && body.record && body.table === 'webhook_events') {
        eventsToProcess = [body.record as WebhookRecord];
        isDirectPayload = true;
      }
    } catch {
      // Body not JSON or empty - continue with queue polling
    }

    // If not a direct payload, poll pending or retryable events from the outbox
    if (!isDirectPayload) {
      const nowIso = new Date().toISOString();
      const { data: queuedEvents, error: queueErr } = await supabase
        .from('webhook_events')
        .select('*')
        .in('status', ['pending', 'failed'])
        .lte('next_retry_at', nowIso)
        .lt('attempts', 5)
        .order('created_at', { ascending: true })
        .limit(10);

      if (queueErr) {
        return new Response(
          JSON.stringify({ error: 'Failed to query outbox queue', details: queueErr }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      eventsToProcess = (queuedEvents as WebhookRecord[]) || [];
    }

    if (eventsToProcess.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No events pending dispatch' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: Array<{ id: string; status: string; attempts: number; error?: string }> = [];

    // 3. Process each event
    for (const evt of eventsToProcess) {
      const newAttempts = (evt.attempts || 0) + 1;
      const payloadString = JSON.stringify(evt.payload);

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'IvanCaffe-Webhook-Dispatcher/1.0',
        'X-Ivan-Event': evt.event_type,
        'X-Ivan-Delivery': evt.id,
        'X-Ivan-Timestamp': Math.floor(Date.now() / 1000).toString(),
      };

      if (settings.webhook_secret) {
        const signature = await computeHmacSha256(settings.webhook_secret, payloadString);
        headers['X-Ivan-Signature'] = `sha256=${signature}`;
      }

      let delivered = false;
      let respStatus: number | null = null;
      let respBody = '';
      let errorMsg = '';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const response = await fetch(settings.webhook_url, {
          method: 'POST',
          headers,
          body: payloadString,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        respStatus = response.status;
        respBody = (await response.text()).slice(0, 1000); // Store first 1000 chars

        if (response.ok) {
          delivered = true;
        } else {
          errorMsg = `Remote server responded with HTTP ${response.status}: ${respBody}`;
        }
      } catch (err: any) {
        errorMsg = err.name === 'AbortError' ? 'Webhook delivery timed out after 8000ms' : (err.message || String(err));
      }

      if (delivered) {
        await supabase
          .from('webhook_events')
          .update({
            status: 'delivered',
            attempts: newAttempts,
            response_status: respStatus,
            response_body: respBody,
            delivered_at: new Date().toISOString(),
            last_error: null,
          })
          .eq('id', evt.id);

        results.push({ id: evt.id, status: 'delivered', attempts: newAttempts });
      } else {
        // Calculate exponential backoff for retries: 15s * 2^attempts (e.g. 30s, 60s, 120s, 240s)
        const backoffSeconds = Math.min(600, 15 * Math.pow(2, newAttempts));
        const nextRetryDate = new Date(Date.now() + backoffSeconds * 1000).toISOString();
        const finalStatus = newAttempts >= (evt.max_attempts || 5) ? 'failed' : 'pending';

        await supabase
          .from('webhook_events')
          .update({
            status: finalStatus,
            attempts: newAttempts,
            last_error: errorMsg,
            response_status: respStatus,
            response_body: respBody,
            next_retry_at: nextRetryDate,
          })
          .eq('id', evt.id);

        results.push({ id: evt.id, status: finalStatus, attempts: newAttempts, error: errorMsg });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal dispatcher error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
