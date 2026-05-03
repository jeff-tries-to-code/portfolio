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


export function SiteHeader() {
  return (
    <header className="flex items-center justify-between">
      <Avatar
        src="/avatar-illustration.png"
        alt="Jeff Orr"
        size={56}
        className="-scale-x-100"
      />
      <nav aria-label="Social links" className="mr-2">
        <ul className="flex items-center gap-6 text-[var(--foreground)]">
          {socialLinks.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <Link
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex transition-opacity hover:opacity-60"
              >
                <Icon className="text-[1.15rem]" />
              </Link>
            </li>
          ))}
          <li>
            <EmailCopyButton user="jeff.warren.orr" domain="gmail.com" />
          </li>
        </ul>
      </nav>
    </header>
  );
}
