import { wakePointsFromLocalTime, formatWakeFeedback, computeDailyNet, computeCumulative } from '../src/utils/scoring';

describe('scoring boundaries', () => {
  it('05:59:59 -> 5', () => {
    expect(wakePointsFromLocalTime('05:59:59')).toBe(5);
  });
  it('06:30:59 -> 5', () => {
    expect(wakePointsFromLocalTime('06:30:59')).toBe(5);
  });
  it('06:31:00 -> 4', () => {
    expect(wakePointsFromLocalTime('06:31:00')).toBe(4);
  });
  it('07:00:59 -> 4', () => {
    expect(wakePointsFromLocalTime('07:00:59')).toBe(4);
  });
  it('07:00:30 -> 4', () => {
    expect(wakePointsFromLocalTime('07:00:30')).toBe(4);
  });
  it('07:01:00 -> 3', () => {
    expect(wakePointsFromLocalTime('07:01:00')).toBe(3);
  });
  it('07:30:59 -> 3', () => {
    expect(wakePointsFromLocalTime('07:30:59')).toBe(3);
  });
  it('07:31:00 -> 2', () => {
    expect(wakePointsFromLocalTime('07:31:00')).toBe(2);
  });
  it('08:00:59 -> 2', () => {
    expect(wakePointsFromLocalTime('08:00:59')).toBe(2);
  });
  it('08:01:00 -> 1', () => {
    expect(wakePointsFromLocalTime('08:01:00')).toBe(1);
  });
  it('08:30:59 -> 1', () => {
    expect(wakePointsFromLocalTime('08:30:59')).toBe(1);
  });
  it('08:31:00 -> 0', () => {
    expect(wakePointsFromLocalTime('08:31:00')).toBe(0);
  });
  it('23:59:59 -> 0', () => {
    expect(wakePointsFromLocalTime('23:59:59')).toBe(0);
  });
});

describe('feedback', () => {
  it('late gives 0 pts — late', () => {
    expect(formatWakeFeedback(0)).toBe('0 pts — late');
  });
});

describe('nets', () => {
  it('daily net with penalty', () => {
    expect(computeDailyNet(0, true)).toBe(-1);
  });
  it('cumulative negative allowed', () => {
    expect(computeCumulative(1, 2)).toBe(-1);
  });
});
