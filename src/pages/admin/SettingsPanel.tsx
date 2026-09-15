import { useState } from 'react';
import { AlertTriangle, DatabaseZap, KeyRound, Percent, Save, Store } from 'lucide-react';
import { actions, useSettings } from '../../lib/store';
import { sha256 } from '../../lib/format';
import { Button, Field, Toggle, inputCx, useToast } from '../../components/ui';

export default function SettingsPanel() {
  const settings = useSettings();
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
          <Field label="Address">
            <input
              className={inputCx}
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            />
          </Field>
          <Field label="Opening hours">
            <input
              className={inputCx}
              value={draft.hours}
              onChange={(e) => setDraft({ ...draft, hours: e.target.value })}
            />
          </Field>
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
          Data is stored in this browser and synchronised live across every open tab — guest menu, kitchen
          display and dashboard stay in sync in real time.
        </p>
      </section>
    </div>
  );
}
