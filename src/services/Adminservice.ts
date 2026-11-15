import axios from 'axios';
import api from '../lib/api';

/* ───────────────────────── Dashboard ───────────────────────── */

export type IntervalOption = 'daily' | 'weekly';

export interface SeriesPoint {
  date: string; // ISO date or datetime; use the first 10 characters for the day
  value: number;
  cumulative?: number;
}

export interface DashboardResponse {
  reporting: {
    date_from: string;
    date_to: string;
    interval: IntervalOption;
    timezone: string;
  };
  snapshot: {
    generated_at: string;
    activity_definition: string;
    activity_source: string;
  };
  summary: {
    registered_users: { value: number; new: number; change_percent: number | string | null };
    daily_active_users: { value: number; date: string };
    monthly_active_users: { value: number; period: string };
    games: {
      total: number;
      published: number | null;
      draft: number | null;
      archived: number | null;
      publication_status_available: boolean;
    };
  };
  charts: {
    user_views: { interval: IntervalOption; points: SeriesPoint[]; baseline: number };
    activity: { interval: IntervalOption; points: SeriesPoint[] };
    community_submissions: {
      interval: IntervalOption;
      ratings: SeriesPoint[];
      reviews: SeriesPoint[];
    };
    catalogue_growth: {
      interval: IntervalOption;
      points: SeriesPoint[];
      available: boolean;
      reason?: string;
    };
  };
}

export async function getDashboard(
  interval: IntervalOption,
  signal?: AbortSignal,
): Promise<DashboardResponse> {
  const res = await api.get<DashboardResponse>('/analytics/dashboard/', {
    params: { interval },
    signal,
  });
  return res.data;
}

export async function downloadDashboardExport(params: {
  interval: IntervalOption;
  date_from: string;
  date_to: string;
}): Promise<void> {
  const res = await api.get('/analytics/dashboard/export/', {
    params,
    responseType: 'blob',
  });
  // Content-Disposition is only readable cross-origin if Django exposes it via CORS,
  // so fall back to building the same filename the backend uses.
  const disposition = res.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename="?([^";]+)"?/);
  const filename = match?.[1] ?? `gameshelf-dashboard-${params.date_from}-${params.date_to}.csv`;

  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/* ───────────────────────── Dashboard (full) ───────────────────────── */

export interface CatalogueStats {
  points: SeriesPoint[];
  baseline: number;
  new: number;
  total: number;
  by_source: { source: string; count: number }[];
}

export interface EngagementStats {
  events_total: number;
  clicks: number | null;
  impressions: number | null;
  ctr_percent: number | null;
  by_type: { event_type: string; count: number; users: number }[];
  series: SeriesPoint[];
}

export interface ModerationStats {
  open_reports: number;
  reports_new: number;
  active_sanctions: number;
  sanctions_new: number;
  pending_appeals: number;
  appeals_new: number;
  series: SeriesPoint[];
  by_reason: { reason: string; count: number }[];
}

export interface OperationsStats {
  staff: SeriesPoint[];
  security: SeriesPoint[];
  staff_total: number;
  security_total: number;
  failed_logins: number;
}

export interface AccountBreakdown {
  total: number;
  verified: number;
  unverified: number;
  active: number;
  suspended: number;
  inactive: number;
}

export interface DashboardFull extends Omit<DashboardResponse, 'charts'> {
  charts: DashboardResponse['charts'] & {
    catalogue: CatalogueStats;
    moderation: ModerationStats;
    operations: OperationsStats;
    accounts: AccountBreakdown;
    genres: { name: string; count: number }[];
  };
}

export async function getDashboardFull(
  interval: IntervalOption,
  signal?: AbortSignal,
): Promise<DashboardFull> {
  const res = await api.get<DashboardFull>('/analytics/dashboard/', { params: { interval }, signal });
  return res.data;
}

/* ───────────────────────── User management ───────────────────────── */

export type UserRole = 'user' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'inactive';

// The one place that maps Django role/status values to the labels the UI shows.
export const ROLE_LABEL: Record<UserRole, string> = {
  user: 'Regular User',
  moderator: 'Moderator',
  admin: 'Administrator',
};
export const STATUS_LABEL: Record<UserStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  inactive: 'Inactive',
};

export interface AdminUser {
  id: number;
  username: string;
  nickname: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
  email_verified: boolean;
  note: string;
  joined: string;
  last_login: string | null;
  suspended_until: string | null;
  is_self: boolean;
}

export interface AdminUserList {
  count: number;
  page: number;
  page_size: number;
  results: AdminUser[];
  counts: {
    total: number;
    regular: number;
    moderators: number;
    admins: number;
    logged_in_30d: number;
  };
}

export interface AdminUserQuery {
  search?: string;
  role?: UserRole | null;
  status?: UserStatus | null;
  page?: number;
  page_size?: number;
}

export async function getAdminUsers(
  query: AdminUserQuery,
  signal?: AbortSignal,
): Promise<AdminUserList> {
  const res = await api.get<AdminUserList>('/analytics/users/', {
    params: {
      search: query.search || undefined,
      role: query.role || undefined,
      status: query.status || undefined,
      page: query.page,
      page_size: query.page_size,
    },
    signal,
  });
  return res.data;
}

export async function getAdminUser(id: number, signal?: AbortSignal): Promise<AdminUser> {
  const res = await api.get<AdminUser>(`/analytics/users/${id}/`, { signal });
  return res.data;
}

