import { COPY } from '../content/copy';
import { DEMO_DATE, DEMO_MODE } from '../lib/demo-config';
import { formatChallengeDate } from '../utils/format';

/**
 * Small fixed marker so demo mode is never mistaken for the real challenge.
 * Renders nothing outside a local dev build.
 */
export function DemoBadge() {
  if (!DEMO_MODE) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: 8,
        bottom: 8,
        zIndex: 50,
        pointerEvents: 'none',
        padding: '3px 9px',
        borderRadius: 999,
        background: 'rgba(15, 23, 42, 0.82)',
        color: '#fff',
        fontSize: 10,
        letterSpacing: '0.4px',
        lineHeight: 1.4,
        fontFamily: 'inherit',
      }}
    >
      {COPY.demoLabel} · {formatChallengeDate(DEMO_DATE)} · {COPY.demoResetHint}
    </div>
  );
}
