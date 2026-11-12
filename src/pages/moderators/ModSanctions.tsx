import { useNavigate } from "react-router-dom";
import ModLayout from "../../components/layout/Modlayout";
import { useState } from "react";
import { PRIOR_SANCTIONS, type PriorSanction } from "./modData";
import { Avatar, BackButton, Badge, Button, Card, DataTable, Field, FilterSelect, Label, Notice, PageHeader, Pagination, RowAction, SearchInput, TextArea, type Column } from "./Modui";

function EnforcementCase({
  onBack,
  onOpenReview,
}: {
  onBack: () => void;
  onOpenReview: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);

  const columns: Column<PriorSanction>[] = [
    { key: "id", header: "Sanction", render: (s) => s.id },
    { key: "action", header: "Action", render: (s) => s.action },
    { key: "reason", header: "Reason", render: (s) => s.reason },
    { key: "mod", header: "Moderator", render: (s) => s.moderator },
    { key: "window", header: "Start / End", render: (s) => <span className="text-zinc-400">{s.window}</span> },
    { key: "status", header: "Status", render: (s) => <Badge tone="green">{s.status}</Badge> },
    { key: "detail", header: "Detail", render: () => <RowAction>Open →</RowAction> },
  ];

  return (
    <>
      <PageHeader
        title="Sanctions & Enforcement"
        subtitle="Prepare a proportionate action. Nothing is applied until the confirmation step is completed."
      />

      <Notice className="mb-3">
        Draft prepared for R-1048 · AshRunner remains Active. The reported review is still published.
      </Notice>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <BackButton onClick={onBack}>Back to queue</BackButton>
        <span className="text-[10px] text-zinc-500">R-1048 · Toxic / abusive review · Reported 02 Nov 2026 09:24 UTC</span>
        <Badge tone="amber">Pending</Badge>
        <Badge tone="red">High</Badge>
        <span className="text-[10px] text-zinc-500">Assigned to Maya Ross · Not yet adjudicated</span>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-4">
          <Card
            title="Reported content"
            subtitle="Hollow Knight · RV-0526 · Posted 01 Nov, 20:11 UTC"
            action={<button type="button" onClick={onOpenReview} className="text-[10px] text-zinc-300 hover:text-white">Review details ↗</button>}
          >
            <div className="mb-2 flex items-center gap-2">
              <Avatar initials="A" />
              <div className="text-[11px]">
                <p className="text-zinc-200">AshRunner</p>
                <p className="text-[9.5px] text-zinc-500">@ashrunner_hk</p>
              </div>
            </div>
            <h4 className="mb-1.5 text-[13px] font-semibold text-zinc-100">A frustrating first run</h4>
            <p className="mb-3 text-[11.5px] leading-relaxed text-zinc-300">
              “The combat was not for me. The repeated ops became tiring, and the progression felt too slow. I do not understand the
              praise for the pacing. Players who disagree should stop replying to my reviews.”
            </p>
            <Notice className="mb-3">
              Possible disrespect / toxic language · User report only. No automated determination of abuse.
            </Notice>
            <div className="flex gap-2">
              <Button>Open game page ↗</Button>
              <Button>Open user profile ↗</Button>
            </div>
          </Card>

          <Card title="Reporter explanation" subtitle="Reporter: Hades · U-1160 · 02 Nov, 09:19 UTC">
            <p className="text-[11.5px] leading-relaxed text-zinc-300">
              “The final sentence of this review is directed at other players. Please check whether this breaks the respectful
              discussion guidelines. I am not reporting the low score itself.”
            </p>
            <p className="mt-2 text-[9.5px] text-zinc-500">
              Reporter identity is visible only to authorized safety staff. Do not share with the reported user.
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Reported user" action={<span className="text-[10px] text-zinc-400">Profile ↗</span>}>
            <div className="mb-2 flex items-center gap-2">
              <Avatar initials="A" />
              <div className="text-[11px]">
                <p className="text-zinc-200">AshRunner</p>
                <p className="text-[9.5px] text-zinc-500">U-1024 · Joined 26 Jul 2026</p>
              </div>
            </div>
            <Field label="Account status">Active · No current restriction</Field>
            <Field label="Prior record">1 warning · S-0201 · 28 Oct 2026</Field>
            <Field label="Policy context">Respectful discussion §2.1</Field>
          </Card>

          <Card title="Next step" subtitle="Proposed enforcement before action">
            <TextArea label="Internal investigation note" rows={3} placeholder="Add your assessment and policy reference…" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="danger">Mark under review</Button>
              <Button>Dismiss report</Button>
              <Button>Escalate</Button>
            </div>
            <p className="mt-2 text-[9.5px] text-zinc-500">
              Sanctions require a proposed confirmation. Dismissal and escalation require a recorded reason.
            </p>
          </Card>
        </div>
      </div>

      <Card
        title="Prepare enforcement"
        subtitle="Draft · Responsible moderator: Maya Ross"
        className="mb-4"
      >
        <div className="mb-3 grid gap-3 md:grid-cols-[2fr_1.3fr_1fr_1.2fr]">
          <FilterSelect label="Violation reason *" options={["Respectful discussion §2.1 · Pending evidence assessment"]} />
          <FilterSelect label="Sanction type *" options={["Temporary mute · Proposed", "Warning", "Temporary suspension", "Remove / hide content"]} />
          <FilterSelect label="Duration *" options={["24 hours", "3 days", "7 days"]} />
          <div>
            <Label>Status</Label>
            <p className="pt-1.5 text-[10.5px] text-zinc-300">On confirmation · Not scheduled</p>
          </div>
        </div>
        <TextArea label="Moderator notes *" rows={3} placeholder="Add your assessment and policy reference…" />
        <p className="mb-3 mt-2 text-[9.5px] text-zinc-500">
          Available: Warning · Temporary mute · Temporary suspension · Remove / hide content
        </p>
        <Notice tone="info" className="mb-3">
          A mute prevents new reviews and replies; reading and personal library access remain available. Duration applies only to
          temporary actions.
        </Notice>
        <TextArea label="User-facing reason *" rows={3} placeholder="Explain the specific incident, guidelines and appeal route…" />
        <label className="mt-3 flex items-start gap-2 text-[10.5px] text-zinc-300">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-violet-500"
          />
          I reviewed the content and surrounding context. I understand this action will notify AshRunner and create an audit record.
        </label>
        <div className="mt-3 flex gap-2">
          <Button variant="danger" disabled={!confirmed}>Review &amp; confirm sanction</Button>
          <Button>Cancel proposal</Button>
        </div>
        <p className="mt-2 text-[9.5px] text-zinc-500">
          Next, you will confirm the sanction and duration. Nothing is applied until then.
        </p>
      </Card>

      <Card title="Prior-sanctions table" subtitle="AshRunner · Complete moderation history">
        <SearchInput placeholder="Search sanction history…" className="mb-3 w-full" />
        <DataTable columns={columns} rows={PRIOR_SANCTIONS} />
        <Pagination summary="1 prior sanction · Up to 5 per page · No active restrictions" />
      </Card>
    </>
  );
}

