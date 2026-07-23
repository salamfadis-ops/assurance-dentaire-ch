import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LeadForm } from "@/components/lead-form";
import { MobileStickyCta } from "@/components/mobile-sticky-cta";
import { JourneyTimeline, ProtectionVisual } from "@/components/premium/product-showcase";
import { VydaMark } from "@/components/vyda-mark";
import { insurers } from "@/lib/insurers";
import { isDocumentStorageConfigured } from "@/lib/documents";
import {
  ArrowRightIcon,
  ChartIcon,
  CheckIcon,
  DocumentIcon,
  LockIcon,
  ScanIcon,
  ShieldIcon,
  SparklesIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Bilan assurance dentaire Suisse | Score gratuit",
  description:
    "Évaluez votre protection dentaire en Suisse. Obtenez gratuitement votre score personnalisé, vos priorités et un rapport PDF clair.",
};

const criteria = [
  ["Plafond annuel", "Ce que le contrat peut réellement rembourser chaque année."],
  ["Taux de prise en charge", "La part couverte après franchise et selon le traitement."],
  ["Délai d’attente", "La période durant laquelle certaines prestations restent exclues."],
  ["Conditions d’admission", "Âge, questionnaire de santé et traitements déjà conseillés."],
] as const;

const baseFaqs = [
  {
    question: "L’assurance de base couvre-t-elle les soins dentaires ?",
    answer: "En principe, non. Elle intervient dans des situations médicales précises. Les contrôles, soins courants et traitements orthodontiques sont généralement à votre charge ou relèvent d’une assurance complémentaire.",
  },
  {
    question: "Pourquoi faire le bilan avant de demander une offre ?",
    answer: "Une prime seule ne permet pas d’évaluer une protection. Le bilan structure vos besoins, votre horizon de soins et les limites à vérifier avant toute comparaison de contrats.",
  },
  {
    question: "Le Score Protection Dentaire est-il une recommandation d’assurance ?",
    answer: "Non. C’est un indicateur transparent de votre niveau de préparation. Il ne remplace ni les conditions contractuelles, ni un conseil médical, ni une décision d’acceptation par un assureur.",
  },
  { question: "Une complémentaire ambulatoire peut-elle couvrir des soins dentaires ?", answer: "Selon le contrat, elle peut prévoir une participation aux soins dentaires ou à l’orthodontie. Le taux, le plafond, la franchise et les conditions doivent être vérifiés." },
  { question: "Comment l’orthodontie est-elle remboursée ?", answer: "La prise en charge varie selon l’âge d’admission, le délai d’attente, le taux de remboursement et le plafond total ou annuel prévu par le contrat." },
  { question: "Les soins dans un pays frontalier sont-ils admis ?", answer: "Certaines compagnies les acceptent sous conditions. Il faut confirmer le pays, le tarif reconnu, les justificatifs et l’accord préalable éventuel." },
  { question: "Pourquoi assurer un jeune enfant tôt ?", answer: "Selon les conditions de la compagnie, une admission précoce peut simplifier le questionnaire ou éviter un contrôle dentaire préalable." },
  { question: "La souscription prénatale est-elle possible ?", answer: "Certaines compagnies proposent une admission avant la naissance avec des conditions spécifiques. Les modalités doivent être contrôlées avant la date limite." },
  { question: "Que signifient quote-part et plafond ?", answer: "La quote-part reste à votre charge après remboursement. Le plafond limite le montant versé par l’assureur sur une période ou pour un traitement." },
];

const littleKnownFacts = [
  ["Votre complémentaire ambulatoire couvre peut-être déjà certains soins", "Selon le contrat, certains soins dentaires ou frais d’orthodontie peuvent déjà être pris en charge par une assurance complémentaire ambulatoire."],
  ["Il reste généralement une part à votre charge", "Le remboursement dépend du taux de prise en charge, du plafond, de la franchise et des conditions de la compagnie."],
  ["Les soins à l’étranger sont parfois admis", "Certaines compagnies autorisent les traitements dans des pays frontaliers. Des coûts plus faibles peuvent alors réduire le reste à charge, notamment pour l’orthodontie."],
  ["Assurer un enfant tôt peut simplifier l’admission", "Selon les compagnies, une souscription avant un certain âge peut nécessiter un questionnaire simplifié et éviter un contrôle dentaire préalable."],
  ["La souscription prénatale peut offrir des avantages", "Certaines compagnies proposent, selon leurs conditions en vigueur, des mois de primes offerts ou des conditions préférentielles."],
] as const;

