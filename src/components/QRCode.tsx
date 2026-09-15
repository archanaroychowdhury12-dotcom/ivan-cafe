import { useEffect, useState } from 'react';
import QR from 'qrcode';

export function useQR(value: string, size = 420) {
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    let alive = true;
    QR.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#241a13ff', light: '#fffdf9ff' },
    })
      .then((d) => alive && setUrl(d))
      .catch(() => alive && setUrl(''));
    return () => {
      alive = false;
    };
  }, [value, size]);
  return url;
}

export function QRImage({
  value,
  size = 180,
  className = '',
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const url = useQR(value, size * 2);
  if (!url) {
    return (
      <div className="skeleton rounded-2xl" style={{ width: size, height: size }} aria-label="Generating QR" />
    );
  }
  return (
    <img
      src={url}
      alt={`QR code for ${value}`}
      width={size}
      height={size}
      className={`rounded-2xl ${className}`}
    />
  );
}
