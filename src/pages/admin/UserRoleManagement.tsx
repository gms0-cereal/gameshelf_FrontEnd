import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { ROLES, users, matrix } from './MockData';
import type { Capability, Role } from './MockData';

const matrixColumns: Column<Capability>[] = [
  { header: 'Capability', className: 'w-[34%] text-[#f0eef5]', cell: (c) => c.name },
  { header: 'Regular User', className: 'text-[#aaa6b5]', cell: (c) => c.user },
  { header: 'Moderator', className: 'text-[#aaa6b5]', cell: (c) => c.moderator },
  { header: 'Administrator', className: 'text-[#c2ade7]', cell: (c) => c.admin },
];

const rank: Record<Role, number> = { 'Regular User': 0, Moderator: 1, Administrator: 2 };

export const UserRoleManagement: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const user = useMemo(() => users.find((u) => u.id === userId) ?? users[0], [userId]);

  const [currentRole, setCurrentRole] = useState<Role>(user.role);
  const [draftRole, setDraftRole] = useState<Role>('Administrator');
  const [reason, setReason] = useState('Approved operations coverage · Access review AR-0042');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmReason, setConfirmReason] = useState('');
  const [typedName, setTypedName] = useState('');
  const [applied, setApplied] = useState<string | null>(null);

  // Reset local state when switching between users
  React.useEffect(() => {
    setCurrentRole(user.role);
    setDraftRole(user.role === 'Administrator' ? 'Moderator' : 'Administrator');
    setApplied(null);
  }, [user]);

  const isPromotion = rank[draftRole] > rank[currentRole];
  const canReview = draftRole !== currentRole && reason.trim().length > 0;
  const canConfirm = confirmReason.trim().length > 0 && typedName === user.username;

  const openConfirm = () => {
    setConfirmReason(reason);
    setTypedName('');
    setConfirmOpen(true);
  };

  const applyChange = () => {
    // TODO: call your API here (PATCH /api/users/:id/role) — it should also write the immutable audit event.
    setApplied(`${user.username} changed from ${currentRole} to ${draftRole}. Role-change event recorded.`);
    setCurrentRole(draftRole);
    setConfirmOpen(false);
  };

  const roleChip = (role: Role) => {
    const suffix = role === currentRole ? ' · Current' : role === draftRole ? ' · Proposed' : '';
    return (
      <StatusBadge key={role} tone="info">
        {role}
        {suffix}
      </StatusBadge>
    );
  };

  const isSeedUser = user.id === 'U-1140';

  return (
    <AdminLayout>
      <PageHeading
        eyebrow="PLATFORM OPERATIONS"
        title="User Profile & Role Management"
        description={`${user.id} · ${user.username} · User Management / Profile / Role & Permissions`}
      />

      {applied ? (
        <Banner tone="success">{applied}</Banner>
      ) : (
        isSeedUser && (
          <Banner tone="success">
            Past action · EV-0908 · Alex Chen changed JordanVale from Regular User to Moderator at 09:40 UTC. Current role: Moderator.
          </Banner>
        )
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[360px_1fr]">
        {/* ---------- Left column ---------- */}
        <div className="flex flex-col gap-5">
          <Panel className="flex flex-col gap-4 p-5">
            <SectionHeading title="Account details" action="Public profile ↗" />
            <div className="flex items-center gap-[10px]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#383044] text-[11px] font-semibold text-[#c2ade7]">
                {user.username[0]}
              </span>
              <div>
                <p className="text-xs font-semibold text-[#f0eef5]">{user.username}</p>
                <p className="text-[10px] text-[#aaa6b5]">
                  {user.id} · {user.note}
                </p>
              </div>
            </div>
            <InfoLine label="Email">{user.email}</InfoLine>
            <InfoLine label="Registered">{user.created}</InfoLine>
            <InfoLine label="Last activity">{user.lastActivity.replace(' ·', ' 2026 ·')} UTC</InfoLine>
            <InfoLine label="Status">{user.status}</InfoLine>
            <InfoLine label="Current role">{currentRole}</InfoLine>
            <InfoLine label="MFA">{currentRole === 'Regular User' ? 'Optional' : 'Enabled · Required for staff'}</InfoLine>
          </Panel>

          <Panel className="flex flex-col gap-4 p-5">
            <SectionHeading title="Account lifecycle" subtitle="Separate from role assignment" />
            <SecondaryButton className="w-fit">Suspend account…</SecondaryButton>
            <SecondaryButton className="w-fit">Deactivate account…</SecondaryButton>
            <p className="text-[11px] leading-normal text-[#aaa6b5]">
              Each operation requires a policy reason and confirmation. Changing a role does not cancel active sanctions.
            </p>
          </Panel>
        </div>

        {/* ---------- Role assignment ---------- */}
        <Panel className="flex min-w-0 flex-col gap-4 p-5">
          <SectionHeading title="Role assignment" subtitle="Site-wide scope · Proposed change only" />
          <div className="flex flex-wrap gap-2">{ROLES.map(roleChip)}</div>

          <Field label="New role *">
            <SelectInput value={draftRole} onChange={(e) => setDraftRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Reason / authorization *">
            <TextArea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Document the evidence assessment, why this restriction is proportionate and any prior context…"
            />
          </Field>

          <InfoLine label="Auditable actor">Alex Chen · AD-001 · Administrator · MFA verified</InfoLine>

          {rank[draftRole] > rank.Moderator && (
            <Banner tone="warning">
              The proposed Administrator role adds platform operations and permission management. Moderators cannot manage roles or website settings.
            </Banner>
          )}

          <div className="flex gap-[10px]">
            <PrimaryButton disabled={!canReview} onClick={openConfirm}>
              Review role change
            </PrimaryButton>
            <SecondaryButton
              onClick={() => {
                setDraftRole(currentRole);
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
          footerRight={'‹ Previous   1   2   3   Next ›'}
        />
      </Panel>

      {/* ---------- Access audit ---------- */}
      <Panel className="flex flex-col gap-4 p-5">
        <SectionHeading title="Access audit" subtitle="Most recent successful role change" />
        {isSeedUser ? (
          <>
            <InfoLine label="EV-0908 · 09:40">Alex Chen · Regular User → Moderator · U-1140</InfoLine>
            <InfoLine label="Recorded reason">Safety team onboarding approved · Access review AR-0041</InfoLine>
          </>
        ) : (
          <p className="text-xs text-[#aaa6b5]">No role changes recorded for this account.</p>
        )}
      </Panel>

      <WorkspaceFooter />

      {/* ---------- Confirm role change ---------- */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm role change"
        icon={<ShieldAlert className="h-6 w-6 shrink-0 text-[#edb1b4]" />}
      >
        <p className="text-[13px] text-[#f0eef5]">
          {isPromotion ? 'Promote' : 'Change'} {user.username} ({user.id}) from {currentRole} to {draftRole}?
        </p>
        <div className="flex items-center gap-3">
          <StatusBadge tone="info">{currentRole}</StatusBadge>
          <span className="flex-1 text-[13px] text-[#aaa6b5]">→</span>
          <StatusBadge tone="info">{draftRole}</StatusBadge>
        </div>
        {draftRole === 'Administrator' && (
          <Banner tone="warning">
            This grants site-wide access to users, role assignments, algorithms, system logs and website configuration. The user can change other accounts’ access.
          </Banner>
        )}
        <Field label="Confirmation reason *">
          <TextArea value={confirmReason} onChange={(e) => setConfirmReason(e.target.value)} />
        </Field>
        <Field label="Type username to confirm *">
          <TextInput value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder={user.username} />
        </Field>
        <p className="text-[11px] leading-normal text-[#aaa6b5]">
          Actor: Alex Chen · AD-001 · MFA verified An immutable role-change event will be recorded. No change is applied until confirmed.
        </p>
        <div className="flex gap-3">
          <SecondaryButton onClick={() => setConfirmOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton disabled={!canConfirm} onClick={applyChange}>
            {isPromotion ? 'Confirm promotion' : 'Confirm role change'}
          </PrimaryButton>
        </div>
      </Modal>
    </AdminLayout>
  );
};