/**
 * Dukkan brand assets — SVG-native, no emoji, no external fonts.
 *
 * The mark: a violet rounded square with a white geometric "D" letterform.
 * The wordmark: mark + "Dukkan" or "دكان" logotype beside it.
 * The full: wordmark + a small tagline beneath it.
 */

interface MarkProps {
  /** Pixel size (square). Defaults to 40. */
  size?: number;
  /** Inverted = white mark on transparent bg (for use on dark/brand-colored surfaces). */
  inverted?: boolean;
  className?: string;
}

/** The icon-only logo mark. */
export function DukkanMark({ size = 40, inverted = false, className }: MarkProps) {
  const bg = inverted ? 'white' : '#7C3AED';
  const fg = inverted ? '#7C3AED' : 'white';
  const radius = Math.round(size * 0.23);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label="Dukkan"
      role="img"
    >
      {/* Brand square */}
      <rect width="48" height="48" rx={radius} fill={bg} />

      {/* Geometric "D" letterform — left bar + right semicircle */}
      {/* Left vertical bar */}
      <rect x="12" y="12" width="6" height="24" rx="3" fill={fg} />
      {/* D cap: top edge → semicircle arc → bottom edge → back */}
      <path
        d="M 18 12 H 25 A 12 12 0 0 1 25 36 H 18"
        fill={fg}
      />
    </svg>
  );
}

interface WordmarkProps extends MarkProps {
  lang?: 'en' | 'ar';
  /** If true, renders "دكان / Dukkan" bilingual */
  bilingual?: boolean;
  textColor?: string;
}

/** Mark + logotype side by side. */
export function DukkanWordmark({
  size = 40,
  inverted = false,
  lang = 'en',
  bilingual = false,
  textColor,
  className,
}: WordmarkProps) {
  const textFill = textColor ?? (inverted ? 'white' : '#7C3AED');
  const subFill = inverted ? 'rgba(255,255,255,0.6)' : '#9C94B8';
  const isAr = lang === 'ar';

  return (
    <div
      className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : 'flex-row'} ${className ?? ''}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <DukkanMark size={size} inverted={inverted} />
      <div className={isAr ? 'text-right' : 'text-left'}>
        <p
          className="font-black leading-none"
          style={{
            fontSize: size * 0.55,
            color: textFill,
            letterSpacing: isAr ? '0.01em' : '-0.02em',
            fontFamily: isAr ? 'Cairo, sans-serif' : 'Plus Jakarta Sans, sans-serif',
          }}
        >
          {bilingual ? 'دكان · Dukkan' : isAr ? 'دكان' : 'Dukkan'}
        </p>
        {bilingual && (
          <p
            className="text-xs font-medium mt-0.5"
            style={{ color: subFill, fontFamily: isAr ? 'Cairo, sans-serif' : 'Plus Jakarta Sans, sans-serif' }}
          >
            {isAr ? 'نظام إدارة المحل' : 'Business Operations System'}
          </p>
        )}
      </div>
    </div>
  );
}
