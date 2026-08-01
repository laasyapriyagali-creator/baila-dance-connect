import { createFileRoute, notFound } from "@tanstack/react-router";
import { SettingsShell } from "@/components/baila/settings-ui";

type Doc = {
  title: string;
  description: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
};

const DOCS: Record<string, Doc> = {
  guidelines: {
    title: "Community guidelines",
    description:
      "How Baila dancers treat each other: real movement only, consent first, and showing up for the dates you plan.",
    intro:
      "Baila is a dance floor, not a feed. These rules keep it that way. Breaking them can get your reels removed or your access ended.",
    sections: [
      {
        heading: "Dance for real",
        body: [
          "Post videos of you actually dancing. No lip-sync-only clips, no photo slideshows, no reposting someone else's dancing as your own.",
          "One dancer, one profile. Do not pretend to be someone else.",
        ],
      },
      {
        heading: "Keep it safe for everyone",
        body: [
          "No nudity, sexual content, or clothing-optional clips. Baila is about movement, not exposure.",
          "You must be 18 or older. Never post videos of children.",
          "No hate, harassment, threats, slurs, or filming people who did not agree to be filmed.",
        ],
      },
      {
        heading: "Respect a no",
        body: [
          "A declined invite is a complete answer. Do not ask again through another profile.",
          "Consent applies on the dance floor too — ask before touching, leading, or filming.",
        ],
      },
      {
        heading: "Show up",
        body: [
          "If you plan a dance date, go. If plans change, cancel early so the other person can plan their evening.",
          "Meet in public, dance-friendly spaces for a first date.",
        ],
      },
      {
        heading: "No social-media games",
        body: [
          "There are no likes, followers, comments, or streaks in Baila, and there never will be. Do not try to import them by putting handles or promotional links in your bio.",
          "No selling, recruiting, or promoting paid classes through invites.",
        ],
      },
      {
        heading: "If something goes wrong",
        body: [
          "Use Settings → Safety to block or report. Reports are private and are read by the Baila team.",
          "Baila is not an emergency service. In immediate danger, call your local emergency number.",
        ],
      },
    ],
  },
  safety: {
    title: "Dating safety tips",
    description:
      "Practical advice for meeting a dance partner from Baila in person: public venues, telling a friend, and your own way home.",
    intro: "Dancing with someone new is the whole point of Baila. Do it on your terms.",
    sections: [
      {
        heading: "Before you go",
        body: [
          "Pick a public, well-lit venue — a social, a class, a festival floor.",
          "Tell a friend where you are going and when. Turn on Share date details in Settings → Safety.",
          "Do not share your home address, workplace, or financial details.",
        ],
      },
      {
        heading: "On the date",
        body: [
          "Arrange your own transport there and back.",
          "Keep your drink with you and stay in the main room until you are comfortable.",
          "Trust your gut. You can leave at any point, without explaining yourself.",
        ],
      },
      {
        heading: "Red flags",
        body: [
          "Pressure to move somewhere private, to send money, or to move the conversation off Baila immediately.",
          "A profile whose reels look nothing like the person in front of you.",
          "Anyone who ignores a no.",
        ],
      },
      {
        heading: "Afterwards",
        body: [
          "Block and report anything that felt wrong — it helps the next dancer too.",
          "Only send a go-again request if you both want one.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of service",
    description:
      "The terms for using Baila: who may join, what you may post, how dance dates work, and how access can end.",
    intro:
      "Plain-language summary of the agreement between you and Baila. Placeholder text for the operator to review with counsel before launch.",
    sections: [
      {
        heading: "Who can use Baila",
        body: [
          "You must be at least 18 years old and legally able to enter this agreement.",
          "One profile per person. You are responsible for what happens on your device and profile.",
        ],
      },
      {
        heading: "Your content",
        body: [
          "You keep ownership of your dance videos. You grant Baila permission to store and display them inside the app so other dancers can discover you.",
          "You confirm you have the right to post every video you upload, including any music used in it.",
          "You can delete individual reels, or everything, at any time from Settings.",
        ],
      },
      {
        heading: "Dance dates happen offline",
        body: [
          "Baila introduces dancers; it does not supervise, verify, or chaperone meetings.",
          "Baila does not run background checks. You are responsible for your own safety decisions.",
        ],
      },
      {
        heading: "Acceptable use",
        body: [
          "Follow the community guidelines. Do not scrape, reverse-engineer, or automate the app.",
          "We may remove content or end access when these terms or the guidelines are broken.",
        ],
      },
      {
        heading: "No warranties, limited liability",
        body: [
          "Baila is provided as-is. Availability, features, and this document may change.",
          "To the extent the law allows, Baila is not liable for what happens between dancers offline.",
        ],
      },
      {
        heading: "Contact",
        body: ["Questions about these terms: add your support contact address here before launch."],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    description:
      "What Baila stores, where it is kept, and the controls you have over your profile, dance videos and dates.",
    intro:
      "This build of Baila runs entirely on your device. Placeholder text for the operator to review before any cloud features ship.",
    sections: [
      {
        heading: "What is stored",
        body: [
          "Profile details you type in: name, age, city, bio, styles, experience level and profile photo.",
          "Your dance videos and their cover frames.",
          "Dance invites and dates you create, plus your settings and blocked list.",
        ],
      },
      {
        heading: "Where it is stored",
        body: [
          "In this build, everything is saved in your browser's local storage and on-device database. Nothing is uploaded to a server and no account exists.",
          "Clearing your browser data, or using Delete everything in Settings, removes it permanently.",
        ],
      },
      {
        heading: "What Baila does not do",
        body: [
          "No selling of personal data. No advertising profiles. No follower counts or public engagement metrics.",
          "Usage analytics are off by default and can be toggled in Settings → Privacy.",
        ],
      },
      {
        heading: "Your controls",
        body: [
          "Hide your age, show your city only, restrict who can watch your reels, pause your profile.",
          "Download a copy of your data, or delete all of it, from Settings → Your data.",
        ],
      },
      {
        heading: "Children",
        body: ["Baila is for adults only and is not directed at anyone under 18."],
      },
      {
        heading: "Changes and contact",
        body: [
          "If cloud accounts, hosting, or third-party processors are added later, this policy must be updated to name them before that ships.",
          "Privacy questions: add your privacy contact address here before launch.",
        ],
      },
    ],
  },
};

export const Route = createFileRoute("/legal/$doc")({
  loader: ({ params }) => {
    const doc = DOCS[params.doc];
    if (!doc) throw notFound();
    return { doc };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Not found — Baila" }, { name: "robots", content: "noindex" }] };
    }
    const { title, description } = loaderData.doc;
    const full = `${title} — Baila`;
    return {
      meta: [
        { title: full },
        { name: "description", content: description },
        { property: "og:title", content: full },
        { property: "og:description", content: description },
      ],
    };
  },
  component: LegalDoc,
});

function LegalDoc() {
  const { doc } = Route.useLoaderData() as { doc: Doc };

  return (
    <SettingsShell title={doc.title} backTo="/settings" intro={doc.intro}>
      <article className="pb-10">
        {doc.sections.map((s) => (
          <section key={s.heading} className="mb-5 rounded-3xl bg-white/70 px-4 py-4">
            <h2 className="font-display text-base font-semibold text-baila-ink">{s.heading}</h2>
            {s.body.map((p) => (
              <p key={p} className="mt-2 text-sm leading-relaxed text-baila-ink/75">
                {p}
              </p>
            ))}
          </section>
        ))}
        <p className="px-1 text-xs text-baila-ink/50">
          Maintained by the Baila team. This page describes how the app works today and is not an
          independent certification or legal advice.
        </p>
      </article>
    </SettingsShell>
  );
}
