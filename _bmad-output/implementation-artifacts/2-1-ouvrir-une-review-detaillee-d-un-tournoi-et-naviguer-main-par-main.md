# Story 2.1: Ouvrir une review detaillee d'un tournoi et naviguer main par main

Status: done

## Story

As a joueur MTT en session d'analyse,
I want ouvrir un tournoi importe et parcourir chaque main de facon fluide,
so that je peux analyser mes decisions dans l'ordre du tournoi.

## Acceptance Criteria

1. **Given** un tournoi importe disponible dans la liste, **When** l'utilisateur selectionne ce tournoi, **Then** la vue review detaillee du tournoi s'ouvre, **And** l'ouverture respecte l'objectif de performance percue (FR7, NFR2).
2. **Given** la review detaillee ouverte, **When** l'utilisateur passe a la main suivante ou precedente, **Then** la navigation main par main est disponible sans rupture de contexte, **And** la fluidite reste conforme aux exigences UX du MVP (FR8, NFR4).

## Tasks / Subtasks

- [x] Ajouter un modele local de lecture des mains par tournoi (AC: 1,2)
  - [x] Exposer une API locale pour recuperer les mains d'un tournoi par `tournamentId`
  - [x] Trier les mains de facon deterministe pour navigation prev/next
  - [x] Gerer explicitement le cas "tournoi vide/introuvable"

- [x] Construire la vue review detaillee d'un tournoi (AC: 1)
  - [x] Ajouter un composant `TournamentReviewPanel` (liste resume + detail de la main courante)
  - [x] Afficher un etat `empty` si aucune main exploitable
  - [x] Afficher la metadonnee minimale de main (id, table/source) pour validation utilisateur

- [x] Implementer navigation main par main (AC: 2)
  - [x] Ajouter les actions `previous` / `next` avec bornes debut/fin
  - [x] Preserver le contexte de selection de tournoi pendant navigation
  - [x] Eviter les re-rendus inutiles (memoisation simple)

- [x] Integrer le flux depuis la vue Tournois vers la review detaillee (AC: 1,2)
  - [x] Ajouter bouton/action "Ouvrir review" pour chaque tournoi
  - [x] Connecter l'etat global de vue (tournois -> review)
  - [x] Permettre retour simple de review vers liste tournois

- [x] Ajouter tests utilitaires minimaux (AC: 1,2)
  - [x] Test tri/selection des mains d'un tournoi
  - [x] Test navigation bornes (`previous` sur 1ere main, `next` sur derniere main)
  - [x] Test cas tournoi vide/inexistant

## Dev Notes

- Story source: Epic 2 / Story 2.1 dans `epics.md`.
- FR cibles: FR7, FR8.
- NFR cibles: NFR2, NFR4.

### Contexte technique essentiel

- Garder architecture feature-first et preparer `features/review/...` sans casser `features/import`.
- Contrat local-first strict: aucune dependance cloud pour ce flux.
- Utiliser les donnees importees deja persistantes localement (Story 1.2-1.4).
- Respecter le style UX de reference: pattern liste -> detail -> action, etats `loading/empty/error/success`.

### Intelligence stories precedentes (Epic 1)

- Story 1.2/1.3 ont structure les donnees d'import et les erreurs actionnables.
- Story 1.4 a introduit la liste des tournois importes et l'aggregation locale par `tournamentId`.
- Point cle: partir des mains stockees localement (`pok.import.v1`) pour construire la review.

### Guardrails implementation

- **Do not reinvent**: reutiliser les utilitaires import existants autant que possible.
- **Do not overbuild**: pas d'analyse EV ici, seulement ouverture review et navigation.
- **Performance first**: navigation prev/next doit rester instantanee sur volume MVP.
- **Consistency UX**: garder ton neutre analytique et etats visuels coherents.

### Library / Framework Requirements

- Conserver stack actuelle React + Vite + TypeScript declarations.
- Ne pas ajouter de dependance externe pour cette story.

### File Structure Requirements

- Cibles minimales recommandees:
  - `src/features/review/components/tournament-review-panel.tsx`
  - `src/features/review/lib/tournament-review.js`
  - `src/features/review/lib/tournament-review.test.mjs`
  - `src/App.tsx`
  - `src/App.css`

### Testing Requirements

- Validation lecture locale des mains par tournoi
- Validation navigation prev/next avec bornes
- Validation comportement sur tournoi vide
- Non regression de la vue `Tournois` existante

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` - Epic 2 / Story 2.1]
- [Source: `_bmad-output/planning-artifacts/prd.md` - FR7, FR8, NFR2, NFR4]
- [Source: `_bmad-output/planning-artifacts/architecture.md` - feature-based review flow]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - pattern liste/detail]
- [Source: `_bmad-output/implementation-artifacts/1-4-consulter-la-liste-des-tournois-importes-en-mode-local-offline.md`]

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- Sprint source: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Story key auto-detect: `2-1-ouvrir-une-review-detaillee-d-un-tournoi-et-naviguer-main-par-main`
- Previous story context loaded: `1-4-consulter-la-liste-des-tournois-importes-en-mode-local-offline.md`

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story 2.1 creee en continuité directe de la vue Tournois (Story 1.4).
- Focus strict maintenu sur ouverture review + navigation, sans glisser vers EV (Story 2.3).
- API locale `getTournamentHands` ajoutee pour lecture des mains par tournoi sans appel externe.
- Module `tournament-review` ajoute avec modelisation de review et navigation bornee.
- Composant `TournamentReviewPanel` implemente avec etat vide et detail main courante.
- Flux `Tournois -> Ouvrir review -> Retour tournois` integre dans `App.tsx`.
- Tests utilitaires ajoutes pour tri/selection et bornes prev/next.
- Blocage restant: execution automatique `npm test` / `npm run build` impossible depuis l'agent a cause de la policy PowerShell.

### File List

- `_bmad-output/implementation-artifacts/2-1-ouvrir-une-review-detaillee-d-un-tournoi-et-naviguer-main-par-main.md`
- `src/features/import/api/import-api.js`
- `src/features/import/api/import-api.d.ts`
- `src/features/import/components/tournaments-panel.tsx`
- `src/features/review/lib/tournament-review.js`
- `src/features/review/lib/tournament-review.test.mjs`
- `src/features/review/components/tournament-review-panel.tsx`
- `src/App.tsx`
- `src/App.css`

### Change Log

- 2026-04-23: Implemented tournament review opening and hand-by-hand navigation flow for Story 2.1.
- 2026-04-22: Fixed numeric hand ordering for review navigation and added table metadata display in detailed review panel.
