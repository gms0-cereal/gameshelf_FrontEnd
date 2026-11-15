import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  Banner,
  DataTable,
  Field,
  InfoLine,
  Modal,
  PageHeading,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SectionHeading,
  SelectInput,
  StatusBadge,
  TextArea,
  TextInput,
  WorkspaceFooter,
} from '../../components/admin/AdminLayout';
import type { Column } from '../../components/admin/AdminLayout';
import { ROLE_LABEL, STATUS_LABEL, getAdminLogs, getAdminUser, getErrorMessage, updateAdminUser } from '../../services/Adminservice';
import type { AdminLog, AdminUser, UserRole } from '../../services/Adminservice';

interface Capability {
  name: string;
  user: string;
  moderator: string;
  admin: string;
}

// Mirrors the backend permission classes: moderation endpoints allow moderator + admin,
// everything under the admin API allows admin only.
const matrix: Capability[] = [
  { name: 'Browse games, rate and review', user: 'Yes', moderator: 'Yes', admin: 'Yes' },
  { name: 'Comment and report content', user: 'Yes', moderator: 'Yes', admin: 'Yes' },
  { name: 'Review reports and issue sanctions', user: '—', moderator: 'Yes', admin: 'Yes' },
  { name: 'Decide sanction appeals', user: '—', moderator: 'Yes', admin: 'Yes' },
  { name: 'View moderation history', user: '—', moderator: 'Yes', admin: 'Yes' },
  { name: 'User management and role changes', user: '—', moderator: '—', admin: 'Yes' },
  { name: 'Platform analytics dashboard', user: '—', moderator: '—', admin: 'Yes' },
  { name: 'System logs', user: '—', moderator: '—', admin: 'Yes' },
  { name: 'Website settings', user: '—', moderator: '—', admin: 'Yes' },
];

const matrixColumns: Column<Capability>[] = [
  { header: 'Capability', className: 'w-[34%] text-[#f0eef5]', cell: (c) => c.name },
  { header: 'Regular User', className: 'text-[#aaa6b5]', cell: (c) => c.user },
  { header: 'Moderator', className: 'text-[#aaa6b5]', cell: (c) => c.moderator },
  { header: 'Administrator', className: 'text-[#c2ade7]', cell: (c) => c.admin },
];

const ROLES: UserRole[] = ['user', 'moderator', 'admin'];
const rank: Record<UserRole, number> = { user: 0, moderator: 1, admin: 2 };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtStamp = (iso: string) =>
  `${new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}, ${new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`;

