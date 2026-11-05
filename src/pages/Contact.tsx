import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LifeBuoy, Mail } from "lucide-react";
import InfoPage from "@/components/layout/Infopage";

// TODO: replace with your team's real inbox.
const CONTACT_EMAIL = "support@gameshelf.example";

const TOPICS = ["General question", "Report a bug", "Report a playlist", "Account help", "Feedback"];

const fieldClass =
  "w-full rounded-xl border border-[#302438] bg-[#000000] px-3 text-xs font-normal text-[#E6E1EA] outline-none placeholder:text-[#77717F] transition-colors hover:border-[#554363] focus:border-[#B39ACF] focus:ring-1 focus:ring-[#B39ACF]/20";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", topic: TOPICS[0], message: "" });
  const [submitted, setSubmitted] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  // Opens the visitor's email app with the message filled in.
  // Swap this for an API call if you add a backend endpoint later.
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`[GameShelf] ${form.topic}`);
    const body = encodeURIComponent(`${form.message}\n\nFrom: ${form.name} <${form.email}>`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <InfoPage
      title="Contact us"
      intro="Found a bug, have a question, or want to suggest something? Send us a message."
      wide
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-2xl border border-[#302438] bg-[#17191E] p-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-[11px] font-semibold">
              Name
              <input
                required
                maxLength={80}
                value={form.name}
                onChange={set("name")}
                placeholder="Your name"
                className={`${fieldClass} h-10`}
              />
            </label>
            <label className="flex flex-col gap-2 text-[11px] font-semibold">
              Email
              <input
                required
                type="email"
                maxLength={120}
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                className={`${fieldClass} h-10`}
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-[11px] font-semibold">
            Topic
            <select value={form.topic} onChange={set("topic")} className={`${fieldClass} h-10 cursor-pointer`}>
              {TOPICS.map((t) => (
                <option key={t} value={t} className="bg-[#17191E]">
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-[11px] font-semibold">
            Message
            <textarea
              required
              rows={6}
              maxLength={2000}
              value={form.message}
              onChange={set("message")}
              placeholder="Tell us what's going on. Include the page or playlist link if it's about something specific."
              className={`${fieldClass} resize-y py-3 leading-5`}
            />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-[#B39ACF] px-5 text-xs font-bold text-[#17101F] transition-colors hover:bg-[#C2ADE0]"
            >
              Send message
            </button>
            {submitted && (
              <p role="status" className="text-[11px] text-[#A0A0A8]">
                Your email app should open with the message ready to send. If it didn't, write to {CONTACT_EMAIL}.
              </p>
            )}
          </div>
        </form>

        <aside className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-[#302438] bg-[#17191E] p-5">
            <Mail className="size-5 text-[#B39ACF]" strokeWidth={1.7} aria-hidden="true" />
            <h2 className="text-sm font-semibold">Email</h2>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-xs text-[#B39ACF] hover:underline">
              {CONTACT_EMAIL}
            </a>
            <p className="text-[11px] leading-4 text-[#A0A0A8]">We usually reply within a few days.</p>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-[#302438] bg-[#17191E] p-5">
            <LifeBuoy className="size-5 text-[#B39ACF]" strokeWidth={1.7} aria-hidden="true" />
            <h2 className="text-sm font-semibold">Need a quick answer?</h2>
            <p className="text-[11px] leading-4 text-[#A0A0A8]">
              Common questions about playlists, recommendations and accounts are covered in Help.
            </p>
            <Link to="/help" className="text-xs font-semibold text-[#B39ACF] hover:underline">
              Open Help
            </Link>
          </div>
        </aside>
      </div>
    </InfoPage>
  );
}