"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

export function GoogleAds() {
  const [choice, setChoice] = useState<"accepted" | "declined" | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("vyda-analytics-consent");
    if (saved !== "accepted" && saved !== "declined") return;
    const timer = window.setTimeout(() => setChoice(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!adsId) return null;

  const decide = (value: "accepted" | "declined") => {
    window.localStorage.setItem("vyda-analytics-consent", value);
    setChoice(value);
  };

  return (
    <>
      {choice === "accepted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${adsId}`} strategy="afterInteractive" />
          <Script id="google-ads" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${adsId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {choice === null && (
        <aside className="fixed bottom-20 left-3 right-3 z-50 mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:bottom-5 sm:left-5 sm:right-auto" aria-label="Préférences de mesure d’audience">
          <p className="text-sm font-bold text-[#102d28]">Mesure d’audience</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Avec votre accord, nous mesurons les conversions afin d’améliorer cette plateforme. Aucun cookie publicitaire n’est déposé avant votre choix.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => decide("declined")} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Refuser</button>
            <button type="button" onClick={() => decide("accepted")} className="rounded-full bg-[#176654] px-4 py-2 text-xs font-bold text-white">Accepter</button>
          </div>
        </aside>
      )}
    </>
  );
}