export const UserRoleManagement: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const id = Number(userId);
  const validId = Number.isInteger(id) && id > 0;

  const [user, setUser] = useState<AdminUser | null>(null);
  const [history, setHistory] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(validId);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [draftRole, setDraftRole] = useState<UserRole>('user');
  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmReason, setConfirmReason] = useState('');
  const [typedName, setTypedName] = useState('');
  const [lifecycleReason, setLifecycleReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!validId) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([
      getAdminUser(id, controller.signal),
      getAdminLogs({ entity_type: 'users', entity_id: id, page_size: 5 }, controller.signal),
    ])
      .then(([u, logs]) => {
        setUser(u);
        setHistory(logs.results);
        setDraftRole(u.role);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setUser(null);
        setError(getErrorMessage(err, 'Unable to load this user.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, validId, reloadKey]);

  if (!validId) {
    return (
      <AdminLayout>
        <PageHeading eyebrow="PLATFORM OPERATIONS" title="User Profile & Role Management" description="No user selected." />
        <Panel className="p-6 text-center text-[12px] text-[#aaa6b5]">
          Pick an account from <Link to="/admin/users" className="text-[#c2ade7] hover:underline">User Management</Link> to manage its role.
        </Panel>
        <WorkspaceFooter />
      </AdminLayout>
    );
  }

  const isPromotion = user ? rank[draftRole] > rank[user.role] : false;
  const canReview = !!user && !user.is_self && draftRole !== user.role && reason.trim().length > 0;
  const canConfirm = !!user && confirmReason.trim().length > 0 && typedName === user.username && !busy;

  const openConfirm = () => {
    setConfirmReason(reason);
    setTypedName('');
    setActionError(null);
    setConfirmOpen(true);
  };

  const applyChange = async () => {
    if (!user) return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await updateAdminUser(user.id, { role: draftRole, reason: confirmReason.trim() });
      setNotice(
        `${updated.username} changed from ${ROLE_LABEL[user.role]} to ${ROLE_LABEL[updated.role]}. The change was recorded in the audit log.`,
      );
      setConfirmOpen(false);
      setReason('');
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to change this role.'));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async () => {
    if (!user) return;
    const verb = user.is_active ? 'Deactivate' : 'Reactivate';
    if (!window.confirm(`${verb} ${user.username}?`)) return;
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await updateAdminUser(user.id, { is_active: !user.is_active, reason: lifecycleReason.trim() || undefined });
      setNotice(`${user.username} ${user.is_active ? 'deactivated' : 'reactivated'} successfully.`);
      setLifecycleReason('');
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to update this account.'));
    } finally {
      setBusy(false);
    }
  };

  const roleChip = (role: UserRole) => {
    const suffix = user && role === user.role ? ' · Current' : role === draftRole ? ' · Proposed' : '';
    return (
      <StatusBadge key={role} tone="info">
        {ROLE_LABEL[role]}
        {suffix}
      </StatusBadge>
    );
  };

  return (
    <AdminLayout>
      <PageHeading
        eyebrow="PLATFORM OPERATIONS"
        title="User Profile & Role Management"
        description={user ? `U-${user.id} · ${user.username} · User Management / Profile / Role & Permissions` : 'Loading account…'}
      />

      {notice && <Banner tone="success">{notice}</Banner>}
      {actionError && !confirmOpen && <Banner tone="warning">{actionError}</Banner>}

      {error ? (
        <Panel role="alert" className="flex items-center justify-between gap-4 p-4">
          <p className="text-[12px] text-[#edb1b4]">{error}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="rounded-md border border-[#38363f] px-3 py-1.5 text-[11px] text-[#c2ade7] hover:bg-[#2b2a33]">
            Try again
          </button>
        </Panel>
      ) : !user ? (
        <Panel className="p-6 text-center text-[12px] text-[#76717f]">{loading ? 'Loading account…' : 'User not found.'}</Panel>
      ) : (
        <>
          <div className="grid items-start gap-6 xl:grid-cols-[360px_1fr]">
            {/* ---------- Left column ---------- */}
            <div className="flex flex-col gap-5">
              <Panel className="flex flex-col gap-4 p-5">
                <SectionHeading title="Account details" />
                <div className="flex items-center gap-[10px]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#383044] text-[11px] font-semibold text-[#c2ade7]">
                    {user.username[0]?.toUpperCase()}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#f0eef5]">{user.username}</p>
                    <p className="text-[10px] text-[#aaa6b5]">
                      U-{user.id} · {user.note}
                    </p>
                  </div>
                </div>
                <InfoLine label="Email">{user.email}</InfoLine>
                <InfoLine label="Registered">{fmtDate(user.joined)}</InfoLine>
                <InfoLine label="Last login">{user.last_login ? fmtStamp(user.last_login) : 'Never'}</InfoLine>
                <InfoLine label="Status">{STATUS_LABEL[user.status]}</InfoLine>
                <InfoLine label="Current role">{ROLE_LABEL[user.role]}</InfoLine>
              </Panel>

              <Panel className="flex flex-col gap-4 p-5">
                <SectionHeading title="Account lifecycle" subtitle="Separate from role assignment" />
                <Field label="Reason (optional)">
                  <TextInput value={lifecycleReason} onChange={(e) => setLifecycleReason(e.target.value)} placeholder="Why is this account changing state?" />
                </Field>
                <SecondaryButton className="w-fit" disabled={user.is_self || busy} onClick={() => void toggleActive()}>
                  {user.is_active ? 'Deactivate account…' : 'Reactivate account…'}
                </SecondaryButton>
                <p className="text-[11px] leading-normal text-[#aaa6b5]">
                  {user.is_self
                    ? 'You cannot deactivate your own account.'
                    : 'Suspensions are issued by moderators through sanctions. Changing a role does not cancel active sanctions.'}
                </p>
              </Panel>
            </div>

            {/* ---------- Role assignment ---------- */}
            <Panel className="flex min-w-0 flex-col gap-4 p-5">
              <SectionHeading title="Role assignment" subtitle="Site-wide scope · Proposed change only" />
              <div className="flex flex-wrap gap-2">{ROLES.map(roleChip)}</div>

              {user.is_self && <Banner tone="warning">You cannot change your own role. Ask another administrator.</Banner>}

              <Field label="New role *">
                <SelectInput value={draftRole} disabled={user.is_self} onChange={(e) => setDraftRole(e.target.value as UserRole)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Reason / authorization *">
                <TextArea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Document why this role change is approved…"
                />
              </Field>

              {rank[draftRole] > rank.moderator && (
                <Banner tone="warning">
                  The Administrator role adds platform operations and permission management. Moderators cannot manage roles or website settings.
                </Banner>
              )}

              <div className="flex gap-[10px]">
                <PrimaryButton disabled={!canReview} onClick={openConfirm}>
                  Review role change
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => {
                    setDraftRole(user.role);
                    setReason('');
                  }}
                >
                  Discard draft
                </SecondaryButton>
              </div>
            </Panel>
          </div>

          {/* ---------- Permission matrix ---------- */}
          <Panel className="flex flex-col gap-4 p-5">
            <SectionHeading title="Permission matrix" subtitle="Effective site-wide capabilities · No per-game administrator scope" />
            <DataTable
              columns={matrixColumns}
              rows={matrix}
              rowKey={(c) => c.name}
              footerLeft="Moderator access excludes all platform-administration operations"
              footerRight=""
            />
          </Panel>

          {/* ---------- Access audit ---------- */}
          <Panel className="flex flex-col gap-4 p-5">
            <SectionHeading title="Access audit" subtitle="Most recent administrator changes to this account" />
            {history.length === 0 ? (
              <p className="text-xs text-[#aaa6b5]">No administrator changes recorded for this account.</p>
            ) : (
              history.map((h) => (
                <InfoLine key={h.id} label={fmtStamp(h.timestamp)}>
                  {h.actor} · {h.description}
                  {h.outcome ? ` · ${h.outcome}` : ''}
                </InfoLine>
              ))
            )}
          </Panel>
        </>
      )}

      <WorkspaceFooter />

      {/* ---------- Confirm role change ---------- */}
      <Modal
        open={confirmOpen && !!user}
        onClose={() => setConfirmOpen(false)}
        title="Confirm role change"
        icon={<ShieldAlert className="h-6 w-6 shrink-0 text-[#edb1b4]" />}
      >
        {user && (
          <>
            <p className="text-[13px] text-[#f0eef5]">
              {isPromotion ? 'Promote' : 'Change'} {user.username} (U-{user.id}) from {ROLE_LABEL[user.role]} to {ROLE_LABEL[draftRole]}?
            </p>
            <div className="flex items-center gap-3">
              <StatusBadge tone="info">{ROLE_LABEL[user.role]}</StatusBadge>
              <span className="flex-1 text-[13px] text-[#aaa6b5]">→</span>
              <StatusBadge tone="info">{ROLE_LABEL[draftRole]}</StatusBadge>
            </div>
            {draftRole === 'admin' && (
              <Banner tone="warning">
                This grants site-wide access to users, role assignments, system logs and website configuration. The user can change other accounts’ access.
              </Banner>
            )}
            <Field label="Confirmation reason *">
              <TextArea value={confirmReason} onChange={(e) => setConfirmReason(e.target.value)} />
            </Field>
            <Field label="Type username to confirm *">
              <TextInput value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder={user.username} />
            </Field>
            {actionError && <p role="alert" className="text-[11px] text-[#edb1b4]">{actionError}</p>}
            <p className="text-[11px] leading-normal text-[#aaa6b5]">
              The change is recorded in the audit log with your account as the actor. Nothing is applied until you confirm.
            </p>
            <div className="flex gap-3">
              <SecondaryButton onClick={() => setConfirmOpen(false)}>Cancel</SecondaryButton>
              <PrimaryButton disabled={!canConfirm} onClick={() => void applyChange()}>
                {busy ? 'Saving…' : isPromotion ? 'Confirm promotion' : 'Confirm role change'}
              </PrimaryButton>
            </div>
          </>
        )}
      </Modal>
    </AdminLayout>
  );
};