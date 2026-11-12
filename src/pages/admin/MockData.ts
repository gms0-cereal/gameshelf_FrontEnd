// ============================================================
// GameShelf workspaces — ALL mock / demo data lives in this file.
// Replace each export with an API call when the backend is ready.
// ============================================================


// ───────────── Users (User Management / Role & Permissions) ─────────────
export type Role = 'Regular User' | 'Moderator' | 'Administrator';
export type Status = 'Active' | 'Suspended' | 'Inactive';

export interface UserRow {
  id: string;
  username: string;
  note: string;
  email: string;
  created: string;
  status: Status;
  role: Role;
  lastActivity: string;
  action: string;
}

export const ROLES: Role[] = ['Regular User', 'Moderator', 'Administrator'];

// Demo data from Figma → Administrator workspace / User Management
export const users: UserRow[] = [
  { id: 'U-1140', username: 'JordanVale', note: 'Verified email', email: 'jordan.vale@example.test', created: '12 May 2026', status: 'Active', role: 'Moderator', lastActivity: '02 Nov · 10:12', action: 'Profile / Role →' },
  { id: 'U-1001', username: 'PlayerOne', note: 'Verified email', email: 'player.one@example.test', created: '18 Jan 2026', status: 'Active', role: 'Regular User', lastActivity: '02 Nov · 10:06', action: 'Profile / Edit →' },
  { id: 'U-1024', username: 'AshRunner', note: '1 prior warning', email: 'ash.runner@example.test', created: '08 Jun 2026', status: 'Active', role: 'Regular User', lastActivity: '02 Nov · 09:12', action: 'Profile / Suspend…' },
  { id: 'U-1088', username: 'PixelDrift', note: 'S-0208 · Appeal A-031', email: 'pixel.drift@example.test', created: '12 Apr 2026', status: 'Suspended', role: 'Regular User', lastActivity: '01 Nov · 13:40', action: 'Profile / Review →' },
  { id: 'U-1036', username: 'LunaByte', note: 'Verified email', email: 'luna.byte@example.test', created: '19 Feb 2026', status: 'Active', role: 'Regular User', lastActivity: '02 Nov · 08:02', action: 'Profile / Promote…' },
  { id: 'U-0980', username: 'QuietFern', note: 'Self-deactivated', email: 'quiet.fern@example.test', created: '08 Feb 2026', status: 'Inactive', role: 'Regular User', lastActivity: '18 Sep · 16:05', action: 'Profile / Reactivate…' },
];


// ───────────── Administrator Overview ─────────────
/* ---------------- Demo data (04 Oct – 02 Nov 2026) ---------------- */
export const ovDays = Array.from({ length: 30 }, (_, i) => (i <= 27 ? `${String(4 + i).padStart(2, '0')} Oct` : `0${i - 27} Nov`));
export const ovLerp = (a: number, b: number, i: number) => Math.round(a + ((b - a) * i) / 29);
export const ovXTicks = [ovDays[0], ovDays[7], ovDays[14], ovDays[21], ovDays[29]];

export const ovUserGrowth = ovDays.map((day, i) => ({ day, users: ovLerp(11500, 12840, i) }));
export const ovActivity = ovDays.map((day, i) => ({ day, mau: ovLerp(7800, 8760, i), dau: ovLerp(1250, 1842, i) }));
export const ovCatalogue = ovDays.map((day, i) => ({
  day,
  published: i < 7 ? 31 : i < 14 ? 32 : i < 20 ? 33 : 34,
  previous: i < 3 ? null : i < 11 ? 29 : i < 20 ? 30 : 31,
}));
export const ovSubmissions = [
  { week: '04–10 Oct', ratings: 90, reviews: 20 },
  { week: '11–17 Oct', ratings: 110, reviews: 24 },
  { week: '18–24 Oct', ratings: 122, reviews: 22 },
  { week: '25 Oct–02 Nov', ratings: 126, reviews: 30 },
];
export const ovCtrTrend = [20, 26, 23, 30, 28, 36, 32, 40, 44, 42, 49, 52];



