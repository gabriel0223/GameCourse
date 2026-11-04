export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

// Players' reports are rough, so minutes would promise too much past the first hour.
export function formatPlaytime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return formatDuration(Math.max(5, Math.round(minutes / 5) * 5));
  return formatDuration(Math.round(minutes / 60) * 60);
}

export function formatDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date).toLocaleDateString('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
