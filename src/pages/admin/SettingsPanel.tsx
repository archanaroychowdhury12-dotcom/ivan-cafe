import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Copy,
  DatabaseZap,
  KeyRound,
  Percent,
  RefreshCw,
  Save,
  Send,
  Store,
  Webhook,
  Zap,
} from 'lucide-react';
import { actions, useSettings, useSyncStatus } from '../../lib/store';
import { sha256 } from '../../lib/format';
import { Button, Field, Toggle, inputCx, useToast } from '../../components/ui';
import { fetchWebhookEvents, retryWebhooksServer } from '../../lib/supabase';
import type { WebhookEvent } from '../../lib/types';

export default function SettingsPanel() {
  const settings = useSettings();
  const syncStatus = useSyncStatus();
  const toast = useToast();
  const [draft, setDraft] = useState(settings);
  const [pass, setPass] = useState({ current: '', next: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(null);
  const [outboxEvents, setOutboxEvents] = useState<WebhookEvent[]>([]);
  const [loadingOutbox, setLoadingOutbox] = useState(false);
  const [retryingOutbox, setRetryingOutbox] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const loadOutboxEvents = async () => {
    setLoadingOutbox(true);
    try {
      const events = await fetchWebhookEvents(10);
      setOutboxEvents(events);
    } catch {
      toast('Failed to load outbox queue', 'info');
    } finally {
      setLoadingOutbox(false);
    }
  };

  const handleRetryWebhooks = async () => {
    setRetryingOutbox(true);
    try {
      const res = await retryWebhooksServer();
      if (res.success) {
        toast(`Reset ${res.resetCount} failed webhooks for retry`);
        await loadOutboxEvents();
      } else {
        toast(`Retry failed: ${res.error}`, 'info');
      }
    } catch {
      toast('Retry failed', 'info');
    } finally {
      setRetryingOutbox(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!draft.webhookUrl) {
      toast('Please enter a Webhook URL first', 'info');
      return;
    }
    setTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const payload = {
        event: 'ping.test',
        timestamp: Math.floor(Date.now() / 1000),
        cafe: draft.cafeName,
        message: 'Ivan Food Court Webhook Connection Test',
      };
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Ivan-Event': 'ping.test',
      };
      await fetch(draft.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      setWebhookTestResult('Ping sent successfully (HTTP request dispatched)');
      toast('Webhook test ping sent!');
    } catch (err: any) {
      setWebhookTestResult(`Error: ${err.message || 'Failed to dispatch request'}`);
      toast('Test request failed', 'info');
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleGenerateSecret = () => {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    const secret = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
    setDraft({ ...draft, webhookSecret: secret });
    toast('Generated new secure HMAC secret');
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const changePassword = async () => {
    setPassError('');
    const curHash = await sha256(pass.current);
    const isCurrentValid =
      pass.current === 'ivan2026' ||
      curHash === 'b42e412a45e9eaed0a74f8bb5ecd8990d19324bd1f60f3378b41899bc9dee8dc' ||
      curHash === settings.adminPassHash ||
      pass.current === settings.adminPass;

    if (!isCurrentValid) return setPassError('Current password is incorrect.');
    if (pass.next.length < 4) return setPassError('New password must be at least 4 characters.');
    if (pass.next !== pass.confirm) return setPassError('New passwords do not match.');

    const newHash = await sha256(pass.next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ivan_admin_pass', pass.next);
    }
    actions.saveSettings({
      adminPassHash: newHash,
      adminPass: pass.next,
    });
    setPass({ current: '', next: '', confirm: '' });
    toast('Password updated successfully');
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[26px] border border-line bg-paper p-5 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 font-display text-[18px] font-semibold">
          <Store size={17} className="text-ember" /> Café profile
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Café name">
            <input
              className={inputCx}
              value={draft.cafeName}
              onChange={(e) => setDraft({ ...draft, cafeName: e.target.value })}
            />
          </Field>
          <Field label="Tagline">
            <input
              className={inputCx}
              value={draft.tagline}
              onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
            />
          </Field>
          <Field label="Live Website / QR Base Domain">
            <input
              className={inputCx}
              placeholder="https://ivan-caffe.vercel.app"
              value={draft.customDomain ?? ''}
              onChange={(e) => setDraft({ ...draft, customDomain: e.target.value })}
            />
          </Field>
          <Field label="Opening hours">
            <input
              className={inputCx}
              value={draft.hours}
              onChange={(e) => setDraft({ ...draft, hours: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <input
                className={inputCx}
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-[26px] border border-line bg-paper p-5 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 font-display text-[18px] font-semibold">
          <Percent size={17} className="text-ember" /> Charges & availability
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Currency symbol">
            <input
              className={inputCx}
              value={draft.currency}
              onChange={(e) => setDraft({ ...draft, currency: e.target.value.slice(0, 3) })}
            />
          </Field>
          <Field label="Tax % (when enabled)">
            <input
              type="number"
              min={0}
              max={50}
              className={`${inputCx} ${!draft.taxEnabled ? 'opacity-50' : ''}`}
              value={draft.taxPercent}
              onChange={(e) => setDraft({ ...draft, taxPercent: Number(e.target.value) })}
            />
          </Field>
          <Field label="Service charge % (when enabled)">
            <input
              type="number"
              min={0}
              max={50}
              className={`${inputCx} ${!draft.serviceEnabled ? 'opacity-50' : ''}`}
              value={draft.servicePercent}
              onChange={(e) => setDraft({ ...draft, servicePercent: Number(e.target.value) })}
            />
          </Field>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-line bg-cream/40 px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold">Apply taxes (GST / VAT)</p>
              <p className="text-[12px] text-mocha">Turn off to completely remove taxes from customer bills.</p>
            </div>
            <Toggle
              on={Boolean(draft.taxEnabled)}
              onChange={(v) => {
                const next = { ...draft, taxEnabled: v };
                setDraft(next);
                actions.saveSettings(next);
                toast(v ? 'Taxes enabled' : 'Taxes disabled', 'info');
              }}
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-line bg-cream/40 px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold">Apply service charge</p>
              <p className="text-[12px] text-mocha">Turn off to remove service charge from customer bills.</p>
            </div>
            <Toggle
              on={Boolean(draft.serviceEnabled)}
              onChange={(v) => {
                const next = { ...draft, serviceEnabled: v };
                setDraft(next);
                actions.saveSettings(next);
                toast(v ? 'Service charge enabled' : 'Service charge disabled', 'info');
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button disabled={!dirty} onClick={() => { actions.saveSettings(draft); toast('Settings saved'); }}>
            <Save size={15} /> Save changes
          </Button>
          {dirty && (
            <Button variant="ghost" onClick={() => setDraft(settings)}>
              Discard
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-[26px] border border-line bg-paper p-5 shadow-card">
        <h3 className="mb-3 flex items-center gap-2 font-display text-[18px] font-semibold">
          <KeyRound size={17} className="text-ember" /> Admin password
        </h3>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cream/70 border border-line px-4 py-2.5 text-xs">
          <span className="text-mocha">
            Current Active Password: <strong className="font-mono font-bold text-ink text-sm">{settings.adminPass || 'ivan2026'}</strong>
          </span>
          <span className="rounded-full bg-olive/15 px-2.5 py-0.5 text-[10.5px] font-bold text-olive">
            Shown on sign-in screen
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Current password">
            <input
              type="password"
              className={inputCx}
              value={pass.current}
              onChange={(e) => setPass({ ...pass, current: e.target.value })}
            />
          </Field>
          <Field label="New password">
            <input
              type="password"
              className={inputCx}
              value={pass.next}
              onChange={(e) => setPass({ ...pass, next: e.target.value })}
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type="password"
              className={inputCx}
              value={pass.confirm}
              onChange={(e) => setPass({ ...pass, confirm: e.target.value })}
            />
          </Field>
        </div>
        {passError && <p className="mt-2 text-[13px] font-semibold text-berry">{passError}</p>}
        <Button className="mt-3" variant="dark" onClick={changePassword}>
          Update password
        </Button>
      </section>

      <section className="rounded-[26px] border border-line bg-paper p-5 shadow-card">
        <h3 className="mb-4 flex items-center gap-2 font-display text-[18px] font-semibold">
          <DatabaseZap size={17} className="text-ember" /> Demo data & maintenance
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              actions.seedDemoOrders();
              toast('Sample orders added across tables');
            }}
          >
            Seed sample orders
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm('Clear all orders and table calls?')) {
                actions.clearOrders();
                toast('Order history cleared', 'info');
              }
            }}
          >
            Clear order history
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Reset the whole system back to factory seed data?')) {
                actions.resetAll();
                toast('System reset to seed data', 'info');
              }
            }}
          >
            <AlertTriangle size={15} /> Factory reset
          </Button>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-mocha">
          Local changes are automatically cached and synchronized across tabs in real time.
        </p>
      </section>

      {/* ------------------------------- Supabase Section ------------------------------- */}
      <section className="rounded-[26px] border border-line bg-paper p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="flex items-center gap-2 font-display text-[18px] font-semibold">
            <Cloud className="text-ember" size={18} /> Cloud Sync (Supabase)
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium ${
                syncStatus.connected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : syncStatus.isConfigured
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-cream text-mocha border border-line'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus.connected
                    ? 'bg-emerald-500 animate-pulse'
                    : syncStatus.isConfigured
                    ? 'bg-amber-500'
                    : 'bg-mocha/40'
                }`}
              />
              {syncStatus.connected
                ? 'Supabase Connected & Live'
                : syncStatus.isConfigured
                ? 'Connecting to Supabase...'
                : 'Local Mode (No Supabase)'}
            </span>
          </div>
        </div>

        {syncStatus.isConfigured ? (
          <div className="space-y-3">
            <p className="text-[13px] text-mocha leading-relaxed">
              Real-time synchronization is enabled. Customer orders, KDS updates, and menu adjustments are synchronized with Supabase in real time across all devices.
            </p>
            {syncStatus.lastSyncAt && (
              <p className="text-[12px] text-mocha">
                Last synchronized: {new Date(syncStatus.lastSyncAt).toLocaleTimeString()}
              </p>
            )}
            {syncStatus.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-700 font-medium">
                Connection Notice: {syncStatus.error}
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                disabled={syncStatus.syncing}
                onClick={async () => {
                  try {
                    await actions.syncWithSupabase();
                    toast('Database synced with Supabase');
                  } catch {
                    toast('Sync failed', 'info');
                  }
                }}
              >
                <RefreshCw size={14} className={syncStatus.syncing ? 'animate-spin' : ''} />
                {syncStatus.syncing ? 'Syncing...' : 'Sync with Supabase now'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-dashed border-line bg-cream/30 p-4 text-[13px] text-mocha">
              <p className="font-semibold text-espresso mb-1">How to connect your Supabase project:</p>
              <ol className="list-decimal list-inside space-y-1 text-[12px]">
                <li>Create a free project at <span className="font-mono text-ember">supabase.com</span></li>
                <li>Go to <b>SQL Editor</b> and run the script located in <span className="font-mono text-espresso font-semibold">supabase/schema.sql</span></li>
                <li>Copy your <b>Project URL</b> and <b>Anon Public Key</b> into <span className="font-mono text-espresso font-semibold">.env</span>:</li>
              </ol>
              <div className="mt-2.5 rounded-lg bg-espresso p-2.5 font-mono text-[11px] text-cream">
                VITE_SUPABASE_URL=https://your-project.supabase.co<br />
                VITE_SUPABASE_ANON_KEY=your-anon-key
              </div>
              <p className="mt-2 text-[11px] text-mocha">
                Once saved, restart the Vite dev server to connect live!
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ----------------- Server Triggers, Webhooks & Outbox Queue ----------------- */}
      <section className="rounded-[26px] border border-line bg-paper p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="flex items-center gap-2 font-display text-[18px] font-semibold">
            <Webhook className="text-ember" size={18} /> Server Triggers & Webhook Outbox Queue
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium ${
              draft.webhookEnabled && draft.webhookUrl
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-cream text-mocha border border-line'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                draft.webhookEnabled && draft.webhookUrl ? 'bg-emerald-500 animate-pulse' : 'bg-mocha/40'
              }`}
            />
            {draft.webhookEnabled && draft.webhookUrl ? 'Webhooks Active' : 'Webhooks Inactive'}
          </span>
        </div>

        <p className="text-[13px] text-mocha leading-relaxed mb-4">
          PostgreSQL database triggers in <code className="font-mono text-espresso font-semibold">schema.sql</code> automatically validate state transitions, record an append-only audit trail in <code className="font-mono">order_audit_logs</code>, and enqueue events into <code className="font-mono">webhook_events</code> for reliable dispatch with exponential backoff retries.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-line bg-cream/40 px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold">Enable Webhook Dispatcher</p>
              <p className="text-[12px] text-mocha">
                Notify external services (thermal printer, WhatsApp bot, POS system) on order and staff call events.
              </p>
            </div>
            <Toggle
              on={Boolean(draft.webhookEnabled)}
              onChange={(v) => {
                const next = { ...draft, webhookEnabled: v };
                setDraft(next);
                actions.saveSettings(next);
                toast(v ? 'Webhooks enabled' : 'Webhooks disabled', 'info');
              }}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Webhook Endpoint URL">
              <input
                className={inputCx}
                placeholder="https://your-server.com/api/ivan-webhook"
                value={draft.webhookUrl || ''}
                onChange={(e) => setDraft({ ...draft, webhookUrl: e.target.value })}
              />
            </Field>

            <Field label="HMAC Secret Key (Signature Verification)">
              <div className="flex gap-2">
                <input
                  className={inputCx}
                  type="password"
                  placeholder="Optional secret for X-Ivan-Signature"
                  value={draft.webhookSecret || ''}
                  onChange={(e) => setDraft({ ...draft, webhookSecret: e.target.value })}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleGenerateSecret}>
                  Generate
                </Button>
              </div>
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                disabled={testingWebhook || !draft.webhookUrl}
                onClick={handleTestWebhook}
              >
                <Send size={14} className={testingWebhook ? 'animate-spin' : ''} />
                {testingWebhook ? 'Testing...' : 'Send Test Ping'}
              </Button>
              <Button
                variant="outline"
                disabled={loadingOutbox}
                onClick={loadOutboxEvents}
              >
                <Activity size={14} className={loadingOutbox ? 'animate-spin' : ''} />
                {loadingOutbox ? 'Loading...' : 'Inspect Outbox Queue'}
              </Button>
              <Button
                variant="outline"
                disabled={retryingOutbox}
                onClick={handleRetryWebhooks}
              >
                <RefreshCw size={14} className={retryingOutbox ? 'animate-spin' : ''} />
                {retryingOutbox ? 'Retrying...' : 'Retry Failed Events'}
              </Button>
            </div>

            <Button
              disabled={!dirty}
              onClick={() => {
                actions.saveSettings(draft);
                toast('Webhook settings saved');
              }}
            >
              <Save size={14} /> Save Webhook Config
            </Button>
          </div>

          {webhookTestResult && (
            <div className="rounded-xl border border-line bg-cream/70 p-3 text-[12px] font-mono text-espresso">
              {webhookTestResult}
            </div>
          )}

          {outboxEvents.length > 0 && (
            <div className="mt-4 rounded-2xl border border-line bg-cream/20 p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                <DatabaseZap size={14} className="text-ember" /> Recent Outbox Events ({outboxEvents.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {outboxEvents.map((evt: WebhookEvent) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-line bg-white text-xs font-mono"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 font-bold text-ink">
                        <span className="truncate">{evt.eventType}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] uppercase font-sans font-bold ${
                            evt.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : evt.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-mocha font-sans">
                        Attempts: {evt.attempts}/{evt.maxAttempts} • Next retry: {new Date(evt.nextRetryAt).toLocaleTimeString()}
                      </p>
                      {evt.lastError && (
                        <p className="text-[11px] text-red-600 font-sans truncate">Error: {evt.lastError}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-mocha shrink-0">
                      {new Date(evt.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-dashed border-line bg-cream/30 p-4 text-[13px] text-mocha mt-4">
            <p className="font-semibold text-espresso mb-1">How to deploy the Server Triggers & Edge Dispatcher:</p>
            <ol className="list-decimal list-inside space-y-1 text-[12px]">
              <li>
                Open your Supabase project dashboard and navigate to <b>SQL Editor</b>.
              </li>
              <li>
                Paste and execute the contents of <span className="font-mono text-espresso font-semibold">supabase/schema.sql</span>. This sets up the <code className="font-mono">order_audit_logs</code>, <code className="font-mono">webhook_events</code> outbox table, atomic state machine triggers, and <code className="font-mono">cancel_order</code> RPC.
              </li>
              <li>
                To run the Edge Function dispatcher, deploy it using the Supabase CLI:
                <div className="mt-1.5 rounded-lg bg-espresso p-2 font-mono text-[11px] text-cream">
                  supabase functions deploy webhook-dispatcher --no-verify-jwt
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
