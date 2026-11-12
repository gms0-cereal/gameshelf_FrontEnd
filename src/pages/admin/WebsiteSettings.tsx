import React, { useMemo, useState } from 'react';
import { AdminLayout, Banner, Field, InfoLine, PageHeading, Panel, PreferenceRow, PrimaryButton, SecondaryButton, SectionHeading, SelectInput, TextInput, WorkspaceFooter } from '../../components/admin/AdminLayout';
import { settingsInitial as initial, settingsOptions as OPTIONS } from './MockData';
import type { Settings } from './MockData';

const LABELS: Record<keyof Settings, string> = {
  siteName: 'Site name',
  supportEmail: 'Support email',
  tagline: 'Tagline',
  requireVerifiedEmail: 'Require verified email for reviews',
  oneRatingPerGame: 'One rating per user per game',
  reviewFirstTime: 'Review first-time contributors',
  hideSpoilers: 'Hide spoilers by default',
  detectAnomalies: 'Detect rating anomalies',
  escalation: 'Escalation threshold',
  minReviewLength: 'Minimum review length',
  libraryVisibility: 'Default library visibility',
  appealWindow: 'Appeal submission window',
  retention: 'Audit log retention',
  requireStaffMfa: 'Require MFA for all staff',
};

export const WebsiteSettings: React.FC = () => {
  const [saved, setSaved] = useState<Settings>(initial);
  const [draft, setDraft] = useState<Settings>(initial);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const changed = useMemo(() => (Object.keys(draft) as (keyof Settings)[]).filter((k) => draft[k] !== saved[k]), [draft, saved]);
  const dirty = changed.length > 0;

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setNotice(null);
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const text = (key: 'siteName' | 'supportEmail' | 'tagline' | 'minReviewLength') => (
    <Field label={LABELS[key]}>
      <TextInput value={draft[key]} onChange={(e) => set(key, e.target.value)} />
    </Field>
  );
  const select = (key: keyof typeof OPTIONS) => (
    <Field label={LABELS[key]}>
      <SelectInput value={draft[key]} onChange={(e) => set(key, e.target.value)}>
        {OPTIONS[key].map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </SelectInput>
    </Field>
  );
  const pref = (key: keyof Settings, description: string) => (
    <PreferenceRow title={LABELS[key]} description={description} checked={draft[key] as boolean} onChange={(v) => set(key, v as never)} />
  );

  const save = () => {
    // TODO: PUT /api/admin/settings with { settings: draft, reason } — the server writes the configuration.updated audit event.
    setSaved(draft);
    setReason('');
    setNotice(`Configuration saved · ${changed.length} setting${changed.length === 1 ? '' : 's'} updated. The revision and reason are recorded in System Logs.`);
  };

  return (
    <AdminLayout>
      <PageHeading
        eyebrow="PLATFORM OPERATIONS"
        title="Website Settings"
        description="Site-wide identity, community defaults and operational configuration. Not personal profile settings."
      />

      {notice ? (
        <Banner tone="success">{notice}</Banner>
      ) : (
        <div className="rounded-md bg-[#1a1a20] p-[14px] text-xs leading-normal text-[#aaa6b5]">
          Administrator access · Changes affect the whole website and are audited. Sensitive settings require an additional confirmation.
        </div>
      )}

      <div className="flex max-w-[650px] flex-col gap-6">
        <Panel className="flex flex-col gap-4 p-5">
          <SectionHeading title="Site configuration" subtitle="Public identity & regional defaults" />
          <div className="grid gap-4 sm:grid-cols-2">
            {text('siteName')}
            {text('supportEmail')}
          </div>
          {text('tagline')}
          <PreferenceRow title="Maintenance mode" description="Off · Enabling requires confirmation and restricts public access." checked={false} disabled />
        </Panel>

        <Panel className="flex flex-col gap-4 p-5">
          <SectionHeading title="Community & moderation defaults" subtitle="Policy controls · Human review remains required" />
          {pref('requireVerifiedEmail', 'Email verification is required before publishing.')}
          {pref('oneRatingPerGame', 'Scores stay on a 1–10 scale; updates replace earlier scores.')}
          {pref('reviewFirstTime', 'Route the first review to the content moderation queue.')}
          {pref('hideSpoilers', 'Protected passages require explicit reveal on public pages.')}
          {pref('detectAnomalies', 'Create investigation flags, never automatic guilt findings.')}
          <div className="grid gap-4 sm:grid-cols-2">
            {select('escalation')}
            {text('minReviewLength')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {select('libraryVisibility')}
            {select('appealWindow')}
          </div>
          <p className="text-[11px] leading-normal text-[#aaa6b5]">
            Harassment, spam and coordinated rating manipulation are prohibited. Negative opinions are not policy violations.
          </p>
        </Panel>

        <Panel className="flex flex-col gap-4 p-5">
          <SectionHeading title="Audit & security" subtitle="Site-wide accountability" />
          {select('retention')}
          {pref('requireStaffMfa', 'Applied in PERM-004 · Role changes require verified sessions.')}
          <InfoLine label="Last configuration">CFG-0027 · 02 Nov, 09:10 UTC · Alex Chen</InfoLine>
          <InfoLine label="Last permission update">PERM-004 · 02 Nov, 09:50 UTC · Alex Chen</InfoLine>
        </Panel>
      </div>

      <Panel className="flex flex-col gap-4 p-5">
        <SectionHeading
          title="Save configuration"
          subtitle={dirty ? `${changed.length} unsaved change${changed.length === 1 ? '' : 's'}` : 'No unsaved changes have been applied'}
        />
        <Field label="Change reason *">
          <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe the site-wide change and authorization…" />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton disabled={!dirty || !reason.trim()} onClick={save}>
            Review &amp; save changes
          </PrimaryButton>
          <SecondaryButton
            onClick={() => {
              setDraft(saved);
              setReason('');
            }}
          >
            Cancel
          </SecondaryButton>
          <p className="flex-1 text-[11px] text-[#aaa6b5]">Actor: Alex Chen · AD-001 · Administrator</p>
        </div>
        <p className="text-[11px] text-[#aaa6b5]">Review changes before publishing. The saved revision and reason will appear in System Logs.</p>
      </Panel>

      <WorkspaceFooter />
    </AdminLayout>
  );
};