function ReviewDetails({ onBack }: { onBack: () => void }) {
  const [spoiler, setSpoiler] = useState(true);

  return (
    <>
      <PageHeader title="Review Details" subtitle="RV-0526 · LunaByte · Published 02 Nov 2026 at 09:12 UTC" />
      <div className="-mt-2 mb-4 flex items-center gap-2">
        <BackButton onClick={onBack}>Sanctions &amp; Enforcement</BackButton>
        <Badge tone="green">Published</Badge>
        <Badge tone="purple">Possible spoiler</Badge>
        <span className="text-[10px] text-zinc-500">Evidence retained · No decision recorded</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.9fr_1fr]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="h-14 w-24 shrink-0 rounded-md bg-gradient-to-br from-sky-900 to-indigo-950" />
              <div className="flex-1">
                <p className="text-[12px] font-semibold text-zinc-100">Hollow Knight</p>
                <p className="text-[10px] text-zinc-500">Metroidvania · Adventure</p>
                <p className="mt-1 text-[16px] font-semibold text-zinc-50">
                  Reviewer score <span className="text-zinc-300">9 / 10</span>
                </p>
                <p className="text-[9.5px] text-zinc-500">Public score 4.8 / 10 from 346 sample ratings</p>
              </div>
              <span className="self-start text-[10px] text-zinc-400">Game page ↗</span>
            </div>
          </Card>

          <Card title="A world worth getting lost in" subtitle="Complete review · Reported passage explained">
            <p className="mb-2 text-[11.5px] leading-relaxed text-zinc-300">
              A rewarding adventure with satisfying exploration and memorable encounters. Every new ability made me want to switch up
              old paths. The atmosphere and music stayed with me long after I stopped playing.
            </p>
            <p className="mb-3 text-[11.5px] leading-relaxed text-zinc-300">
              Some routes ask for patience, but discovering a shortcut made the challenge worthwhile. I would recommend this to anyone
              who enjoys exploration.
            </p>
            <div className="rounded-md border border-[#2a2a33] bg-[#121217] p-3">
              <p className="mb-1 text-[9px] uppercase tracking-[0.1em] text-zinc-500">Spoiler evidence · Restricted story view</p>
              <p className="text-[11px] italic text-zinc-300">
                “The final encounter will show the journey, ironically when you return to the temple…”
              </p>
              <p className="mt-1 text-[9.5px] text-zinc-500">The passage was reported in public excerpt. Evidence was not changed.</p>
            </div>
            <p className="mt-3 text-[9.5px] text-zinc-500">
              Surrounding context: Moderator review · 14 replies · No previous edits
            </p>
          </Card>

          <Card title="Flag & evidence context" subtitle="Reported explanation">
            <p className="mb-3 text-[11px] text-zinc-300">
              “The ending discussion should be behind a spoiler warning. The rest of the review is useful.”
            </p>
            <Notice>Possible unrelated section · 1 report · No decision recorded</Notice>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Reviewer" action={<span className="text-[10px] text-zinc-400">User profile ↗</span>}>
            <div className="mb-2 flex items-center gap-2">
              <Avatar initials="L" />
              <div className="text-[11px]">
                <p className="text-zinc-200">LunaByte</p>
                <p className="text-[9.5px] text-zinc-500">U-1156 · Member since 02 Nov</p>
              </div>
            </div>
            <Field label="Account">Active · Regular user</Field>
            <Field label="Prior violations">None confirmed</Field>
            <Field label="Other contributions">12 reviews · 47 votes</Field>
          </Card>

          <Card title="Moderation decision" subtitle="Actions use the 'Tag' system for this item">
            <div className="mb-3 flex items-center justify-between rounded-md border border-[#2a2a33] bg-[#121217] px-3 py-2">
              <div>
                <p className="text-[11px] text-zinc-200">Spoiler protection</p>
                <p className="text-[9px] text-zinc-500">Public text is concealed when the flag is turned on</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={spoiler}
                onClick={() => setSpoiler((v) => !v)}
                className={`h-4 w-8 rounded-full p-0.5 transition-colors ${spoiler ? "bg-violet-600" : "bg-zinc-700"}`}
              >
                <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${spoiler ? "translate-x-4" : ""}`} />
              </button>
            </div>
            <div className="space-y-3">
              <FilterSelect label="Policy reason *" options={["Spoiler rules §3.2"]} />
              <TextArea label="Internal note *" rows={3} placeholder="Record why this review needs a spoiler flag…" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="danger">Hide review</Button>
              <Button>Delete…</Button>
            </div>
            <div className="mt-2">
              <Button disabled>Restore · Not hidden</Button>
            </div>
            <div className="mt-2">
              <Button variant="primary">Save spoiler flag</Button>
            </div>
            <p className="mt-2 text-[9px] text-zinc-500">
              Hiding is reversible. Deleting requires a second moderator's confirmation and preserves the evidence snapshot.
            </p>
          </Card>

          <Card title="Preservation record">
            <Field label="Snapshot">RV-0526-v1 · 02 Nov, 09:19 UTC</Field>
            <Field label="Status">Original text kept</Field>
            <Field label="Assigned editor">Unassigned · Moderator access only</Field>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function ModSanctions() {
  const navigate = useNavigate();
  const [view, setView] = useState<"case" | "review">("case");
  const crumbs = ["Moderator", "Sanctions & Enforcement"];

  return (
    <ModLayout crumbs={view === "review" ? [...crumbs, "Review Details"] : crumbs}>
      {view === "review" ? (
        <ReviewDetails onBack={() => setView("case")} />
      ) : (
        <EnforcementCase onBack={() => navigate("/moderator/reports")} onOpenReview={() => setView("review")} />
      )}
    </ModLayout>
  );
}