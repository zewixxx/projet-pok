# Story 3.1: Afficher les ranges recommandees et comparer la decision jouee

Status: done

## Story

As a joueur MTT qui veut progresser techniquement,
I want voir les ranges recommandees par position et comparer mon action a la range attendue,
so that j'identifie clairement mes ecarts de decision.

## Acceptance Criteria

1. **Given** une main ouverte en review, **When** l'utilisateur active l'affichage des ranges, **Then** les ranges recommandees par position sont visibles dans le contexte de la main, **And** la lecture reste comprehensible pour un niveau debutant/intermediaire (FR16).
2. **Given** une action jouee par l'utilisateur, **When** la comparaison est effectuee, **Then** le systeme montre l'ecart entre action jouee et plage attendue, **And** explicite si la decision est conforme ou deviante (FR17).

## Tasks / Subtasks

- [x] Ajouter un utilitaire de comparaison action jouee vs range recommandee.
- [x] Inferer une position simple a partir des metadonnees disponibles de la main.
- [x] Afficher dans la review: position, action jouee, range recommandee et verdict.
- [x] Ajouter des tests sur cas conforme et cas deviant.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Ajout de `buildRangeReview` dans `src/features/review/lib/range-review.js`.
- Ajout des tests dans `src/features/review/lib/range-review.test.mjs`.
- Integration du panneau `Comparateur de range` dans `TournamentReviewPanel`.
- Ajout des styles de `range-panel` dans `src/App.css`.

### File List

- `src/features/review/lib/range-review.js`
- `src/features/review/lib/range-review.test.mjs`
- `src/features/review/components/tournament-review-panel.tsx`
- `src/App.css`
