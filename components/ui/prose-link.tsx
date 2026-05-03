import Link from "next/link";
import type { ComponentProps } from "react";

type ProseLinkProps = ComponentProps<typeof Link>;

function isExternalHref(href: ProseLinkProps["href"]): boolean {
  if (typeof href !== "string") return false;
  return /^(https?:|mailto:|tel:)/i.test(href);
}

export function ProseLink({
  className = "",
  href,
  target,
  rel,
  ...props
}: ProseLinkProps) {
  const external = isExternalHref(href);
  const resolvedTarget = target ?? (external && href !== "mailto:" ? "_blank" : undefined);
  const resolvedRel =
    rel ?? (external ? "noopener noreferrer" : undefined);

  return (
    <Link
      {...props}
      href={href}
      target={resolvedTarget}
      rel={resolvedRel}
      className={`underline decoration-[var(--muted)] decoration-1 underline-offset-[3px] transition-colors hover:decoration-[var(--foreground)] ${className}`}
    />
  );
}
