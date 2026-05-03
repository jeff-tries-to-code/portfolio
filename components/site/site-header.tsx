import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { EmailCopyButton } from "@/components/site/email-copy-button";
import {
  GithubIcon,
  LinkedinIcon,
  TwitterIcon,
} from "@/components/ui/icons";

type SocialLink = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const socialLinks: SocialLink[] = [
  { label: "Twitter", href: "https://x.com/jeffworr", icon: TwitterIcon },
  {
    label: "GitHub",
    href: "https://github.com/jeff-tries-to-code",
    icon: GithubIcon,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/jeff-warren-orr/",
    icon: LinkedinIcon,
  },
];

const email = "jeff.warren.orr@gmail.com";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between">
      <Avatar src="/avatar-illustration.png" alt="Jeff Orr" size={56} />
      <nav aria-label="Social links">
        <ul className="flex items-center gap-6 text-[var(--muted)]">
          {socialLinks.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <Link
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex transition-colors hover:text-[var(--foreground)]"
              >
                <Icon className="text-[1.15rem]" />
              </Link>
            </li>
          ))}
          <li>
            <EmailCopyButton email={email} />
          </li>
        </ul>
      </nav>
    </header>
  );
}
