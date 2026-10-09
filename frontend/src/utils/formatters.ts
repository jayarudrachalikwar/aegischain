export type SecurityClassification = 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const now = new Date().getTime();
    const then = new Date(isoString).getTime();
    const diffSeconds = Math.round((now - then) / 1000);

    if (diffSeconds < 60) return `${Math.max(1, diffSeconds)}s ago`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return isoString;
  }
}

export function getClassificationColor(level: SecurityClassification): {
  bg: string;
  text: string;
  border: string;
} {
  switch (level) {
    case 'RESTRICTED':
      return { bg: 'bg-red-950/80', text: 'text-signal-red', border: 'border-signal-red' };
    case 'CONFIDENTIAL':
      return { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-500/60' };
    case 'INTERNAL':
    default:
      return { bg: 'bg-stone-900/60', text: 'text-stone-400', border: 'border-stone-700' };
  }
}
