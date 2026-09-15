import { useState } from 'react';
import { AlertTriangle, Cloud, DatabaseZap, KeyRound, Percent, RefreshCw, Save, Store } from 'lucide-react';
import { actions, useSettings, useSyncStatus } from '../../lib/store';
import { sha256 } from '../../lib/format';
import { Button, Field, Toggle, inputCx, useToast } from '../../components/ui';

export default function SettingsPanel() {
  const settings = useSettings();
  const syncStatus = useSyncStatus();
  const toast = useToast();
  const [draft, setDraft] = useState(settings);
  const [pass, setPass] = useState({ current: '', next: '', confirm: '' });
  const [passError, setPassError] = useState('');

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  const changePassword = async () => {
    setPassError('');
    const curHash = await sha256(pass.current);
    if (curHash !== settings.adminPassHash) return setPassError('Current password is incorrect.');
    if (pass.next.length < 6) return setPassError('New password must be at least 6 characters.');
    if (pass.next !== pass.confirm) return setPassError('New passwords do not match.');
    actions.saveSettings({ adminPassHash: await sha256(pass.next) });
    setPass({ current: '', next: '', confirm: '' });
    toast('Password updated');
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
          <Field label="Tax %">
            <input
              type="number"
              min={0}
              max={50}
              className={inputCx}
              value={draft.taxPercent}
              onChange={(e) => setDraft({ ...draft, taxPercent: Number(e.target.value) })}
            />
          </Field>
          <Field label="Service charge %">
            <input
              type="number"
              min={0}
              max={50}
              className={inputCx}
              value={draft.servicePercent}
              onChange={(e) => setDraft({ ...draft, servicePercent: Number(e.target.value) })}
            />
          </Field>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-line bg-cream/40 px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold">Apply service charge</p>
              <p className="text-[12px] text-mocha">Adds to every new order at checkout.</p>
            </div>
            <Toggle on={draft.serviceEnabled} onChange={(v) => setDraft({ ...draft, serviceEnabled: v })} />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-line bg-cream/40 px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold">Accepting orders</p>
              <p className="text-[12px] text-mocha">Turn off to close the kitchen for new orders.</p>
            </div>
            <Toggle
              on={draft.acceptingOrders}
              onChange={(v) => setDraft({ ...draft, acceptingOrders: v })}
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
        <h3 className="mb-4 flex items-center gap-2 font-display text-[18px] font-semibold">
          <KeyRound size={17} className="text-ember" /> Admin password
        </h3>
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
    </div>
  );
}