// ───────────── Platform Analytics ─────────────
/* ---------------- Demo data (04 Oct – 02 Nov 2026) ---------------- */
export const anDayLabel = (offset: number) => (offset <= 27 ? `${String(4 + offset).padStart(2, '0')} Oct` : `0${offset - 27} Nov`);
export const anDays = Array.from({ length: 30 }, (_, i) => anDayLabel(i));
export const anDayTicks = [anDays[0], anDays[7], anDays[14], anDays[21], anDays[29]];

export const anTraffic = anDays.map((day, i) => {
  const views = Math.round(15400 + 2600 * Math.sin(i / 4.6) + (i - 14.5) * 40);
  return { day, views, visits: Math.round(views / 2.33) };
});
export const anSubmissions = anDays.map((day, i) => ({
  day,
  ratings: Math.round(15 + 4 * Math.sin(i / 3.2) + (i - 14.5) * 0.05),
  reviews: Math.round(3.2 + 1.4 * Math.sin(i / 2.4 + 1)),
}));
export const anRegValues = [28, 36, 31, 43, 40, 37, 46, 42, 51, 48, 56, 57];
export const anRegistrations = anRegValues.map((users, i) => ({ day: anDayLabel(Math.round((i * 29) / 11)), users }));
export const anRegTicks = [anRegistrations[0].day, anRegistrations[3].day, anRegistrations[6].day, anRegistrations[9].day, anRegistrations[11].day];

export interface PageRow { game: string; views: string; engagement: string }
export const anTopPages: PageRow[] = [
  { game: 'Hollow Knight', views: '28,400', engagement: '4m 12s' },
  { game: 'Hades', views: '24,600', engagement: '3m 48s' },
  { game: 'Stardew Valley', views: '20,100', engagement: '4m 06s' },
  { game: 'Celeste', views: '16,800', engagement: '3m 22s' },
];
export interface SourceRow { source: string; accounts: string; share: string }
export const anSources: SourceRow[] = [
  { source: 'Organic search', accounts: '558', share: '45%' },
  { source: 'Direct', accounts: '372', share: '30%' },
  { source: 'Community referral', accounts: '186', share: '15%' },
  { source: 'Other', accounts: '124', share: '10%' },
];
export interface ReviewedRow { game: string; reviews: number; adds: number }
export const anReviewed: ReviewedRow[] = [
  { game: 'Hades', reviews: 18, adds: 540 },
  { game: 'Hollow Knight', reviews: 16, adds: 620 },
  { game: 'Stardew Valley', reviews: 14, adds: 480 },
  { game: 'Slay the Spire', reviews: 11, adds: 320 },
];


// ───────────── Role & Permissions matrix ─────────────
/* ---------- Permission matrix (Figma) ---------- */
export interface Capability {
  name: string;
  user: string;
  moderator: string;
  admin: string;
}
export const matrix: Capability[] = [
  { name: 'Manage own library, ratings & reviews', user: 'Own content', moderator: 'Own content', admin: 'Own content' },
  { name: 'View reports & preserved evidence', user: 'No access', moderator: 'Community safety', admin: 'Site-wide oversight' },
  { name: 'Moderate content, sanctions & appeals', user: 'No access', moderator: 'Community safety', admin: 'Site-wide oversight' },
  { name: 'Manage users, roles & permissions', user: 'No access', moderator: 'No access', admin: 'Site-wide' },
  { name: 'Operate algorithms, API & database tools', user: 'No access', moderator: 'No access', admin: 'Site-wide' },
  { name: 'Change website configuration & view audit logs', user: 'No access', moderator: 'No access', admin: 'Site-wide' },
];


// ───────────── System Logs ─────────────
export type Severity = 'Error' | 'Warning' | 'Info';
export type LogStatus = 'Open' | 'Logged' | 'Success' | 'Blocked';

