# assurance-dentaire.ch

Plateforme suisse de bilan et de génération de leads éditée par VYDA SA.

## Stack

- Next.js 16, App Router et React 19
- TypeScript strict et Tailwind CSS 4
- Motion pour les transitions
- jsPDF pour les rapports prospect et conseiller
- Vercel Blob privé pour les documents facultatifs
- Resend ou webhook pour la livraison des leads

## Développement

```bash
pnpm install
pnpm dev
```

Vérifications :

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Parcours de conversion

- Le CTA « Faire mon bilan gratuit » ouvre le bilan en huit étapes.
- Le CTA « Être rappelé gratuitement » ouvre la section de rappel court.
- Les deux parcours utilisent le modèle centralisé de lead de `src/lib/lead.ts`.
- Le serveur recalcule le score, valide le téléphone, l’e-mail, le consentement, le honeypot et la fréquence d’envoi.
- Le formulaire bloque les doubles clics et utilise un identifiant d’idempotence.
- Calendly est masqué si `NEXT_PUBLIC_CALENDLY_URL` est absent. Les paramètres UTM sont conservés dans le lien.

## Documents privés

La solution choisie est Vercel Blob en mode **Private**. Les PDF sont envoyés directement du navigateur vers Blob à l’aide d’un jeton court généré côté serveur. Le jeton limite le type MIME à `application/pdf`, la taille et le chemin. Un bilan accepte au maximum cinq fichiers.

Sans stockage configuré, les contrôles sont désactivés et l’interface affiche explicitement que l’envoi n’est pas disponible. Aucun document n’est stocké dans Git ou dans un répertoire public.

La route cron `/api/maintenance/purge-documents` supprime les blobs dépassant `LEAD_DOCUMENT_RETENTION_DAYS`. Les liens présents dans l’e-mail VYDA sont signés et expirent après `DOCUMENT_LINK_TTL_HOURS`.

## Variables d’environnement

Copier `.env.example` vers `.env.local`. Ne jamais exposer les variables serveur dans le navigateur.

| Variable | Rôle |
| --- | --- |
| `RESEND_API_KEY` | Envoi de la notification VYDA |
| `LEADS_TO_EMAIL` | Destinataire, recommandé : `contact@vyda.ch` |
| `LEADS_FROM_EMAIL` | Expéditeur vérifié dans Resend |
| `LEADS_WEBHOOK_URL` | Livraison CRM facultative |
| `BLOB_READ_WRITE_TOKEN` | Accès au store Blob privé |
| `BLOB_STORE_ID` | Identifiant du store pour l’authentification OIDC |
| `DOCUMENT_MAX_SIZE_MB` | Limite par PDF, `10` par défaut |
| `LEAD_DOCUMENT_RETENTION_DAYS` | Conservation, `30` jours par défaut |
| `DOCUMENT_LINK_TTL_HOURS` | Expiration des liens privés, `72` h par défaut |
| `CRON_SECRET` | Protection de la route de purge |
| `NEXT_PUBLIC_CALENDLY_URL` | URL Calendly facultative |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Tag Google Ads facultatif |
| `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_TARGET` | Conversion Google Ads facultative |

## Déploiement Vercel

1. Importer `salamfadis-ops/assurance-dentaire-ch` dans Vercel.
2. Définir les variables d’environnement pour Production et Preview.
3. Dans **Storage**, créer un store Blob avec l’accès **Private** et le connecter au projet.
4. Vérifier le domaine expéditeur dans Resend et renseigner `RESEND_API_KEY` et `LEADS_FROM_EMAIL`.
5. Définir un `CRON_SECRET` aléatoire. Le cron de purge est déclaré dans `vercel.json`.
6. Ajouter `NEXT_PUBLIC_CALENDLY_URL` uniquement si le calendrier VYDA est prêt.
7. Déployer, puis tester un lead de rappel, un bilan et un PDF de moins de 10 Mo.

Sans Resend ni webhook, l’API accepte les tests en développement mais renvoie une erreur explicite en production afin de ne jamais perdre silencieusement un lead.

## Rapports

- La version prospect contient le score, les points forts, les points à vérifier, les recommandations et le disclaimer.
- La version conseiller contient les coordonnées, toutes les réponses, les sous-scores, les risques, les documents disponibles, la source et la préférence de contact.
- L’e-mail VYDA joint les rapports générés ; les documents du prospect restent privés et sont fournis par liens temporaires.
