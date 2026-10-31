/**
 * Date calculation and formatting helpers for Brightloop.
 * Standardizes dates to YYYY-MM-DD interpreted in Asia/Kolkata timezone.
 */

export const getKolkataToday = () => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
};

export const addIntervalToDate = (dateStr, interval, count = 1) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const numCount = Number(count) || 1;

  switch (interval?.toLowerCase()) {
    case 'daily':
      d.setUTCDate(d.getUTCDate() + numCount);
      break;
    case 'weekly':
      d.setUTCDate(d.getUTCDate() + numCount * 7);
      break;
    case 'monthly':
      d.setUTCMonth(d.getUTCMonth() + numCount);
      break;
    case 'yearly':
      d.setUTCFullYear(d.getUTCFullYear() + numCount);
      break;
    default:
      d.setUTCMonth(d.getUTCMonth() + numCount);
  }

  return d.toISOString().split('T')[0];
};

export const isValidDateString = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
};
