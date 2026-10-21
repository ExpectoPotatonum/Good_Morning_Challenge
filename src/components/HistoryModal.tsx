import { Modal } from './Modal';
import { COPY } from '../content/copy';
import { formatChallengeDate, formatChallengeTimestamp, formatPoints, isFutureDate } from '../utils/format';
import type { DashboardHistoryDate } from '../types';

/**
 * History modal: exactly the 11 challenge dates for both participants.
 * Missing past/current records show `Not checked in`; future dates show `—`.
 */
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
      <h3>{COPY.viewHistory}</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Date</th>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Player</th>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Check in</th>
            <th style={{ padding: '4px 8px' }}>Wake</th>
            <th style={{ padding: '4px 8px' }}>Sleep back</th>
            <th style={{ padding: '4px 8px' }}>Net</th>
          </tr>
        </thead>
        <tbody>
          {history.map((dateRow) => {
            const future = isFutureDate(dateRow.date, serverDate);
            return dateRow.rows.map((row, index) => (
              <tr key={`${dateRow.date}-${row.participant_key}`}>
                {index === 0 ? (
                  <td rowSpan={dateRow.rows.length} style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
                    {formatChallengeDate(dateRow.date)}
                  </td>
                ) : null}
                <td style={{ padding: '4px 8px' }}>{row.display_name}</td>
                <td style={{ padding: '4px 8px' }}>
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
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                  {future ? COPY.futureDash : row.record ? formatPoints(row.record.wake_points) : COPY.futureDash}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                  {future
                    ? COPY.futureDash
                    : row.record
                      ? row.record.sleep_back_at
                        ? COPY.sleepBack
                        : COPY.noSleepBack
                      : COPY.futureDash}
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                  {future ? COPY.futureDash : row.record ? row.record.daily_net : COPY.futureDash}
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
      <div style={{ textAlign: 'right', marginTop: 12 }}>
        <button onClick={onClose}>{COPY.close}</button>
      </div>
    </Modal>
  );
}
