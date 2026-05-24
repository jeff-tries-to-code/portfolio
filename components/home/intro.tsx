import { ProseLink } from "@/components/ui/prose-link";

type LinkItem = { label: string; href: string; description?: string };

const weekendProjects: LinkItem[] = [
  {
    label: "DropTexts",
    href: "https://www.droptexts.com/",
    description: "Helping creators sell out faster.",
  },
  {
    label: "DownToPair",
    href: "https://www.downtopair.com/",
    description: "Building alone is hard, pair up and push forward.",
  },
  {
    label: "CalendarByAI",
    href: "https://www.instagram.com/reel/DKueCxfM-vD/?igsh=NTc4MTIwNjQ2YQ==",
    description: "AI-generated calendars.",
  },
  {
    label: "DesignEngJobs",
    href: "https://www.designengjobs.com/",
    description: "Job board for Design Engineers.",
  },
];

const writing: LinkItem[] = [
  {
    label: "Nextdoor for Mexico City",
    href: "https://medium.com/dev-genius/nextdoor-for-mexico-city-validating-a-startup-idea-in-less-than-a-week-for-100-without-code-70d9f00448bc",
  },
  {
    label: "A business case for user delight",
    href: "https://medium.com/user-experience-design-1/a-business-case-for-user-delight-5d3e6ad61adb",
  },
  {
    label: "Idea to app store in 7 days",
    href: "https://medium.com/@jeffworr/idea-to-app-store-in-7-days-e096aa8a6bab",
    description: "(in 2018 before vibe coding made this less impressive :)",
  },
];

export function Intro() {
  return (
    <article className="space-y-6">
      <p>
        Entrepreneurial product builder based in San Francisco, currently Sr.
        Manager of Product Design &amp; Design Engineering at{" "}
        <ProseLink href="https://growtherapy.com/">Grow Therapy</ProseLink>.
      </p>

      <p>
        Before Grow, I was the Head of Design at{" "}
        <ProseLink href="https://delt.ai/">delt.ai</ProseLink> (YC W20) and
        co-founded{" "}
        <ProseLink href="https://www.youtube.com/watch?v=9ZetIlmQCTo">
          Maply
        </ProseLink>
        , a social map app that scaled to 23 cities.
      </p>

      <p>
        In my free time, I travel (38 countries), train jiu jitsu, and tinker
        towards the perfect pour-over.
      </p>

      <section className="space-y-1">
        <p>Weekend projects:</p>
        <ul className="list-disc space-y-1 pl-6 marker:text-[var(--muted)]">
          {weekendProjects.map((p) => (
            <li key={p.label}>
              <ProseLink href={p.href}>{p.label}</ProseLink>
              {p.description ? <> &mdash; {p.description}</> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-1">
        <p>Writing:</p>
        <ul className="list-disc space-y-1 pl-6 marker:text-[var(--muted)]">
          {writing.map((w) => (
            <li key={w.label}>
              <ProseLink href={w.href}>{w.label}</ProseLink>
              {w.description ? <> {w.description}</> : null}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
