# Story 3.3: Integrer les statistiques adverses dans la decision de review

Status: done

## Story

As a joueur MTT qui adapte ses decisions aux profils,
I want voir les stats adverses dans le contexte de la main et filtrer les spots par profil,
so that je compare mes decisions a la dynamique reelle des adversaires.

## Acceptance Criteria

1. **Given** des donnees adverses suffisantes sur les mains reviewees, **When** l'utilisateur ouvre une main, **Then** les stats adverses cles (VPIP, PFR, 3-bet, fold to 3-bet, AF) sont visibles, **And** elles sont contextualisees dans le spot analyse (FR46, FR47).
2. **Given** une analyse decisionnelle en cours, **When** l'utilisateur confronte sa ligne au profil adverse, **Then** il peut comparer sa decision a la dynamique observee, **And** le systeme explicite les limites si echantillon insuffisant (FR48, FR50, NFR16).

## Tasks / Subtasks

- [x] Ajouter un module de calcul de stats adverses sur la main courante.
- [x] Ajouter un indicateur de fiabilite par taille d'echantillon.
- [x] Integrer un panneau stats adverses dans la review detaillee.
- [x] Ajouter un resume de profil de table pour guider la decision.
- [x] Ajouter des tests unitaires.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### File List

- `src/features/review/lib/opponent-stats.js`
- `src/features/review/lib/opponent-stats.test.mjs`
- `src/features/review/components/tournament-review-panel.tsx`
- `src/App.css`
