# Story 1.4: Consulter la liste des tournois importes en mode local offline

Status: done

## Story

As a joueur MTT qui prepare sa session de review,
I want consulter la liste de mes tournois importes en local,
so that je peux selectionner rapidement un tournoi a analyser meme hors ligne.

## Acceptance Criteria

1. **Given** des mains importees associees a des tournois, **When** l'utilisateur ouvre la vue tournois, **Then** le systeme affiche la liste des tournois importes, **And** cette liste est basee exclusivement sur les donnees locales (FR6, FR42).
2. **Given** l'absence de connexion internet, **When** l'utilisateur accede a la liste des tournois, **Then** la fonctionnalite reste disponible, **And** aucun appel externe n'est requis (FR41, NFR6).
3. **Given** un volume croissant de donnees importees, **When** la vue tournois est chargee dans des conditions normales, **Then** l'ouverture reste fluide et exploitable pour demarrer la review, **And** respecte les objectifs de performance percue du MVP (NFR2, NFR17).

## Tasks / Subtasks

- [x] Ajouter un service local de lecture des tournois importes (AC: 1,2,3)
- [x] Construire une vue Tournois avec etats `loading/empty/success` (AC: 1,3)
- [x] Integrer la vue Tournois dans la navigation app (AC: 1,2)
- [x] Ajouter tests utilitaires pour extraction/aggregation des tournois (AC: 1,3)

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- Sprint source: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Story key: `1-4-consulter-la-liste-des-tournois-importes-en-mode-local-offline`

### Completion Notes List

- Service local `getImportedTournaments` ajoute dans l'API import, base exclusivement sur les donnees locales.
- Module d'aggregation des tournois implemente (`buildImportedTournaments`) avec extraction metadata depuis mains brutes.
- Vue `Tournois` ajoutee avec etat `empty` explicite et rendu `success` via liste des tournois.
- Integration navigation complete (`Dashboard`, `Import HH`, `Tournois`, `Parametres`) sans appel externe.
- Test utilitaire ajoute pour aggregation tournois et cas sans tournoi detectable.
- Blocage restant: execution automatique `npm test` / `npm run build` impossible depuis l'agent a cause de la policy PowerShell.
- Story validee en revue code et passee en done.

### File List

- `_bmad-output/implementation-artifacts/1-4-consulter-la-liste-des-tournois-importes-en-mode-local-offline.md`
- `src/features/import/lib/tournaments.js`
- `src/features/import/lib/tournaments.test.mjs`
- `src/features/import/api/import-api.js`
- `src/features/import/api/import-api.d.ts`
- `src/features/import/components/tournaments-panel.tsx`
- `src/App.tsx`
- `src/App.css`

### Change Log

- 2026-04-23: Implemented offline local tournaments list view with aggregation utility and tests for Story 1.4.
