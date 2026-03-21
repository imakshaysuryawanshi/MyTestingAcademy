import { formatDistanceToNow, isPast, differenceInDays } from 'date-fns';

export const daysAgo = (isoDate) =>
  formatDistanceToNow(new Date(isoDate), { addSuffix: true });

export const isStale = (isoDate, days = 14) =>
  differenceInDays(new Date(), new Date(isoDate)) >= days;

export const isOverdue = (isoDate) =>
  isoDate && isPast(new Date(isoDate));

export const todayISO = () => new Date().toISOString().split('T')[0];

export const formatLogTimestamp = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};
