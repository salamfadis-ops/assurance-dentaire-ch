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

La V1 ne conserve aucune donnée côté serveur. Après validation, le formulaire prépare un e-mail adressé à `contact@assurance-dentaire.ch` dans la messagerie de l’utilisateur. Une intégration CRM ou webhook pourra remplacer ce mécanisme sans modifier l’interface du parcours.
