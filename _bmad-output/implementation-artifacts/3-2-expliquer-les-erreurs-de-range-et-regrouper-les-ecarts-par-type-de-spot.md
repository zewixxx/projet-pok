# Story 3.2: Expliquer les erreurs de range et regrouper les ecarts par type de spot

Status: done

## Story

As a joueur MTT en apprentissage,
I want relier les erreurs de range a des leaks et lire des explications pedagogiques,
so that je comprends pourquoi je perds de l'EV sur des spots recurrents.

## Acceptance Criteria

1. **Given** des ecarts detectes entre decision jouee et range attendue, **When** le diagnostic de decision est affiche, **Then** chaque ecart est relie a un leak identifiable, **And** la relation leak/decision est explicite pour l'utilisateur (FR18).
2. **Given** une erreur de range diagnostiquee, **When** l'utilisateur consulte le detail, **Then** une explication pedagogique orientee correction est fournie, **And** elle reste factuelle et non complaisante (FR19).
3. **Given** plusieurs erreurs de nature similaire, **When** l'utilisateur consulte la synthese d'erreurs, **Then** les erreurs sont regroupees par type de spot, **And** la priorisation des themes de travail est facilitee (FR20).

## Tasks / Subtasks

- [x] Etendre le modele de review range avec `spotType` et `leakType`.
- [x] Ajouter une explication pedagogique (`coachingNote`) pour chaque deviation.
- [x] Ajouter une synthese des deviations regroupees par type de spot.
- [x] Integrer l'affichage dans la review detaillee.
- [x] Ajouter des tests unitaires de non-regression.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### File List

- `src/features/review/lib/range-review.js`
- `src/features/review/lib/range-review.test.mjs`
- `src/features/review/components/tournament-review-panel.tsx`
