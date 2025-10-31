/**
 * Date and time formatting utilities
 */

/**
 * Format date to readable string
 */
export function formatDate(
  date: Date | string,
  format: "short" | "long" | "relative" = "short"
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (format === "relative") {
    return formatRelativeTime(d);
  }

  const options: Intl.DateTimeFormatOptions =
    format === "long"
      ? { year: "numeric", month: "long", day: "numeric" }
      : { year: "numeric", month: "short", day: "numeric" };

  return d.toLocaleDateString("en-US", options);
}

/**
 * Format time to readable string
 */
export function formatTime(
  date: Date | string,
  includeSeconds = false
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds && { second: "2-digit" }),
  };
  return d.toLocaleTimeString("en-US", options);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is within the current week
 */
export function isThisWeek(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
  const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  return d >= firstDay && d <= lastDay;
}

/**
 * Get days until expiry
 */
export function getDaysUntilExpiry(expiryDate: Date | string): number {
  const expiry =
    typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  const today = new Date();
  const diffInMs = expiry.getTime() - today.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * Format expiry status
 */
export function formatExpiryStatus(expiryDate: Date | string): {
  text: string;
  variant: "success" | "warning" | "danger";
} {
  const days = getDaysUntilExpiry(expiryDate);

  if (days < 0) {
    return { text: `Expired ${Math.abs(days)} days ago`, variant: "danger" };
  }
  if (days === 0) {
    return { text: "Expires today", variant: "danger" };
  }
  if (days <= 3) {
    return { text: `Expires in ${days} days`, variant: "danger" };
  }
  if (days <= 7) {
    return { text: `Expires in ${days} days`, variant: "warning" };
  }
  return { text: `Expires in ${days} days`, variant: "success" };
}
