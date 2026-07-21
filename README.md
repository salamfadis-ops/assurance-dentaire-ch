# assurance-dentaire.ch

Plateforme suisse d’information et de génération de leads pour l’assurance dentaire, éditée par VYDA SA.

## Stack

- Next.js 16 avec App Router
- React 19 et TypeScript strict
- Tailwind CSS 4
- Rendu statique, sans base de données

## Développement

```bash
pnpm install
pnpm dev
```

Le site est ensuite disponible sur [http://localhost:3000](http://localhost:3000).

## Vérifications

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Formulaire

Le formulaire envoie les demandes via l’API serveur `/api/leads`. Deux modes de livraison sont prévus :

- Resend avec `RESEND_API_KEY` ;
- un webhook CRM avec `LEADS_WEBHOOK_URL`.

Copier `.env.example` vers `.env.local` et renseigner au moins une méthode avant la mise en production. Sans configuration, les données sont masquées et journalisées uniquement en développement ; la production renvoie une erreur explicite plutôt que de perdre silencieusement un lead.

L’attribution UTM est conservée avec la demande. Le suivi Google Ads et son consentement peuvent être activés avec `NEXT_PUBLIC_GOOGLE_ADS_ID` et `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_TARGET`.
