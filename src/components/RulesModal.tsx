import { Modal } from './Modal';
import { COPY, RULES_BULLETS, WAKE_POINT_TABLE } from '../content/copy';
import { CHALLENGE_UTC_LABEL } from '../utils/format';

export function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} label={COPY.rules}>
      <h3 style={{ marginBottom: 24, fontSize: 24 }}>{COPY.rulesTitle}</h3>

      <ul style={{ textAlign: 'left', paddingLeft: 20, marginBottom: 32, gap: 8, display: 'flex', flexDirection: 'column' }}>
        {RULES_BULLETS.map((line) => (
          <li key={line} style={{ color: 'var(--text)', lineHeight: 1.5 }}>{line}</li>
        ))}
      </ul>

      <h4 style={{ fontSize: 18, marginBottom: 16 }}>{COPY.wakePointsTitle}</h4>
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--card-border)' }}>
        <table className="data-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>{COPY.localTimeColumn} ({CHALLENGE_UTC_LABEL})</th>
              <th style={{ textAlign: 'center' }}>{COPY.pointsColumn}</th>
            </tr>
          </thead>
          <tbody>
            {WAKE_POINT_TABLE.map((row) => (
              <tr key={row.window}>
                <td>{row.window}</td>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
        {COPY.fivePointCapNote}
      </p>

      <div style={{ textAlign: 'right', marginTop: 32 }}>
        <button className="btn-primary" onClick={onClose}>{COPY.close}</button>
      </div>
    </Modal>
  );
}
