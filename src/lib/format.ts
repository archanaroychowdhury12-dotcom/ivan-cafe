export const uid = (prefix = '') =>
  prefix + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export function money(value: number, currency = '₹') {
  const n = Math.round(value * 100) / 100;
  const str = n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
  return `${currency}${str.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function orderCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const l = letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `IVN-${l}${n}`;
}

export function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function elapsed(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function clockTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function dayLabel(ts: number) {
  return new Date(ts).toLocaleDateString([], { day: '2-digit', month: 'short' });
}

export async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
