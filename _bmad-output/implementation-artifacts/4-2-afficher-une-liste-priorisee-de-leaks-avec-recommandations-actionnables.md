# Story 4.2: Afficher une liste priorisee de leaks avec recommandations actionnables

Status: done

## Story

As a joueur MTT qui veut un plan concret,
I want consulter une liste priorisee de leaks et des recommandations ciblees,
so that je transforme l'analyse en actions de revision immediates.

## Acceptance Criteria

1. **Given** des leaks classes par priorite, **When** l'utilisateur ouvre la vue leaks, **Then** il accede a une liste priorisee claire, **And** chaque item presente au minimum gravite, impact EV et confiance (FR25).
2. **Given** un leak selectionne, **When** l'utilisateur consulte son detail, **Then** le systeme propose des recommandations d'amelioration concretes, **And** indique ce qu'il faut reviser en priorite pour ce leak (FR26, FR27).
3. **Given** des erreurs heterogenes dans l'historique, **When** la synthese est calculee, **Then** le systeme distingue erreurs structurelles et ponctuelles, **And** adapte la priorite en consequence (FR28).

## Tasks / Subtasks

- [x] Etendre le moteur de leaks avec score de priorite.
- [x] Ajouter confiance et type de pattern (structural/ponctual).
- [x] Ajouter recommandations actionnables par leakType.
- [x] Integrer la liste priorisee dans la review.
- [x] Ajouter tests unitaires.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### File List

- `src/features/review/lib/leak-detector.js`
- `src/features/review/lib/leak-detector.test.mjs`
- `src/features/review/components/tournament-review-panel.tsx`