export interface Log {
  id: string;
  type: string;
  description: string;
  actor: string;
  timestamp: string;
  severity: Severity;
  status: LogStatus;
  related?: string;
  source?: string;
  outcome?: string;
}

// Demo data from Figma → System Logs
export const logs: Log[] = [
  { id: 'EV-0911', type: 'algorithm.run.failed', description: 'MR-0412 · TF-IDF · DATASET_FETCH_TIMEOUT', actor: 'Worker service', timestamp: '02 Nov · 10:02:14', severity: 'Error', status: 'Open', related: 'MR-0412 · DS-1102 · INC-014', source: 'Worker service · Scheduled execution', outcome: 'Failed run retained; last successful index still live' },
  { id: 'EV-0910', type: 'algorithm.trigger', description: 'TF-IDF refresh · MR-0412 · DS-1102', actor: 'Scheduler', timestamp: '02 Nov · 10:00:00', severity: 'Info', status: 'Logged' },
  { id: 'EV-0909', type: 'permission.policy.updated', description: 'Staff MFA enforced · Policy PERM-004', actor: 'Alex Chen · AD-001', timestamp: '02 Nov · 09:50:00', severity: 'Warning', status: 'Success' },
  { id: 'EV-0908', type: 'user.role.changed', description: 'U-1140 · Regular User → Moderator', actor: 'Alex Chen · AD-001', timestamp: '02 Nov · 09:40:00', severity: 'Warning', status: 'Success', related: 'U-1140 · AR-0041' },
  { id: 'EV-0907', type: 'report.assigned', description: 'R-1048 · Assigned to Maya Ross', actor: 'Maya Ross · MOD-02', timestamp: '02 Nov · 09:24:00', severity: 'Info', status: 'Success' },
  { id: 'EV-0906', type: 'configuration.updated', description: 'CFG-0027 · Daily operations digest enabled', actor: 'Alex Chen · AD-001', timestamp: '02 Nov · 09:10:00', severity: 'Info', status: 'Success' },
  { id: 'EV-0904', type: 'auth.login.failed', description: 'Staff login rejected · Invalid password; no session', actor: 'Auth service', timestamp: '02 Nov · 08:55:02', severity: 'Warning', status: 'Blocked' },
  { id: 'EV-0900', type: 'sanction.applied', description: 'S-0208 · PixelDrift · 7-day suspension', actor: 'Noah Kim · MOD-03', timestamp: '01 Nov · 14:00:00', severity: 'Warning', status: 'Success' },
];



// ───────────── Website Settings ─────────────
export interface Settings {
  siteName: string;
  supportEmail: string;
  tagline: string;
  requireVerifiedEmail: boolean;
  oneRatingPerGame: boolean;
  reviewFirstTime: boolean;
  hideSpoilers: boolean;
  detectAnomalies: boolean;
  escalation: string;
  minReviewLength: string;
  libraryVisibility: string;
  appealWindow: string;
  retention: string;
  requireStaffMfa: boolean;
}

export const settingsInitial: Settings = {
  siteName: 'GameShelf',
  supportEmail: 'support@gameshelf.example',
  tagline: 'Your next adventure starts here.',
  requireVerifiedEmail: true,
  oneRatingPerGame: true,
  reviewFirstTime: true,
  hideSpoilers: true,
  detectAnomalies: true,
  escalation: '3 reports per content item',
  minReviewLength: '40 characters',
  libraryVisibility: 'Public · User can change',
  appealWindow: '14 days after sanction',
  retention: '365 days',
  requireStaffMfa: true,
};

export const settingsOptions = {
  escalation: ['2 reports per content item', '3 reports per content item', '5 reports per content item'],
  libraryVisibility: ['Public · User can change', 'Private · User can change', 'Public · Locked'],
  appealWindow: ['7 days after sanction', '14 days after sanction', '30 days after sanction'],
  retention: ['180 days', '365 days', '730 days'],
};