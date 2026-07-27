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

La solution choisie est Vercel Blob en mode **Private**. Les PDF sont envoyés directement du navigateur vers Blob à l’aide d’un jeton court généré côté serveur. Le jeton limite le type MIME à `application/pdf`, la taille et le chemin. Un bilan accepte au maximum cinq fichiers. Avant l’envoi des notifications, `/api/leads` conserve également une copie JSON privée et idempotente du lead. Si Resend et le webhook échouent, cette copie permet de répondre `202` sans perdre la demande.

Sans stockage configuré, les contrôles sont désactivés et l’interface affiche explicitement que l’envoi n’est pas disponible. Aucun document n’est stocké dans Git ou dans un répertoire public.

La route cron `/api/maintenance/purge-documents` supprime les blobs dépassant `LEAD_DOCUMENT_RETENTION_DAYS`. Les liens présents dans l’e-mail VYDA sont signés et expirent après `DOCUMENT_LINK_TTL_HOURS`.

## Variables d’environnement

Copier `.env.example` vers `.env.local`. Ne jamais exposer les variables serveur dans le navigateur.

| Variable | Rôle |
| --- | --- |
| `RESEND_API_KEY` | Clé serveur Resend. Requise si Resend est le canal de livraison |
| `RESEND_FROM_EMAIL` | Adresse expéditrice obligatoire, appartenant à un domaine vérifié dans Resend |
| `LEAD_NOTIFICATION_EMAIL` | Destinataire obligatoire des notifications de nouveaux leads |
| `LEADS_WEBHOOK_URL` | Alternative à Resend : endpoint HTTPS du CRM |
| `BLOB_READ_WRITE_TOKEN` | Accès au store Blob privé avec un token read-write |
| `VERCEL_OIDC_TOKEN` | Alternative au token read-write, injectée automatiquement par Vercel quand OIDC est activé |
| `BLOB_STORE_ID` | Identifiant du store, obligatoire avec `VERCEL_OIDC_TOKEN` |
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
   Les trois variables Resend sont obligatoires pour ce canal ; `LEADS_WEBHOOK_URL` peut servir d’alternative. Le store Blob est fortement recommandé comme sauvegarde de secours.
3. Dans **Storage**, créer un store Blob avec l’accès **Private** et le connecter au projet.
4. Vérifier le domaine expéditeur dans Resend et renseigner `RESEND_API_KEY`, `RESEND_FROM_EMAIL` et `LEAD_NOTIFICATION_EMAIL`.
5. Définir un `CRON_SECRET` aléatoire. Le cron de purge est déclaré dans `vercel.json`.
6. Ajouter `NEXT_PUBLIC_CALENDLY_URL` uniquement si le calendrier VYDA est prêt.
7. Déployer, puis tester un lead de rappel, un bilan et un PDF de moins de 10 Mo.

L’upload accepte exactement l’une de ces configurations :

- `BLOB_READ_WRITE_TOKEN` ;
- ou `VERCEL_OIDC_TOKEN` avec `BLOB_STORE_ID`.

La route `/api/uploads` expose uniquement le mode disponible et les noms des
variables absentes. Elle ne renvoie et ne journalise jamais leur valeur.

Une méthode de livraison au minimum doit être configurée :

- Resend : `RESEND_API_KEY`, un `RESEND_FROM_EMAIL` autorisé par Resend et `LEAD_NOTIFICATION_EMAIL` ;
- ou webhook : `LEADS_WEBHOOK_URL`.

La livraison Resend n'utilise aucune adresse par défaut : si une des trois
variables manque, elle est annulée et l'erreur de configuration est journalisée.

Sans canal configuré, `/api/leads` répond avec le code explicite
`LEAD_DELIVERY_NOT_CONFIGURED` et le statut HTTP `424`. Si un canal est configuré
mais refuse la requête ou ne répond pas, la route renvoie
`LEAD_DELIVERY_FAILED` avec le statut HTTP `502`. La route ne transforme plus
tous les défauts de configuration et de fournisseur en erreur générique `503`.

## Rapports

- La version prospect contient le score, les points forts, les points à vérifier, les recommandations et le disclaimer.
- La version conseiller contient les coordonnées, toutes les réponses, les sous-scores, les risques, les documents disponibles, la source et la préférence de contact.
- L’e-mail VYDA joint les rapports générés ; les documents du prospect restent privés et sont fournis par liens temporaires.
