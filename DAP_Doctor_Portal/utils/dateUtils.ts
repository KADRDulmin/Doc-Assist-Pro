/**
 * Formats a date string into a more readable format
 * @param dateString The date string to format
 * @returns Formatted date string in the format "MMM DD, YYYY"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Formats a date string with time
 * @param dateString The date string to format
 * @returns Formatted date and time string in the format "MMM DD, YYYY, HH:MM AM/PM"
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Gets relative time (e.g., "2 days ago", "just now")
 * @param dateString The date string
 * @returns Relative time string
 */
export function getRelativeTime(dateString: string): string {
  if (!dateString) return 'N/A';
  
  return formatDistanceToNow(new Date(dateString));
}

/**
 * Format a date to show as "X time ago" (like 5 minutes ago, 2 hours ago, etc)
 * @param date - The date to format
 * @returns A formatted string
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // Less than a month
  if (diffInSeconds < 2419200) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // Format date as MM/DD/YYYY
  return date.toLocaleDateString();
}
