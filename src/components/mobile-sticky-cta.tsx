"use client";

import { ArrowRightIcon } from "@/components/ui/icons";

export function MobileStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_35px_rgba(15,45,40,0.12)] backdrop-blur sm:hidden">
      <a href="#estimation" className="primary-button mx-auto w-full max-w-md">
        Comparer gratuitement <ArrowRightIcon className="h-4 w-4" />
      </a>
    </div>
  );
}
