"use client";

import { useEffect, useRef, useState } from "react";

import { EnvelopeIcon } from "@/components/ui/icons";

type EmailCopyButtonProps = {
  user: string;
  domain: string;
};

export function EmailCopyButton({ user, domain }: EmailCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = async () => {
    try {
      const email = `${user}@${domain}`;
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard may be unavailable (insecure context, denied permission, etc.)
    }
  };

  return (
    <span className="relative inline-flex items-center">
      <span
        aria-live="polite"
        className={`pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap text-[12px] text-[var(--muted)] transition-opacity duration-200 ${
          copied ? "opacity-100" : "opacity-0"
        }`}
      >
        Copied to clipboard
      </span>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Copy email address"
        className="inline-flex cursor-pointer transition-colors hover:text-[var(--foreground)]"
      >
        <EnvelopeIcon className="text-[1.15rem]" />
      </button>
    </span>
  );
}
