# Story 6.2: Historiser les incidents et permettre la reprise du flux

Status: done

## Story

As a joueur MTT qui veut stabiliser son usage,
I want consulter l'historique des incidents et reprendre rapidement ma review,
so that une erreur ponctuelle ne bloque pas ma progression.

## Acceptance Criteria

1. **Given** un ou plusieurs incidents diagnostiques, **When** l'utilisateur ouvre l'historique, **Then** les incidents sont listables avec statut, cause et action appliquee, **And** l'historique est conserve localement (FR40, FR42).
2. **Given** une erreur sur fichier ou main pendant un flux global, **When** le systeme rencontre cette erreur, **Then** l'execution globale continue autant que possible, **And** l'utilisateur peut reprendre son flux de review apres correction (NFR10, NFR9).

## Tasks / Subtasks

- [x] Ajouter stockage local de l'historique diagnostic.
- [x] Ajouter etat de reprise du flux (nextView + reason).
- [x] Integrer actions UI relancer diagnostic / reprendre flux.
- [x] Afficher historique incident dans DiagnosticPanel.
- [x] Ajouter tests unitaires.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### File List

- `src/features/diagnostic/lib/diagnostic-history.js`
- `src/features/diagnostic/lib/diagnostic-history.test.mjs`
- `src/features/diagnostic/components/diagnostic-panel.tsx`
- `src/App.css`
