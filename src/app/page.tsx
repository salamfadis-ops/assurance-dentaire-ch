import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LeadForm } from "@/components/lead-form";
import { MobileStickyCta } from "@/components/mobile-sticky-cta";
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  HeartIcon,
  ShieldIcon,
  SparklesIcon,
  ToothIcon,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Assurance dentaire Suisse | Comparer les couvertures",
  description:
    "Comparez les critères des assurances dentaires en Suisse. Recevez gratuitement une analyse personnalisée pour adulte, enfant ou famille.",
};

const benefits = [
  {
    icon: ShieldIcon,
    title: "Une analyse structurée",
    description:
      "Nous passons en revue prestations, exclusions, délais d’attente et plafonds avant toute décision.",
  },
  {
    icon: ToothIcon,
    title: "Adapté à vos besoins",
    description:
      "Orthodontie, contrôles, soins courants ou couverture familiale : chaque situation est différente.",
  },
  {
    icon: ClockIcon,
    title: "Simple et rapide",
    description:
      "Quelques réponses suffisent pour préparer une première orientation, sans jargon inutile.",
  },
];

const steps = [
  {
    number: "01",
    title: "Répondez à 8 questions",
    description:
      "Profil, besoins, couverture et budget : votre progression est sauvegardée pendant la session.",
  },
  {
    number: "02",
    title: "Découvrez votre score",
    description:
      "Votre Score Protection Dentaire mesure cinq dimensions et met en évidence vos priorités.",
  },
  {
    number: "03",
    title: "Téléchargez votre plan d’action",
    description:
      "Obtenez un rapport PDF personnel avec votre score, votre budget et des recommandations concrètes.",
  },
];

const checkpoints = [
  "Montant maximal remboursé par année",
  "Pourcentage réellement pris en charge",
  "Délai d’attente avant le premier remboursement",
  "Âge limite d’entrée et questionnaire de santé",
  "Prestations couvertes en Suisse et à l’étranger",
  "Exclusions liées aux traitements déjà recommandés",
];

const faqs = [
  {
    question: "L’assurance de base couvre-t-elle les soins dentaires ?",
    answer:
      "En principe, non. L’assurance obligatoire intervient seulement dans certains cas précis, notamment lorsqu’un traitement dentaire est lié à une maladie grave et non évitable ou qu’il est nécessaire pour traiter une maladie grave. Les soins courants et l’orthodontie ne sont généralement pas couverts.",
  },
  {
    question: "Quand faut-il assurer les dents d’un enfant ?",
    answer:
      "Il est utile d’étudier la question tôt, avant qu’un traitement orthodontique soit recommandé. Les conditions d’admission, délais d’attente et examens demandés diffèrent selon les assureurs.",
  },
  {
    question: "Une assurance dentaire rembourse-t-elle toujours 100 % ?",
    answer:
      "Non. Les contrats combinent souvent un taux de remboursement avec un plafond annuel. Il faut aussi vérifier les franchises, délais d’attente et prestations exclues.",
  },
  {
    question: "Puis-je souscrire si un traitement est déjà prévu ?",
    answer:
      "Cela dépend des conditions d’admission. Un traitement déjà conseillé ou commencé peut être exclu. Il est important de répondre avec exactitude au questionnaire de santé.",
  },
  {
    question: "Votre orientation est-elle gratuite ?",
    answer:
      "Oui. La première orientation est gratuite et sans engagement. Vous décidez librement si vous souhaitez aller plus loin.",
  },
];

