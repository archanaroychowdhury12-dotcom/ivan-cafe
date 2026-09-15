import { useState } from 'react';
import { Copy, Download, ExternalLink, Globe, Plus, Printer, QrCode, Trash2 } from 'lucide-react';
import { actions, useSettings, useTables } from '../../lib/store';
import { getBaseUrl, getLiveMenuUrl, uid } from '../../lib/format';
import type { CafeTable } from '../../lib/types';
import { Button, Field, Sheet, Toggle, inputCx, useToast } from '../../components/ui';
import { QRImage, useQR } from '../../components/QRCode';
import { Mark } from '../../components/Brand';

export default function TablesPanel() {
  const tables = useTables();
  const settings = useSettings();
  const toast = useToast();
  const [editing, setEditing] = useState<CafeTable | null>(null);
  const [printing, setPrinting] = useState(false);
  const baseUrl = getBaseUrl(settings.customDomain);
  const linkFor = (code: string) => getLiveMenuUrl(code, settings.customDomain);

  const newTable = (): CafeTable => ({
    id: uid('t_'),
    code: `T${String(tables.length + 1).padStart(2, '0')}`,
    label: 'New table',
    seats: 2,
    zone: 'Main Hall',
    active: true,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-[22px] font-semibold">Tables & QR codes</h2>
          <p className="text-[13px] text-mocha">
            Each table has a unique code. Print the QR, stick it on the table, and orders arrive tagged
            automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPrinting(true)}>
            <Printer size={15} /> Print sheet
          </Button>
          <Button onClick={() => setEditing(newTable())}>
            <Plus size={16} /> Add table
          </Button>
        </div>
      </div>

      {/* Live QR Destination Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-olive/30 bg-olive/10 p-4 text-[13px] text-ink">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-olive text-white shadow-sm">
            <Globe size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink">
              Live QR Destination: <span className="font-mono text-ember font-bold">{baseUrl}</span>
            </p>
            <p className="text-[12px] text-mocha">
              Mobile phones scanning these QR codes will directly open your live online menu ({baseUrl}/menu?table=T01).
            </p>
          </div>
        </div>
        <a
          href={`${baseUrl}/menu?table=T01`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-olive/40 bg-paper px-3 py-1.5 text-[12px] font-semibold text-olive hover:bg-cream transition"
        >
          <ExternalLink size={13} /> Test Live T01 Menu
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tables.map((t) => (
          <TableCard
            key={t.id}
            table={t}
            link={linkFor(t.code)}
            cafeName={settings.cafeName}
            onEdit={() => setEditing(t)}
            onDelete={() => {
              if (confirm(`Delete table ${t.code}?`)) {
                actions.deleteTable(t.id);
                toast('Table removed', 'info');
              }
            }}
          />
        ))}
      </div>

      <TableEditor table={editing} onClose={() => setEditing(null)} customDomain={settings.customDomain} />

      <Sheet open={printing} onClose={() => setPrinting(false)} title="Printable QR sheet" size="lg">
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          <p className="mb-4 text-[13px] text-mocha no-print">
            A4-friendly sheet with one card per table. Use your browser print dialog and choose “Save as PDF”
            to keep a copy.
          </p>
          <div className="grid grid-cols-2 gap-4" id="qr-print-area">
            {tables.map((t) => (
              <div
                key={t.id}
                className="qr-sheet flex flex-col items-center gap-2 rounded-2xl border border-line bg-paper p-4 text-center"
              >
                <Mark size={30} />
                <p className="font-display text-[15px] font-semibold">{settings.cafeName}</p>
                <QRImage value={linkFor(t.code)} size={150} />
                <p className="font-display text-[20px] font-semibold">{t.code}</p>
                <p className="-mt-1 text-[11px] text-mocha">
                  {t.label} · Scan to see the menu & order
                </p>
                <p className="font-mono text-[9px] text-mocha/70">
                  {linkFor(t.code)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-2 no-print">
            <Button variant="outline" className="flex-1" onClick={() => setPrinting(false)}>
              Close
            </Button>
            <Button className="flex-1" onClick={() => window.print()}>
              <Printer size={15} /> Print now
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function TableCard({
  table,
  link,
  cafeName,
  onEdit,
  onDelete,
}: {
  table: CafeTable;
  link: string;
  cafeName: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const dataUrl = useQR(link, 720);
  const toast = useToast();

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${cafeName.replace(/\s+/g, '-').toLowerCase()}-${table.code}-qr.png`;
    a.click();
    toast(`QR for ${table.code} downloaded`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast(`Copied live link for ${table.code}!`);
    } catch {
      toast(`Link: ${link}`, 'info');
    }
  };

  return (
    <article className="overflow-hidden rounded-[26px] border border-line bg-paper shadow-card transition hover:shadow-lift">
      <div className="flex items-start gap-4 p-4">
        <div className="rounded-2xl border border-line bg-cream/50 p-2">
          <QRImage value={link} size={104} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-[20px] font-semibold">{table.code}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                table.active ? 'bg-olive/15 text-olive' : 'bg-line text-mocha'
              }`}
            >
              {table.active ? 'Active' : 'Paused'}
            </span>
          </div>
          <p className="text-[13px] font-medium text-ink-soft">{table.label}</p>
          <p className="text-[12px] text-mocha">
            {table.seats} seats · {table.zone}
          </p>
          <p className="mt-1 font-mono text-[10.5px] text-ember truncate" title={link}>
            {link}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-olive hover:underline"
            >
              <Copy size={11} /> Copy link
            </button>
            <span className="text-mocha/40">·</span>
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-ember hover:underline"
            >
              <ExternalLink size={11} /> Open menu
            </a>
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 border-t border-line/70 bg-cream/40 px-3 py-2.5">
        <Button size="sm" variant="outline" className="flex-1" onClick={download}>
          <Download size={13} /> PNG QR
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 size={13} className="text-berry" />
        </Button>
      </div>
    </article>
  );
}

function TableEditor({
  table,
  onClose,
  customDomain,
}: {
  table: CafeTable | null;
  onClose: () => void;
  customDomain?: string;
}) {
  const tables = useTables();
  const toast = useToast();
  const [draft, setDraft] = useState<CafeTable | null>(table);
  const [prevId, setPrevId] = useState(table?.id);
  const [error, setError] = useState('');

  if (table?.id !== prevId) {
    setPrevId(table?.id);
    setDraft(table);
    setError('');
  }
  if (!draft) return <Sheet open={false} onClose={onClose} children={null} />;

  const save = () => {
    const code = draft.code.trim().toUpperCase();
    if (!/^[A-Z0-9-]{2,6}$/.test(code)) {
      setError('Use 2–6 letters/numbers, e.g. T09 or PATIO1.');
      return;
    }
    if (tables.some((t) => t.code === code && t.id !== draft.id)) {
      setError('Another table already uses that code.');
      return;
    }
    actions.saveTable({ ...draft, code });
    toast('Table saved');
    onClose();
  };

  const previewLink = getLiveMenuUrl(draft.code || 'T01', customDomain);

  return (
    <Sheet open={!!table} onClose={onClose} title="Table settings">
      <div className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Table code" error={error}>
            <input
              className={inputCx}
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Seats">
            <input
              type="number"
              min={1}
              className={inputCx}
              value={draft.seats}
              onChange={(e) => setDraft({ ...draft, seats: Number(e.target.value) })}
            />
          </Field>
        </div>
        <Field label="Label">
          <input
            className={inputCx}
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
        </Field>
        <Field label="Zone">
          <input
            className={inputCx}
            value={draft.zone}
            onChange={(e) => setDraft({ ...draft, zone: e.target.value })}
          />
        </Field>
        <div className="flex items-center justify-between rounded-2xl border border-line bg-cream/40 px-4 py-3">
          <div>
            <p className="text-[14px] font-semibold">Accept orders from this table</p>
            <p className="text-[12px] text-mocha">Paused tables show a friendly notice instead of the menu.</p>
          </div>
          <Toggle on={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-4">
          <QrCode size={18} className="text-ember shrink-0" />
          <p className="flex-1 text-[12px] text-mocha">
            The QR encodes <span className="font-mono text-ink break-all font-semibold">{previewLink}</span> — regenerated instantly
            when you change the code.
          </p>
        </div>
      </div>
      <div className="flex gap-2 border-t border-line px-5 py-4">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={save}>
          Save table
        </Button>
      </div>
    </Sheet>
  );
}

