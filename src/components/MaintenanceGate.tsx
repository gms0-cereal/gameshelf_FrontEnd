import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { getSiteStatus } from '../services/Siteservice';
import type { SiteStatus } from '../services/Siteservice';

const POLL_MS = 60_000;
// Pages that stay reachable during maintenance so staff can sign in. Change if your login route differs.
const STAFF_PATHS = ['/login'];

const MaintenancePage: React.FC<{ siteName: string; title: string; message: string }> = ({ siteName, title, message }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#151519] px-6 text-center">
    <div className="flex max-w-md flex-col items-center gap-5 rounded-[10px] border border-[#38363f] bg-[#222228] p-10">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#383044] text-[#c2ade7]">
        <Wrench className="h-7 w-7" />
      </span>
      <p className="text-[11px] tracking-widest text-[#aaa6b5]">{siteName.toUpperCase()}</p>
      <h1 className="text-2xl font-semibold text-[#f0eef5]">{title}</h1>
      <p className="text-sm leading-relaxed text-[#aaa6b5]">{message}</p>
      <p className="text-[11px] text-[#76717f]">This page refreshes on its own when we are back.</p>
      {/* <Link to="/login" className="text-[11px] text-[#c2ade7] hover:underline">
        Staff sign in
      </Link> */}
    </div>
  </div>
);

export const MaintenanceGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState<SiteStatus | null>(null);
  const [checked, setChecked] = useState(false);

  const refresh = useCallback((signal?: AbortSignal) => {
    getSiteStatus(signal)
      .then((res) => {
        setStatus(res);
        setChecked(true);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        // If the status can't be read, keep the site usable rather than locking everyone out.
        setChecked(true);
      });
  }, []);

  // Re-check on every page change, so signing in as an admin lifts the page right away.
  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [location.pathname, refresh]);

  useEffect(() => {
    const recheck = () => refresh();
    const timer = window.setInterval(recheck, POLL_MS);
    window.addEventListener('gameshelf:maintenance', recheck);
    window.addEventListener('focus', recheck);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('gameshelf:maintenance', recheck);
      window.removeEventListener('focus', recheck);
    };
  }, [refresh]);

  if (!checked) return null; // avoids a flash of the normal site before the status arrives

  const maintenance = status?.maintenance;
  const blocked = !!maintenance?.enabled && !status?.can_bypass;
  if (blocked && maintenance && !STAFF_PATHS.includes(location.pathname)) {
    return <MaintenancePage siteName={status?.site_name ?? 'GameShelf'} title={maintenance.title} message={maintenance.message} />;
  }

  return (
    <>
      {children}
      {maintenance?.enabled && status?.can_bypass && (
        <div className="fixed bottom-3 right-3 z-50 rounded-md border border-[#dfc192] bg-[#393229] px-3 py-2 text-[11px] text-[#dfc192]">
          Maintenance mode is ON · visitors see the maintenance page
        </div>
      )}
    </>
  );
};