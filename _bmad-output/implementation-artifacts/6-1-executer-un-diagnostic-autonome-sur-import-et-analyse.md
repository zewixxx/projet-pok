# Story 6.1: Executer un diagnostic autonome sur import et analyse

Status: done

## Story

As a joueur MTT confronte a un resultat incoherent,
I want lancer un diagnostic autonome sur mes donnees et calculs,
so that je comprends la cause du probleme sans support externe.

## Acceptance Criteria

1. **Given** une incoherence constatee dans import ou analyse, **When** l'utilisateur lance le mode diagnostic, **Then** le systeme verifie la coherence des donnees importees et des resultats, **And** signale les anomalies detectees de facon explicite (FR36, FR37, FR38).
2. **Given** une anomalie detectee, **When** le resultat diagnostic est presente, **Then** une action corrective concrete est proposee, **And** le format du message distingue clairement cause et solution (FR39, NFR11).

## Tasks / Subtasks

- [x] Ajouter un moteur de diagnostic local.
- [x] Controler cohérence import/hands/IDs/actions Hero.
- [x] Ajouter rapport avec severite + action corrective.
- [x] Integrer une vue Diagnostic dans l'app.
- [x] Ajouter tests unitaires de non-regression.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### File List

- `src/features/diagnostic/lib/diagnostic-engine.js`
- `src/features/diagnostic/lib/diagnostic-engine.test.mjs`
- `src/features/diagnostic/components/diagnostic-panel.tsx`
- `src/App.tsx`
- `src/App.css`