export default function Home() {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <a href="#contenu" className="skip-link">Aller au contenu</a>
      <Header />
      <main id="contenu">
        <section className="relative isolate overflow-hidden bg-[#f3f7f4] pb-16 pt-8 sm:pb-24 sm:pt-14 lg:pb-28 lg:pt-16">
          <div className="hero-grid absolute inset-0 -z-20 opacity-55" />
          <div className="absolute -left-48 top-20 -z-10 h-96 w-96 rounded-full bg-emerald-200/45 blur-3xl" />
          <div className="absolute -right-40 bottom-0 -z-10 h-[32rem] w-[32rem] rounded-full bg-orange-100/70 blur-3xl" />
          <Container className="grid items-center gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:gap-14">
            <div className="hero-enter max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/80 px-3.5 py-2 text-sm font-semibold text-emerald-950 shadow-sm backdrop-blur">
                <SparklesIcon className="h-4 w-4 text-[#f36f38]" />
                Comparaison et conseil pour toute la Suisse
              </div>
              <h1 className="text-balance font-display text-[2.65rem] font-semibold leading-[1.04] tracking-[-0.045em] text-[#102d28] sm:text-6xl lg:text-[4.2rem]">
                Assurance dentaire en Suisse :
                <span className="relative block text-[#19715e]">
                  trouvez la bonne couverture.
                  <svg
                    aria-hidden="true"
                    className="absolute -bottom-2 left-0 h-3 w-[76%] text-[#f36f38]/80"
                    viewBox="0 0 500 16"
                    fill="none"
                  >
                    <path d="M3 12C117 3 329 2 497 7" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
                Comparez les critères qui font vraiment la différence et recevez une analyse personnalisée pour vous, votre enfant ou votre famille.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="/bilan"
                  className="primary-button group min-h-14 px-7 text-base shadow-[0_12px_30px_rgba(23,102,84,0.24)]"
                >
                  Faire mon bilan gratuit
                  <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                </a>
                <span className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 sm:justify-start">
                  <CheckIcon className="h-4 w-4 text-[#19715e]" />
                  Gratuit · 60 secondes · Sans engagement
                </span>
              </div>
              <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 border-t border-emerald-950/10 pt-6 sm:grid-cols-3">
                {["Adultes, enfants et familles", "Tous les cantons", "Réponse personnalisée"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-semibold text-[#284a43]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                      <CheckIcon className="h-3 w-3 text-[#176654]" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div id="estimation" className="hero-form-enter scroll-mt-24 lg:pl-2">
              <LeadForm />
            </div>
          </Container>
        </section>

        <section className="border-y border-slate-200/80 bg-white py-6" aria-label="Engagements">
          <Container className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-semibold text-slate-600 sm:justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Vos garanties</span>
            <span className="flex items-center gap-2"><ShieldIcon className="h-4 w-4 text-[#19715e]" /> Confidentielle</span>
            <span className="flex items-center gap-2"><HeartIcon className="h-4 w-4 text-[#19715e]" /> Humaine</span>
            <span className="flex items-center gap-2"><SparklesIcon className="h-4 w-4 text-[#19715e]" /> Sans jargon</span>
            <span className="hidden text-slate-400 md:inline">Service suisse proposé par VYDA SA</span>
          </Container>
        </section>

        <section id="comprendre" className="scroll-mt-20 bg-white py-20 sm:py-28">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <p className="eyebrow">Comprendre avant de choisir</p>
              <h2 className="section-title mt-4">Ne comparez pas seulement la prime.</h2>
              <p className="section-intro mx-auto mt-5">
                En Suisse, les soins dentaires courants ne sont en principe pas couverts par l’assurance de base. Une complémentaire peut aider, mais son plafond, son délai d’attente et ses exclusions déterminent sa valeur réelle.
              </p>
              <a href="https://www.bag.admin.ch/fr/soins-dentaires" target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold text-[#176654] underline decoration-emerald-200 decoration-2 underline-offset-4">Consulter la source officielle de l’OFSP</a>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {benefits.map(({ icon: Icon, title, description }) => (
                <article key={title} className="group rounded-[1.75rem] border border-slate-200 bg-[#fbfcfb] p-7 transition hover:-translate-y-1 hover:border-emerald-800/20 hover:shadow-[0_20px_50px_rgba(16,45,40,0.08)] sm:p-8">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dfeee8] text-[#176654] transition group-hover:bg-[#176654] group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-[#102d28]">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section id="fonctionnement" className="scroll-mt-20 bg-[#102d28] py-20 text-white sm:py-28">
          <Container>
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div>
                <p className="eyebrow text-[#93d3c2]">Le bilan digital</p>
                <h2 className="mt-4 max-w-lg font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                  8 questions. 1 score. Un plan clair.
                </h2>
                <p className="mt-5 max-w-md text-lg leading-8 text-slate-300">
                  Une démarche lisible : nous partons de votre besoin et des critères contractuels qui influencent réellement votre couverture.
                </p>
              </div>
              <ol className="grid gap-4">
                {steps.map((step) => (
                  <li key={step.number} className="grid grid-cols-[auto_1fr] gap-5 rounded-3xl border border-white/10 bg-white/[0.055] p-6 sm:p-7">
                    <span className="font-display text-2xl font-semibold text-[#f49467]">{step.number}</span>
                    <div>
                      <h3 className="text-xl font-bold">{step.title}</h3>
                      <p className="mt-2 leading-7 text-slate-300">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Container>
        </section>

        <section id="couvertures" className="scroll-mt-20 bg-[#f8faf9] py-20 sm:py-28">
          <Container>
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div className="relative overflow-hidden rounded-[2rem] bg-[#dcece6] p-7 sm:p-10">
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#f9cdb7]/80 blur-2xl" />
                <div className="relative rounded-[1.5rem] bg-white p-6 shadow-[0_25px_70px_rgba(16,45,40,0.12)] sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#19715e]">Exemple de lecture</span>
                      <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#102d28]">Votre contrat en clair</h3>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#102d28] text-white"><ToothIcon className="h-6 w-6" /></div>
                  </div>
                  <div className="mt-8 space-y-5">
                    {[
                      ["Soins préventifs", "À vérifier"],
                      ["Orthodontie", "Selon la formule"],
                      ["Plafond annuel", "Point essentiel"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <span className="font-medium text-slate-600">{label}</span>
                        <span className="rounded-full bg-[#e7f3ef] px-3 py-1 text-sm font-bold text-[#176654]">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-2xl bg-[#fff4ef] p-4 text-sm leading-6 text-[#783c22]">
                    <strong>Bon réflexe :</strong> ne comparez jamais une prime sans comparer les exclusions et les plafonds.
                  </div>
                </div>
              </div>
              <div>
                <p className="eyebrow">Les points qui comptent</p>
                <h2 className="section-title mt-4">Le prix ne dit pas toute l’histoire.</h2>
                <p className="section-intro mt-5">
                  Deux offres au même tarif peuvent protéger très différemment. Voici les éléments que nous vous aidons à examiner.
                </p>
                <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                  {checkpoints.map((item) => (
                    <li key={item} className="flex gap-3 text-[0.95rem] font-semibold leading-6 text-[#29423d]">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dfeee8]"><CheckIcon className="h-3 w-3 text-[#176654]" /></span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a href="/bilan" className="mt-9 inline-flex items-center gap-2 font-bold text-[#176654] underline decoration-[#f36f38] decoration-2 underline-offset-8">
                  Calculer mon score <ArrowRightIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </Container>
        </section>

        <section className="bg-white py-20 sm:py-28">
          <Container>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_25px_80px_rgba(16,45,40,0.08)] sm:p-12 lg:p-16">
              <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
                <div>
                  <p className="eyebrow">Pour toute la famille</p>
                  <h2 className="section-title mt-4">Des besoins différents, une même exigence de clarté.</h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <article className="rounded-3xl bg-[#f3f7f4] p-7">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#176654]"><ToothIcon className="h-5 w-5" /></div>
                    <h3 className="text-xl font-bold text-[#102d28]">Enfants & adolescents</h3>
                    <p className="mt-3 leading-7 text-slate-600">Anticipez les besoins potentiels en orthodontie et vérifiez les conditions d’admission suffisamment tôt.</p>
                  </article>
                  <article className="rounded-3xl bg-[#fff4ef] p-7">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#f36f38]"><SparklesIcon className="h-5 w-5" /></div>
                    <h3 className="text-xl font-bold text-[#102d28]">Adultes</h3>
                    <p className="mt-3 leading-7 text-slate-600">Évaluez l’intérêt d’une couverture selon vos soins habituels, votre budget et les prestations réellement remboursées.</p>
                  </article>
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section id="faq" className="scroll-mt-20 bg-[#f3f7f4] py-20 sm:py-28">
          <Container className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="eyebrow">Questions fréquentes</p>
              <h2 className="section-title mt-4">Les réponses essentielles.</h2>
              <p className="section-intro mt-5">Une question plus précise ? Décrivez-nous votre situation pour recevoir une première orientation.</p>
              <a href="/bilan" className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#176654] px-5 py-3 text-sm font-bold text-[#176654] transition hover:bg-[#176654] hover:text-white">
                Faire le bilan <ArrowRightIcon className="h-4 w-4" />
              </a>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-lg font-bold text-[#102d28] marker:content-none">
                    {faq.question}
                    <span className="relative h-5 w-5 shrink-0 text-[#176654] after:absolute after:left-1/2 after:top-0 after:h-5 after:w-0.5 after:-translate-x-1/2 after:bg-current after:transition group-open:after:rotate-90 before:absolute before:left-0 before:top-1/2 before:h-0.5 before:w-5 before:-translate-y-1/2 before:bg-current" />
                  </summary>
                  <p className="max-w-2xl pb-6 pr-8 leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        <section className="bg-white py-20 sm:py-28">
          <Container>
            <div className="relative overflow-hidden rounded-[2rem] bg-[#176654] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
              <div className="absolute -left-20 -top-32 h-72 w-72 rounded-full border-[50px] border-white/[0.06]" />
              <div className="absolute -bottom-44 -right-16 h-80 w-80 rounded-full bg-[#f36f38]/25 blur-2xl" />
              <div className="relative mx-auto max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-100">Décidez avec plus de clarté</p>
                <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Trouvez vos options en 60 secondes.</h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-emerald-50/85">Une analyse gratuite, adaptée à votre situation et sans engagement.</p>
                <a href="/bilan" className="group mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-7 font-bold text-[#176654] shadow-xl transition hover:-translate-y-0.5">
                  Calculer mon score <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                </a>
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
