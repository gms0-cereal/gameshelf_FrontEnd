import LegalPage, { type LegalSection } from "@/components/layout/Legalpage";

const SECTIONS: LegalSection[] = [
  {
    heading: "Accepting these terms",
    paragraphs: [
      "By creating an account or using GameShelf, you agree to these terms. If you don't agree, please don't use the service.",
    ],
  },
  {
    heading: "Your account",
    items: [
      "Give accurate information when you sign up and keep your password private.",
      "You are responsible for activity under your account.",
      "Tell us if you think someone else has accessed your account.",
    ],
  },
  {
    heading: "Your content",
    paragraphs: [
      "You own the playlists, descriptions and notes you create. By making a playlist public, you let GameShelf display it to other users as part of the service. You can switch it back to private or delete it at any time.",
    ],
  },
  {
    heading: "Acceptable use",
    paragraphs: ["When using GameShelf, you agree not to:"],
    items: [
      "Post content that is hateful, harassing, sexually explicit, or illegal.",
      "Impersonate other people or misrepresent who you are.",
      "Spam, scrape, or overload the service, or try to break its security.",
      "Use GameShelf to infringe someone else's rights.",
    ],
  },
  {
    heading: "Game information and trademarks",
    paragraphs: [
      "Game titles, images and descriptions come from third-party sources and belong to their respective owners. GameShelf is not affiliated with or endorsed by those publishers or stores.",
    ],
  },
  {
    heading: "Moderation",
    paragraphs: [
      "We may remove content or suspend accounts that break these terms or harm other users. Where we can, we'll tell you why.",
    ],
  },
  {
    heading: "Service availability",
    paragraphs: [
      "GameShelf is provided as is. We try to keep it running and accurate, but we can't guarantee it will always be available, error-free, or that recommendations will suit your taste.",
    ],
  },
  {
    heading: "Limitation of liability",
    paragraphs: [
      "To the extent the law allows, GameShelf and its team are not liable for indirect or incidental damages, or for loss of data, arising from your use of the service.",
    ],
  },
  {
    heading: "Ending your account",
    paragraphs: [
      "You can stop using GameShelf at any time and ask us to delete your account through the contact page. We may suspend or end access if these terms are broken.",
    ],
  },
  {
    heading: "Changes to these terms",
    paragraphs: [
      "We may update these terms from time to time. The date at the top shows the latest version, and continuing to use GameShelf means you accept it.",
    ],
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="The rules for using GameShelf, in plain language."
      updated="November 5, 2026"
      sections={SECTIONS}
    />
  );
}