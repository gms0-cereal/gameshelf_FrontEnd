import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AdminLayout,
  Banner,
  Field,
  InfoLine,
  PageHeading,
  Panel,
  PreferenceRow,
  PrimaryButton,
  SecondaryButton,
  SectionHeading,
  SelectInput,
  TextArea,
  TextInput,
  WorkspaceFooter,
} from '../../components/admin/AdminLayout';
import { getAdminSettings, getErrorMessage, saveAdminSettings } from '../../services/Adminservice';
import type { AdminSettings, SettingsResponse } from '../../services/Adminservice';

const LABELS: Record<keyof AdminSettings, string> = {
  site_name: 'Site name',
  support_email: 'Support email',
  tagline: 'Tagline',
  require_verified_email: 'Require verified email for reviews',
  one_rating_per_game: 'One rating per user per game',
  review_first_time: 'Review first-time contributors',
  hide_spoilers: 'Hide spoilers by default',
  detect_anomalies: 'Detect rating anomalies',
  escalation_threshold: 'Escalation threshold (reports)',
  min_review_length: 'Minimum review length (characters)',
  default_library_visibility: 'Default library visibility',
  appeal_window_days: 'Appeal submission window',
  maintenance_enabled: 'Maintenance mode',
  maintenance_title: 'Maintenance title',
  maintenance_message: 'Maintenance message',
};

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends only' },
  { value: 'private', label: 'Private' },
];
const APPEAL_OPTIONS = [7, 14, 30, 60];

type TextKey = 'site_name' | 'support_email' | 'tagline' | 'maintenance_title';
type NumberKey = 'escalation_threshold' | 'min_review_length';
type BoolKey =
  | 'require_verified_email'
  | 'one_rating_per_game'
  | 'review_first_time'
  | 'hide_spoilers'
  | 'detect_anomalies';

const fmtStamp = (iso: string) =>
  `${new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}, ${new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`;

