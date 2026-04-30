# Story 4.1: Detecter et classer les leaks recurrents

Status: done

## Story

As a joueur MTT focalise sur le ROI de progression,
I want detecter mes leaks recurrents et les classer par gravite/frequence/impact EV,
so that je sais quoi corriger en priorite.

## Acceptance Criteria

1. **Given** un ensemble de mains analysees, **When** le moteur de leaks est execute, **Then** les leaks recurrents sont identifies automatiquement, **And** relies aux patterns de decisions constates (FR21).
2. **Given** des leaks detectes, **When** la priorisation est calculee, **Then** les leaks sont classes par gravite, frequence et impact EV potentiel, **And** la methode de classement est coherente et stable (FR22, FR23, FR24).

## Tasks / Subtasks

- [x] Ajouter un moteur local de detection de leaks recurrents.
- [x] Estimer un impact EV potentiel et un score de frequence.
- [x] Classer les leaks par gravite/frequence/impact.
- [x] Integrer un panneau de restitution leaks dans la review.
- [x] Ajouter des tests unitaires de ranking.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### File List

- `src/features/review/lib/leak-detector.js`
- `src/features/review/lib/leak-detector.test.mjs`
- `src/features/review/components/tournament-review-panel.tsx`
- `src/App.css`
