import api from '../lib/api';

export interface SiteStatus {
  site_name: string;
  maintenance: { enabled: boolean; title: string; message: string };
  can_bypass: boolean;
}

export async function getSiteStatus(signal?: AbortSignal): Promise<SiteStatus> {
  const res = await api.get<SiteStatus>('/analytics/site-status/', { signal, timeout: 8000 });
  return res.data;
}