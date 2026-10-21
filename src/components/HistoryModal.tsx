import { Modal } from './Modal';
import { COPY } from '../content/copy';
import { formatChallengeDate, formatChallengeTimestamp, formatPoints, isFutureDate } from '../utils/format';
import type { DashboardHistoryDate } from '../types';

export function HistoryModal({
  open,
  onClose,
  history,
  serverDate,
}: {
  open: boolean;
  onClose: () => void;
  history: DashboardHistoryDate[];
  serverDate?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} label={COPY.viewHistory}>
      {/* Header stays put: only the table below scrolls, so the X is always
          reachable without scrolling to the bottom of 22 rows. */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 22 }}>{COPY.viewHistory}</h3>
        <button
          className="btn-ghost"
          aria-label={COPY.close}
          onClick={onClose}
          style={{ padding: '0 10px', fontSize: 26, lineHeight: 1, fontWeight: 400 }}
        >
          ×
        </button>
      </div>

      <div style={{ overflow: 'auto', maxHeight: '52vh', borderRadius: 12, border: '1px solid var(--card-border)' }}>
        <table className="data-table sticky-head" style={{ margin: 0, minWidth: 600 }}>
          <thead>
            <tr>
              <th>{COPY.historyDate}</th>
              <th>{COPY.historyPlayer}</th>
              <th>{COPY.historyCheckIn}</th>
              <th style={{ textAlign: 'center' }}>{COPY.historyWake}</th>
              <th style={{ textAlign: 'center' }}>{COPY.historySleepBackColumn}</th>
              <th style={{ textAlign: 'center' }}>{COPY.historyNet}</th>
            </tr>
          </thead>
          <tbody>
            {history.map((dateRow) => {
              const future = isFutureDate(dateRow.date, serverDate);
              return dateRow.rows.map((row, index) => (
                <tr key={`${dateRow.date}-${row.participant_key}`}>
                  {index === 0 ? (
                    <td rowSpan={dateRow.rows.length} style={{ whiteSpace: 'nowrap', verticalAlign: 'top', borderRight: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.01)' }}>
                      <span style={{ fontWeight: 600 }}>{formatChallengeDate(dateRow.date)}</span>
                    </td>
                  ) : null}
                  <td style={{ fontWeight: 500, color: 'var(--text-h)' }}>{row.display_name}</td>
                  <td style={{ color: future || !row.record ? 'var(--text-muted)' : 'var(--text)' }}>
                    {future ? (
                      COPY.futureDash
                    ) : row.record ? (
                      row.record.entry_source === 'day_one_seed' ? (
                        COPY.initialReportLabel
                      ) : (
                        formatChallengeTimestamp(row.record.checked_in_at)
                      )
                    ) : (
                      COPY.notCheckedIn
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {future ? COPY.futureDash : row.record ? formatPoints(row.record.wake_points) : COPY.futureDash}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {future
                      ? COPY.futureDash
                      : row.record
                        ? row.record.sleep_back_at
                          ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{COPY.sleepBack}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>{COPY.noSleepBack}</span>
                        : COPY.futureDash}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-h)' }}>
                    {future ? COPY.futureDash : row.record ? row.record.daily_net : COPY.futureDash}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'right', marginTop: 20 }}>
        <button className="btn-primary" onClick={onClose}>{COPY.close}</button>
      </div>
    </Modal>
  );
}