export const WebsiteSettings: React.FC = () => {
  const [saved, setSaved] = useState<AdminSettings | null>(null);
  const [draft, setDraft] = useState<AdminSettings | null>(null);
  const [lastUpdated, setLastUpdated] = useState<SettingsResponse['last_updated']>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    getAdminSettings(controller.signal)
      .then((res) => {
        setSaved(res.settings);
        setDraft(res.settings);
        setLastUpdated(res.last_updated);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setLoadError(getErrorMessage(err, 'Unable to load settings.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  const changed = useMemo(
    () => (saved && draft ? (Object.keys(draft) as (keyof AdminSettings)[]).filter((k) => draft[k] !== saved[k]) : []),
    [draft, saved],
  );
  const dirty = changed.length > 0;

  const set = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setNotice(null);
    setSaveError(null);
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  };

  const save = async () => {
    if (!saved || !draft || saving) return;
    if (draft.maintenance_enabled && !saved.maintenance_enabled) {
      if (!window.confirm('Enable maintenance mode? This changes the public site status for everyone.')) return;
    }
    const patch: Record<string, unknown> = {};
    changed.forEach((k) => {
      patch[k] = draft[k];
    });
    setSaving(true);
    setSaveError(null);
    setNotice(null);
    try {
      const res = await saveAdminSettings(patch as Partial<AdminSettings>, reason.trim());
      setSaved(res.settings);
      setDraft(res.settings);
      setLastUpdated(res.last_updated);
      setReason('');
      setNotice(`Settings saved successfully · ${changed.length} setting${changed.length === 1 ? '' : 's'} updated. The change and reason are recorded in System Logs.`);
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Unable to save settings.'));
    } finally {
      setSaving(false);
    }
  };

  const text = (key: TextKey) => (
    <Field label={LABELS[key]}>
      <TextInput value={draft?.[key] ?? ''} onChange={(e) => set(key, e.target.value)} />
    </Field>
  );
  const num = (key: NumberKey) => (
    <Field label={LABELS[key]}>
      <TextInput
        inputMode="numeric"
        value={String(draft?.[key] ?? '')}
        onChange={(e) => set(key, e.target.value === '' ? 0 : Number(e.target.value.replace(/\D/g, '')))}
      />
    </Field>
  );
  const pref = (key: BoolKey, description: string) => (
    <PreferenceRow title={LABELS[key]} description={description} checked={draft?.[key] ?? false} onChange={(v) => set(key, v)} />
  );

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
          Administrator access · Changes affect the whole website and are audited.
        </div>
      )}
      {saveError && <Banner tone="warning">{saveError}</Banner>}

      {loadError ? (
        <Panel role="alert" className="flex items-center justify-between gap-4 p-4">
          <p className="text-[12px] text-[#edb1b4]">{loadError}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="rounded-md border border-[#38363f] px-3 py-1.5 text-[11px] text-[#c2ade7] hover:bg-[#2b2a33]">
            Try again
          </button>
        </Panel>
      ) : !draft || !saved ? (
        <Panel className="p-6 text-center text-[12px] text-[#76717f]">{loading ? 'Loading settings…' : 'Settings unavailable.'}</Panel>
      ) : (
        <>
          <div className="flex w-full flex-col gap-6">
            <Panel className="flex flex-col gap-4 p-5">
              <SectionHeading title="Site configuration" subtitle="Public identity" />
              <div className="grid gap-4 sm:grid-cols-2">
                {text('site_name')}
                {text('support_email')}
              </div>
              {text('tagline')}
            </Panel>

            <Panel className="flex flex-col gap-4 p-5">
              <SectionHeading title="Maintenance" subtitle="Public site status" />
              <PreferenceRow
                title={LABELS.maintenance_enabled}
                description={draft.maintenance_enabled ? 'On · The public site-status endpoint reports maintenance.' : 'Off · Enabling requires confirmation.'}
                checked={draft.maintenance_enabled}
                onChange={(v) => set('maintenance_enabled', v)}
              />
              {text('maintenance_title')}
              <Field label={LABELS.maintenance_message}>
                <TextArea value={draft.maintenance_message} onChange={(e) => set('maintenance_message', e.target.value)} />
              </Field>
            </Panel>

            <Panel className="flex flex-col gap-4 p-5">
              <SectionHeading title="Community & moderation defaults" subtitle="Stored policy settings · Human review remains required" />
              {pref('require_verified_email', 'Email verification is required before publishing.')}
              {pref('one_rating_per_game', 'Scores stay on a 1–10 scale; updates replace earlier scores.')}
              {pref('review_first_time', 'Route the first review to the content moderation queue.')}
              {pref('hide_spoilers', 'Protected passages require explicit reveal on public pages.')}
              {pref('detect_anomalies', 'Create investigation flags, never automatic guilt findings.')}
              <div className="grid gap-4 sm:grid-cols-2">
                {num('escalation_threshold')}
                {num('min_review_length')}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={LABELS.default_library_visibility}>
                  <SelectInput
                    value={draft.default_library_visibility}
                    onChange={(e) => set('default_library_visibility', e.target.value as AdminSettings['default_library_visibility'])}
                  >
                    {VISIBILITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label={LABELS.appeal_window_days}>
                  <SelectInput value={String(draft.appeal_window_days)} onChange={(e) => set('appeal_window_days', Number(e.target.value))}>
                    {APPEAL_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} days
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
              <p className="text-[11px] leading-normal text-[#aaa6b5]">
                Harassment, spam and coordinated rating manipulation are prohibited. Negative opinions are not policy violations.
              </p>
            </Panel>

            <Panel className="flex flex-col gap-4 p-5">
              <SectionHeading title="Audit" subtitle="Site-wide accountability" />
              <InfoLine label="Last configuration change">
                {lastUpdated ? `${fmtStamp(lastUpdated.at)}${lastUpdated.by ? ` · ${lastUpdated.by}` : ''}` : 'No changes recorded yet'}
              </InfoLine>
            </Panel>
          </div>

          <Panel className="flex flex-col gap-4 p-5">
            <SectionHeading
              title="Save configuration"
              subtitle={dirty ? `${changed.length} unsaved change${changed.length === 1 ? '' : 's'}` : 'No unsaved changes'}
            />
            <Field label="Change reason *">
              <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe the site-wide change and authorization…" />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton disabled={!dirty || !reason.trim() || saving} onClick={() => void save()}>
                {saving ? 'Saving…' : 'Review & save changes'}
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  setDraft(saved);
                  setReason('');
                  setSaveError(null);
                }}
              >
                Cancel
              </SecondaryButton>
            </div>
            <p className="text-[11px] text-[#aaa6b5]">The saved change and reason appear in System Logs.</p>
          </Panel>
        </>
      )}

      <WorkspaceFooter />
    </AdminLayout>
  );
};