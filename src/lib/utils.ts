import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format phone number to +7 (XXX) XXX XX-XX
 * Accepts any input, strips non-digits, enforces Russian +7 format
 */
export function formatPhoneNumber(value: string): string {
  // Strip everything except digits
  let digits = value.replace(/\D/g, '');

  // Normalize: if starts with 8, replace with 7; if no leading 7, prepend 7
  if (digits.startsWith('8') && digits.length >= 1) {
    digits = '7' + digits.slice(1);
  }
  if (!digits.startsWith('7') && digits.length > 0) {
    digits = '7' + digits;
  }

  // Limit to 11 digits (7 + 10)
  digits = digits.slice(0, 11);

  // Build formatted string progressively
  if (digits.length === 0) return '';
  let result = '+7';
  if (digits.length > 1) {
    result += ' (' + digits.slice(1, Math.min(4, digits.length));
    if (digits.length >= 4) result += ')';
  }
  if (digits.length > 4) {
    result += ' ' + digits.slice(4, Math.min(7, digits.length));
  }
  if (digits.length > 7) {
    result += ' ' + digits.slice(7, Math.min(9, digits.length));
  }
  if (digits.length > 9) {
    result += '-' + digits.slice(9, 11);
  }
  return result;
}

/**
 * Extract raw digits from formatted phone (for sending to server)
 */
export function phoneToDigits(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\sа-яё]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}