export async function updateAdminUser(
  id: number,
  patch: { role?: UserRole; is_active?: boolean; reason?: string },
): Promise<AdminUser> {
  const res = await api.patch<AdminUser>(`/analytics/users/${id}/`, patch);
  return res.data;
}

/* ───────────────────────── Website settings ───────────────────────── */

export type LibraryVisibility = 'public' | 'friends' | 'private';

export interface AdminSettings {
  site_name: string;
  support_email: string;
  tagline: string;
  require_verified_email: boolean;
  one_rating_per_game: boolean;
  review_first_time: boolean;
  hide_spoilers: boolean;
  detect_anomalies: boolean;
  escalation_threshold: number;
  min_review_length: number;
  default_library_visibility: LibraryVisibility;
  appeal_window_days: number;
  maintenance_enabled: boolean;
  maintenance_title: string;
  maintenance_message: string;
}

export interface SettingsResponse {
  settings: AdminSettings;
  last_updated: { at: string; by: string | null } | null;
}

export async function getAdminSettings(signal?: AbortSignal): Promise<SettingsResponse> {
  const res = await api.get<SettingsResponse>('/analytics/settings/', { signal });
  return res.data;
}

export async function saveAdminSettings(
  settings: Partial<AdminSettings>,
  reason: string,
): Promise<SettingsResponse> {
  const res = await api.patch<SettingsResponse>('/analytics/settings/', { settings, reason });
  return res.data;
}

/* ───────────────────────── System logs ───────────────────────── */

export type LogSeverity = 'Info' | 'Warning' | 'Error';
export type LogTab = 'all' | 'staff' | 'security';

export interface AdminLog {
  id: string;
  type: string;
  description: string;
  actor: string;
  timestamp: string;
  severity: LogSeverity;
  status: string;
  related: string | null;
  source: string | null;
  outcome: string | null;
  category: 'staff' | 'security';
}

export interface AdminLogList {
  count: number;
  page: number;
  page_size: number;
  results: AdminLog[];
  summary: {
    events_today: number;
    security_today: number;
    failed_logins_today: number;
    staff_today: number;
    total: number;
  };
}

export interface AdminLogQuery {
  search?: string;
  type?: string;
  severity?: LogSeverity | null;
  tab?: LogTab;
  entity_type?: string;
  entity_id?: number;
  page?: number;
  page_size?: number;
}

export async function getAdminLogs(query: AdminLogQuery, signal?: AbortSignal): Promise<AdminLogList> {
  const res = await api.get<AdminLogList>('/analytics/logs/', {
    params: {
      search: query.search || undefined,
      type: query.type || undefined,
      severity: query.severity || undefined,
      tab: query.tab && query.tab !== 'all' ? query.tab : undefined,
      entity_type: query.entity_type,
      entity_id: query.entity_id,
      page: query.page,
      page_size: query.page_size,
    },
    signal,
  });
  return res.data;
}

/* ───────────────────────── Platform analytics ───────────────────────── */

export interface PlatformData {
  reporting: DashboardResponse['reporting'];
  snapshot: DashboardResponse['snapshot'];
  traffic: {
    dau: { value: number; date: string };
    mau: { value: number };
    stickiness_percent: number | null;
    active_users: SeriesPoint[];
  };
  engagement: EngagementStats & {
    top_games: { game_id: number; title: string; events: number; users: number }[];
  };
  acquisition: {
    new_registrations: number;
    registered_total: number;
    registered_at_start: number;
    growth_percent: number | null;
    avg_per_day: number;
    active_30d: number;
    inactive: number;
    registrations: SeriesPoint[];
    accounts: AccountBreakdown;
  };
  content: {
    games_total: number;
    games_new: number;
    comments: { new: number; total: number };
    reviews: { new: number; total: number };
    ratings: { new: number; total: number };
    submissions: { ratings: SeriesPoint[]; reviews: SeriesPoint[] };
    top_reviewed: { game_id: number; title: string; reviews: number; ratings: number; avg_score: number | null }[];
    rating_distribution: { score: number; count: number }[];
    genres: { name: string; count: number }[];
  };
  safety: ModerationStats;
}

export async function getPlatformData(
  params: { interval: IntervalOption; date_from?: string; date_to?: string },
  signal?: AbortSignal,
): Promise<PlatformData> {
  const res = await api.get<PlatformData>('/analytics/platform/', {
    params: {
      interval: params.interval,
      date_from: params.date_from || undefined,
      date_to: params.date_to || undefined,
    },
    signal,
  });
  return res.data;
}

/* ───────────────────────── Signed-in account ───────────────────────── */

export interface CurrentUser {
  id: number;
  username: string;
  nickname: string | null;
  email: string;
  role: UserRole;
  avatar_url: string | null;
}

export async function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  const res = await api.get<CurrentUser>('/analytics/whoami/', { signal });
  return res.data;
}

/* ───────────────────────── Errors ───────────────────────── */

export function getErrorMessage(err: unknown, fallback = 'Unable to load data.'): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Cannot reach the server. Check your connection and try again.';
    const { status, data } = err.response;
    if (status === 401) return 'Your session has expired. Please log in again.';
    if (status === 403) return 'Your account does not have permission to do this.';
    if ((status === 400 || status === 404 || status === 409) && data && typeof data.detail === 'string') {
      return data.detail;
    }
    if (status === 404) return 'The requested item was not found.';
    if (status === 409) return 'That change conflicts with the current state.';
    if (status >= 500) return 'The server ran into a problem. Try again in a moment.';
  }
  return fallback;
}