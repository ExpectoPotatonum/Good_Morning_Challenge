import { Modal } from './Modal';
import { COPY, RULES_BULLETS, WAKE_POINT_TABLE } from '../content/copy';
import { CHALLENGE_UTC_LABEL } from '../utils/format';

export function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} label={COPY.rules}>
      <h3>Rules</h3>
      <ul style={{ textAlign: 'left', paddingLeft: 20, lineHeight: 1.6 }}>
        {RULES_BULLETS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <h4>Wake points</h4>
      <table style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '4px 10px', borderBottom: '1px solid #ccc' }}>
              Local time ({CHALLENGE_UTC_LABEL})
            </th>
            <th style={{ padding: '4px 10px', borderBottom: '1px solid #ccc' }}>Wake points</th>
          </tr>
        </thead>
        <tbody>
          {WAKE_POINT_TABLE.map((row) => (
            <tr key={row.window}>
              <td style={{ padding: '4px 10px' }}>{row.window}</td>
              <td style={{ padding: '4px 10px', textAlign: 'center' }}>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 10, fontSize: 13, color: '#666' }}>
        The 5-point cap applies to every earlier time, including before 06:01.
      </p>
      <div style={{ textAlign: 'right', marginTop: 12 }}>
        <button onClick={onClose}>{COPY.close}</button>
      </div>
    </Modal>
  );
}