function ContractIllustration() {
  return (
    <svg viewBox="0 0 520 340" className="h-auto w-full" role="img" aria-label="Illustration exclusive d’une analyse de contrat">
      <defs>
        <linearGradient id="contract-card" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#163b34" /><stop offset="1" stopColor="#0a231f" /></linearGradient>
        <filter id="soft-shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#08251f" floodOpacity=".2" /></filter>
      </defs>
      <rect x="34" y="28" width="452" height="284" rx="34" fill="#e3f1eb" />
      <circle cx="425" cy="76" r="62" fill="#f6b18e" opacity=".45" />
      <path d="M45 257C146 184 310 344 480 188" fill="none" stroke="#b9ddcf" strokeWidth="30" strokeLinecap="round" opacity=".65" />
      <g filter="url(#soft-shadow)">
        <rect x="96" y="58" width="298" height="236" rx="24" fill="white" />
        <rect x="96" y="58" width="298" height="63" rx="24" fill="url(#contract-card)" />
        <path d="M96 97h298v24H96z" fill="url(#contract-card)" />
        <circle cx="128" cy="89" r="13" fill="#b9f1dd" opacity=".18" />
        <path d="M122 89l4 4 8-9" fill="none" stroke="#b9f1dd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="150" y="79" width="91" height="8" rx="4" fill="white" opacity=".9" />
        <rect x="150" y="95" width="62" height="5" rx="2.5" fill="white" opacity=".35" />
        {[0, 1, 2].map((item) => <g key={item} transform={`translate(0 ${item * 47})`}><rect x="124" y="143" width="112" height="7" rx="3.5" fill="#183b35" opacity=".82" /><rect x="124" y="158" width="80" height="5" rx="2.5" fill="#9aada8" /><rect x="295" y="141" width="68" height="22" rx="11" fill={item === 1 ? "#fff0e8" : "#e5f4ee"} /><rect x="311" y="150" width="37" height="4" rx="2" fill={item === 1 ? "#cb6941" : "#23715f"} /></g>)}
      </g>
      <g transform="translate(355 205)"><circle cx="50" cy="50" r="43" fill="#f5a278" /><path d="M33 50l11 11 24-26" fill="none" stroke="#32190f" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></g>
    </svg>
  );
}

