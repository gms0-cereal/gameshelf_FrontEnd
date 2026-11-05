import LegalPage, { type LegalSection } from "@/components/layout/Legalpage";

const SECTIONS: LegalSection[] = [
  {
    heading: "Information we collect",
    paragraphs: ["We collect only what we need to run GameShelf."],
    items: [
      "Account details: username, email address, nickname and avatar.",
      "Content you create: your game library, playlists, playlist descriptions and notes on games.",
      "Basic technical data: browser type, device type and error logs that help us fix problems.",
    ],
  },
  {
    heading: "How we use it",
    items: [
      "To run your account and show your shelf and playlists.",
      "To suggest games based on what is on your shelf.",
      "To show public playlists to other players.",
      "To find and fix bugs, and to keep the service secure.",
    ],
  },
  {
    heading: "What other people can see",
    paragraphs: [
      "Public playlists, along with your username, nickname and avatar, are visible to anyone who visits GameShelf. Private playlists are visible only to you. Your email address is never shown publicly.",
    ],
  },
  {
    heading: "Game data from third parties",
    paragraphs: [
      "Game titles, covers and genres come from public store listings, such as Steam. When we look up a game, we send that store the game's identifier only, not your personal information.",
    ],
  },
  {
    heading: "Cookies and local storage",
    paragraphs: [
      "We use cookies or browser storage to keep you signed in and remember basic preferences. We don't use them for advertising.",
    ],
  },
  {
    heading: "Sharing",
    paragraphs: [
      "We don't sell your personal information. We share it only with service providers that host or operate GameShelf, or when the law requires it.",
    ],
  },
  {
    heading: "Your choices",
    items: [
      "Edit your profile or change a playlist between public and private at any time.",
      "Delete playlists you created.",
      "Ask us to delete your account and the data tied to it through the contact page.",
    ],
  },
  {
    heading: "Data retention and security",
    paragraphs: [
      "We keep your data while your account is active. We use reasonable safeguards to protect it, but no online service can promise perfect security.",
    ],
  },
  {
    heading: "Children",
    paragraphs: [
      "GameShelf is not directed at children under 13. If you believe a child has given us personal information, contact us and we'll remove it.",
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      "If we change this policy, we'll update the date at the top of this page. Continuing to use GameShelf after a change means you accept the updated policy.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="What GameShelf collects, why we collect it, and the choices you have."
      updated="November 5, 2026"
      sections={SECTIONS}
    />
  );
}