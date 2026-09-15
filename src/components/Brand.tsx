export function Mark({ size = 40, tone = 'light' }: { size?: number; tone?: 'light' | 'dark' }) {
  const bg = tone === 'light' ? '#241a13' : '#f5eee4';
  const fg = tone === 'light' ? '#f5eee4' : '#241a13';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect width="48" height="48" rx="15" fill={bg} />
      <path d="M14 17h15a6 6 0 0 1 0 12h-1.4" stroke={fg} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M14 17v8a8 8 0 0 0 8 8h1a8 8 0 0 0 8-8" stroke={fg} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M19 11.5c0 1.6-1.6 1.9-1.6 3.5M24.5 10c0 1.8-1.8 2.2-1.8 4" stroke="#c2571f" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="34.5" cy="23" r="1.6" fill="#c79a45" />
    </svg>
  );
}

export function BrandLockup({
  name,
  tagline,
  tone = 'light',
  size = 40,
}: {
  name: string;
  tagline?: string;
  tone?: 'light' | 'dark';
  size?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <Mark size={size} tone={tone} />
      <div className="leading-tight">
        <p className={`font-display text-[17px] font-semibold ${tone === 'light' ? 'text-ink' : 'text-cream'}`}>
          {name}
        </p>
        {tagline && (
          <p className={`text-[11px] font-medium ${tone === 'light' ? 'text-mocha' : 'text-cream/60'}`}>
            {tagline}
          </p>
        )}
      </div>
    </div>
  );
}