export default function Home() {
  const storageConfigured = isDocumentStorageConfigured();
  const faqs = [...baseFaqs, {
    question: "Puis-je transmettre mes contrats et devis PDF ?",
    answer: storageConfigured
      ? "Oui. Les documents que vous choisissez de transmettre sont envoyés de manière sécurisée afin qu’un conseiller VYDA puisse analyser vos garanties. Ils ne sont jamais rendus publics."
      : "L’envoi sécurisé de documents n’est pas encore activé sur cette version.",
  }];
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  };

  return (
    <>
      <a href="#contenu" className="skip-link">Aller au contenu</a>
      <Header />
      <main id="contenu">
        <section className="premium-hero relative isolate overflow-hidden bg-[#071c19] pb-16 pt-10 text-white sm:pb-24 sm:pt-16 lg:min-h-[calc(100svh-5rem)] lg:pb-20 lg:pt-12">
          <div className="premium-noise absolute inset-0 -z-20 opacity-40" />
          <div className="absolute -left-40 top-0 -z-10 h-[32rem] w-[32rem] rounded-full bg-[#1d6b59]/30 blur-[120px]" />
          <div className="absolute -right-40 bottom-0 -z-10 h-[34rem] w-[34rem] rounded-full bg-[#d66e44]/20 blur-[130px]" />
          <Container className="grid items-center gap-12 lg:grid-cols-[1.03fr_0.97fr] lg:gap-8 xl:gap-16">
            <div className="hero-enter max-w-[46rem]">
              <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.055] px-3.5 py-2 text-xs font-bold text-[#c7dbd5] backdrop-blur">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a8efd5] opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#a8efd5]" /></span>
                Le premier bilan digital dédié à la protection dentaire
              </div>
              <h1 className="max-w-[44rem] font-display text-[3.25rem] font-semibold leading-[0.96] tracking-[-0.065em] text-white sm:text-[4.8rem] lg:text-[5.15rem] xl:text-[5.7rem]">
                Vos dents méritent mieux qu’un tableau de primes.
              </h1>
              <p className="mt-7 max-w-[38rem] text-lg leading-8 text-[#a9beb8] sm:text-xl">Votre score, vos priorités et un conseiller VYDA. En 2 minutes.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href="/bilan" className="premium-button group min-h-14 px-7 text-[0.95rem]">
                  Faire mon bilan gratuit <ArrowRightIcon className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
                </a>
                <a href="#rappel" className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.055] px-7 text-[0.95rem] font-extrabold text-white transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.09]">Être rappelé gratuitement</a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-[#9db3ad]">
                {["100 % gratuit", "Sans engagement", "Réponse sous 24 h", "Conseiller indépendant FINMA"].map((item) => <span key={item} className="flex items-center gap-2"><CheckIcon className="h-3.5 w-3.5 text-[#a8efd5]" />{item}</span>)}
              </div>
            </div>
            <div className="hero-form-enter lg:-mr-8 xl:-mr-12"><ProtectionVisual /></div>
          </Container>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </section>

        <section className="border-b border-[#dfe7e3] bg-[#f4f6f2] py-5" aria-label="Engagements VYDA">
          <Container className="grid grid-cols-2 gap-x-5 gap-y-4 sm:flex sm:items-center sm:justify-between">
            <div className="col-span-2 flex items-center gap-3 sm:col-span-1"><VydaMark compact /><p className="text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-[#526a64]">Un service proposé par VYDA SA</p></div>
            {[[LockIcon, "Données confidentielles"], [ShieldIcon, "Méthode transparente"], [SparklesIcon, "Sans jargon"]].map(([Icon, label]) => {
              const TrustIcon = Icon as typeof ShieldIcon;
              return <span key={label as string} className="flex items-center gap-2 text-xs font-bold text-[#29443d]"><TrustIcon className="h-4 w-4 text-[#176654]" />{label as string}</span>;
            })}
          </Container>
        </section>

        <section className="bg-white py-16 sm:py-24">
          <Container>
            <div className="max-w-4xl"><p className="eyebrow">À connaître avant de comparer</p><h2 className="section-title mt-5">Ce que peu de personnes savent sur l’assurance dentaire</h2></div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {littleKnownFacts.map(([title, description], index) => (
                <article key={title} className={`premium-card p-6 ${index === 2 ? "bg-[#102d28] text-white" : "bg-[#f5f7f4] text-[#102d28]"}`}>
                  <span className={`text-xs font-extrabold ${index === 2 ? "text-[#b9f1dd]" : "text-[#176654]"}`}>0{index + 1}</span>
                  <h3 className="mt-5 text-lg font-bold leading-6">{title}</h3>
                  <p className={`mt-3 text-sm leading-6 ${index === 2 ? "text-[#b9c9c5]" : "text-[#61736e]"}`}>{description}</p>
                </article>
              ))}
            </div>
            <p className="mt-5 text-xs text-[#526a64]">Les conditions varient selon les compagnies et les produits.</p>
          </Container>
        </section>

        <section className="border-y border-[#dfe7e3] bg-[#f4f6f2] py-14 sm:py-20">
          <Container>
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><p className="eyebrow">Accès au marché</p><h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-[#102d28] sm:text-5xl">Accès à plusieurs assureurs, une seule analyse</h2></div><p className="section-intro">VYDA compare les solutions disponibles selon votre situation et vos besoins.</p></div>
            <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8" aria-label="Assureurs accessibles">
              {insurers.map((insurer) => <li key={insurer.name} className="flex min-h-20 items-center justify-center rounded-2xl border border-[#dce5e0] bg-white px-3 text-center text-sm font-extrabold text-[#29443d] shadow-[0_8px_25px_rgba(8,35,30,.035)]" aria-label={insurer.logoAlt}>{insurer.name}</li>)}
            </ul>
            <p className="mt-5 text-xs text-[#526a64]">Accès direct ou via notre distributeur selon la compagnie.</p>
          </Container>
        </section>

        <section id="methode" className="scroll-mt-24 overflow-hidden bg-[#f4f6f2] py-16 sm:py-24 lg:py-28">
          <Container>
            <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
              <div>
                <p className="eyebrow">La différence VYDA</p>
                <h2 className="section-title mt-5 max-w-[50rem]">Une décision sérieuse commence par les bonnes questions.</h2>
              </div>
              <p className="section-intro lg:pb-2">Pas de classement opaque : votre situation, votre score, vos actions.</p>
            </div>

            <div className="mt-14 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
              <article className="premium-card group relative min-h-[32rem] overflow-hidden bg-[#e4eee9] p-6 sm:p-10">
                <div className="relative z-10 max-w-md">
                  <span className="feature-icon"><ScanIcon className="h-5 w-5" /></span>
                  <h3 className="mt-6 font-display text-3xl font-semibold tracking-[-0.04em] text-[#0c2a25] sm:text-4xl">Votre contrat, enfin lisible.</h3>
                  <p className="mt-4 max-w-sm leading-7 text-[#526a64]">Repérez plafonds, délais et exclusions.</p>
                </div>
                <div className="absolute -bottom-10 left-[8%] right-[-3%] transition duration-700 ease-out group-hover:-translate-y-2 group-hover:rotate-[-1deg]"><ContractIllustration /></div>
              </article>

              <div className="grid gap-5">
                <article className="premium-card group relative overflow-hidden bg-[#f5a278] p-7 text-[#32180f] sm:p-9">
                  <div className="flex items-start justify-between gap-6">
                    <div><span className="feature-icon bg-[#32180f]/10 text-[#32180f]"><ChartIcon className="h-5 w-5" /></span><h3 className="mt-6 font-display text-3xl font-semibold tracking-[-0.04em]">Un score, pas une boîte noire.</h3><p className="mt-3 max-w-md leading-7 text-[#653321]">Cinq dimensions visibles. Chaque point mène à une action compréhensible.</p></div>
                    <div className="relative mt-2 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[6px] border-[#32180f]/15 border-r-[#32180f] text-3xl font-bold transition duration-500 group-hover:rotate-6 sm:h-28 sm:w-28">79</div>
                  </div>
                </article>
                <article className="premium-card group relative overflow-hidden bg-white p-7 sm:p-9">
                  <span className="feature-icon"><DocumentIcon className="h-5 w-5" /></span>
                  <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div><h3 className="font-display text-3xl font-semibold tracking-[-0.04em] text-[#0c2a25]">Votre plan vous appartient.</h3><p className="mt-3 max-w-md leading-7 text-[#5b6f69]">Un rapport personnel, prêt à utiliser.</p></div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#dbe5e1] text-[#176654] transition duration-300 group-hover:-translate-y-1 group-hover:bg-[#176654] group-hover:text-white"><ArrowRightIcon className="h-5 w-5 rotate-90" /></span>
                  </div>
                </article>
              </div>
            </div>
          </Container>
        </section>

        <section id="fonctionnement" className="relative scroll-mt-24 overflow-hidden bg-[#071c19] py-16 text-white sm:py-24 lg:py-28">
          <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-[#176654]/15 blur-[110px]" />
          <Container className="relative">
            <div className="mb-12 max-w-3xl sm:mb-16">
              <p className="eyebrow !text-[#a8efd5]">Le parcours</p>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:text-6xl">De l’incertitude à un plan clair.</h2>
            </div>
            <JourneyTimeline />
          </Container>
        </section>

        <section id="comprendre" className="scroll-mt-24 bg-white py-16 sm:py-24 lg:py-28">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.76fr_1.24fr] lg:gap-24">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="eyebrow">Avant de comparer</p>
                <h2 className="section-title mt-5">La prime n’est que le début de l’histoire.</h2>
                <p className="section-intro mt-5">Deux contrats au même prix peuvent protéger très différemment. Ces quatre critères changent tout.</p>
                <a href="https://www.bag.admin.ch/fr/soins-dentaires" target="_blank" rel="noreferrer" className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#176654]">Lire la référence officielle de l’OFSP <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" /></a>
              </div>
              <ol className="divide-y divide-[#dde5e1] border-y border-[#dde5e1]">
                {criteria.map(([title, description], index) => (
                  <li key={title} className="group grid gap-3 py-7 sm:grid-cols-[4rem_1fr] sm:gap-6 sm:py-9">
                    <span className="font-display text-sm font-semibold text-[#b9471d]">0{index + 1}</span>
                    <div className="grid gap-2 sm:grid-cols-[0.75fr_1.25fr] sm:gap-8"><h3 className="text-lg font-bold tracking-[-0.02em] text-[#102d28] transition group-hover:text-[#176654]">{title}</h3><p className="leading-7 text-[#61736e]">{description}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </Container>
        </section>

        <section id="faq" className="scroll-mt-24 bg-[#f3f6f2] py-16 sm:py-24 lg:py-28">
          <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
            <div>
              <p className="eyebrow">En toute transparence</p>
              <h2 className="section-title mt-5">Les questions utiles, sans détour.</h2>
            </div>
            <div className="divide-y divide-[#dde5e1] border-y border-[#dde5e1]">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-8 py-6 text-left text-lg font-bold tracking-[-0.015em] text-[#102d28] marker:content-none sm:text-xl">
                    {faq.question}<span className="faq-toggle" aria-hidden="true" />
                  </summary>
                  <p className="max-w-2xl pb-7 pr-10 leading-7 text-[#61736e]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        <section id="rappel" className="scroll-mt-24 overflow-hidden bg-[#071c19] py-16 sm:py-24">
          <Container className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div className="text-white"><p className="eyebrow !text-[#b9f1dd]">Un échange humain</p><h2 className="mt-5 font-display text-5xl font-semibold leading-[1] tracking-[-0.055em] sm:text-6xl">Une question précise ? Parlons-en.</h2><p className="mt-6 max-w-xl text-lg leading-8 text-[#a9beb8]">Votre demande arrive directement chez VYDA. Pas de centre d’appel, pas de vente automatique.</p><div className="mt-8 space-y-3 text-sm font-semibold text-[#d5e3df]"><p><a href="tel:+41794809910" className="transition hover:text-white">+41 79 480 99 10</a></p><p><a href="mailto:contact@vyda.ch" className="transition hover:text-white">contact@vyda.ch</a></p></div></div>
            <LeadForm />
          </Container>
        </section>

        <section className="bg-white py-16 sm:py-24">
          <Container>
            <div className="premium-cta relative overflow-hidden rounded-[2.5rem] bg-[#176654] px-6 py-16 text-center text-white sm:px-12 sm:py-24">
              <div className="absolute -left-20 -top-32 h-80 w-80 rounded-full border-[55px] border-white/[0.045]" />
              <div className="absolute -bottom-48 -right-16 h-96 w-96 rounded-full bg-[#f5a278]/25 blur-3xl" />
              <div className="relative mx-auto max-w-4xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c2f3e1]">Votre protection mérite d’être claire</p>
                <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl">En deux minutes, vous saurez quoi vérifier.</h2>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#d5e8e2]">100 % gratuit. Sans engagement. Réponse sous 24 h.</p>
                <a href="/bilan" className="group mt-9 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-extrabold text-[#125444] shadow-[0_18px_50px_rgba(5,35,29,.25)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(5,35,29,.32)]">Faire mon bilan gratuit <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" /></a>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
      <MobileStickyCta />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
    </>
  );
}
