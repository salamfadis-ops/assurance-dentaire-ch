"use client";

import { useMemo } from "react";
import { ArrowRightIcon } from "@/components/ui/icons";
import { calendlyUrl, collectAttribution, type LeadContact } from "@/lib/lead";

type CalendlyLinkProps = {
  contact?: Partial<LeadContact>;
  onOpen?: () => void;
  className?: string;
};

export function CalendlyLink({ contact, onOpen, className = "" }: CalendlyLinkProps) {
  const baseUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;
  const href = useMemo(() => baseUrl ? calendlyUrl(baseUrl, collectAttribution(), contact) : "", [baseUrl, contact]);

  if (!href) return null;

  return (
    <div className={className}>
      <p className="text-sm font-semibold text-[#5b6f69]">Vous préférez choisir directement votre créneau ?</p>
      <a href={href} target="_blank" rel="noreferrer" onClick={onOpen} className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#176654]/25 bg-white px-5 text-sm font-extrabold text-[#176654] transition hover:-translate-y-0.5 hover:border-[#176654] hover:shadow-md">
        Prendre rendez-vous avec VYDA <ArrowRightIcon className="h-4 w-4" />
      </a>
    </div>
  );
}
