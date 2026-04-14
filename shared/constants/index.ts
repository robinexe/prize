export const APP_NAME = 'Prize Clube';

export const COLORS = {
  primary: '#FF6B00',
  primaryLight: '#FF8C33',
  primaryDark: '#CC5500',
  secondary: '#1E3A5F',
  secondaryLight: '#2A5080',
  secondaryDark: '#122640',
  white: '#FFFFFF',
  background: '#F8F9FA',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const RESERVATION_RULES = {
  MAX_ADVANCE_DAYS: 30,
  MIN_DURATION_HOURS: 2,
  MAX_DURATION_HOURS: 12,
  CANCELLATION_DEADLINE_HOURS: 24,
} as const;

export const DELINQUENCY_RULES = {
  GRACE_PERIOD_DAYS: 5,
  NOTIFICATION_AFTER_DAYS: 7,
  BLOCK_AFTER_DAYS: 15,
  LEGAL_AFTER_DAYS: 90,
} as const;

export const SHARE_RULES = {
  MIN_PERCENTAGE: 12.5,
  MAX_PERCENTAGE: 50,
} as const;

export const QUEUE_MAX_WAIT_HOURS = 4;

export const GEMINI_MODEL = 'gemini-2.0-flash';
