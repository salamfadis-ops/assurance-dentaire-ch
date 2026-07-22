"use client";

import { ArrowRightIcon } from "@/components/ui/icons";

export function MobileStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#071c19]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-18px_45px_rgba(4,23,19,0.22)] backdrop-blur-xl sm:hidden">
      <a href="/bilan" className="premium-button mx-auto min-h-12 w-full max-w-md text-sm">Obtenir mon score <ArrowRightIcon className="h-4 w-4" /></a>
    </div>
  );
}
