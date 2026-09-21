/**
 * Minimal runtime-agnostic database interface. Repositories depend only on
 * this, never on `D1Database` directly, so they can run unmodified against
 * either a real D1 binding or a `node:sqlite` instance in tests.
 */
export interface Db {
  run(sql: string, params?: unknown[]): Promise<void>;
  all<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  first<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
}

export type UserStatus = "active" | "archived";

export interface UserRow {
  id: string;
  telegram_user_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  interface_language: string;
  timezone: string | null;
  current_cefr_level: string | null;
  onboarding_completed: number;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_active_at: string | null;
}

export interface UserSettingsRow {
  user_id: string;
  daily_minutes: number;
  learning_goals_json: string;
  preferred_accent: string;
  interface_language: string;
  daily_reminder_enabled: number;
  daily_reminder_period: string | null;
  review_notifications: number;
  streak_notifications: number;
  duo_notifications: number;
  weekly_report_notifications: number;
  quiet_hours_enabled: number;
  quiet_start: string | null;
  quiet_end: string | null;
  show_level_to_duo: number;
  created_at: string;
  updated_at: string;
}

export interface UserAcquisitionRow {
  user_id: string;
  source: string | null;
  campaign: string | null;
  content: string | null;
  referrer_user_id: string | null;
  first_touch_at: string;
}

export interface LevelRow {
  id: string;
  code: string;
  name: string;
  order_index: number;
  description: string | null;
  is_active: number;
}
