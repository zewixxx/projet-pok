# Story 4.3: Construire et suivre un plan de travail par leak

Status: done

## Story

As a joueur MTT en progression continue,
I want associer des actions de travail a chaque leak et suivre leur evolution,
so that je mesure l'effet de mes revisions dans le temps.

## Acceptance Criteria

1. **Given** un leak prioritaire affiche, **When** l'utilisateur ajoute une action de travail, **Then** l'action est associee au leak cible, **And** visible dans son plan d'entrainement (FR29).
2. **Given** des actions de travail associees a un leak, **When** l'utilisateur marque les actions completees, **Then** la progression du leak est mise a jour, **And** le suivi reste disponible localement pour les sessions suivantes (FR30, FR42).

## Tasks / Subtasks

- [x] Ajouter un stockage local du plan de travail par leak.
- [x] Ajouter actions `add`, `toggle done`, `progress`.
- [x] Integrer la gestion du plan dans le panneau leaks prioritaires.
- [x] Afficher progression et checklist par leak.
- [x] Ajouter test unitaire sur cycle add/toggle/progress.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### File List

- `src/features/review/lib/leak-plan.js`
- `src/features/review/lib/leak-plan.test.mjs`
- `src/features/review/components/tournament-review-panel.tsx`
- `src/App.css`
