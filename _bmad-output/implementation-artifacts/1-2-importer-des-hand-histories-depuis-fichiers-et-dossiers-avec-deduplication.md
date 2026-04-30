# Story 1.2: Importer des hand histories depuis fichiers et dossiers avec deduplication

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a joueur MTT en review,
I want importer mes HH depuis un ou plusieurs fichiers et depuis un dossier configure,
so that je peux alimenter rapidement ma base de mains sans doublons.

## Acceptance Criteria

1. **Given** un ou plusieurs fichiers HH selectionnes par l'utilisateur, **When** l'import est lance, **Then** le systeme ingere les mains lisibles depuis ces fichiers, **And** les mains invalides sont isolees sans interrompre l'import global (FR1, FR4, NFR10).
2. **Given** un dossier d'import configure, **When** l'utilisateur declenche l'import depuis ce dossier, **Then** le systeme traite les fichiers HH presents, **And** applique les memes regles de validation que l'import par fichiers (FR2).
3. **Given** des mains deja importees dans la base locale, **When** une nouvelle operation d'import contient des doublons, **Then** les doublons sont detectes et ignores, **And** seules les nouvelles mains valides sont ajoutees (FR3, NFR9).

## Tasks / Subtasks

- [x] Mettre en place la structure feature import cote frontend (AC: 1,2,3)
  - [x] Creer `src/features/import/` avec `components`, `hooks`, `api`, `schemas` conformes a l'architecture
  - [x] Ajouter un ecran import minimal (selection fichiers + import dossier configure)
  - [x] Integrer cette vue dans la navigation existante sans casser Dashboard/Parametres

- [x] Implementer le parser HH minimal pour fichiers PokerStars-like (AC: 1)
  - [x] Definir une fonction de parsing qui decoupe les mains par `PokerStars Hand #...`
  - [x] Isoler les mains invalides avec raison d'echec (format absent, header invalide, contenu vide)
  - [x] Retourner une enveloppe standardisee `{ data, error, meta }` cote API frontend

- [x] Implementer import depuis fichiers selectionnes (AC: 1)
  - [x] Lire les fichiers texte/HH via API web (`File`, `FileReader`) pour mode navigateur
  - [x] Lancer parsing sur chaque fichier et agreger les resultats
  - [x] Garantir que les erreurs d'un fichier ne bloquent pas l'import des autres (NFR10)

- [x] Implementer import depuis dossier configure (AC: 2)
  - [x] Reutiliser le chemin HH sauvegarde en Story 1.1 comme source de configuration
  - [x] Ajouter un mode "import dossier configure" avec fallback explicite si non disponible en environnement web securise
  - [x] Aligner comportement/validation sur l'import multi-fichiers

- [x] Implementer deduplication des mains (AC: 3)
  - [x] Definir une cle de dedup (ex: hand id extrait du header)
  - [x] Exclure les mains deja connues dans le meme batch et dans l'historique local
  - [x] Conserver uniquement les mains nouvelles valides

- [x] Persister localement les mains importees (AC: 1,3)
  - [x] Ajouter un stockage local MVP (localStorage/indexedDB simple) avec separation `rawHands` et metadonnees d'import
  - [x] Preserver l'integrite des donnees importees en cas d'erreur partielle (NFR9)
  - [x] Preparer la migration future vers SQLite sans casser le contrat de donnees

- [x] Ajouter feedback UX import (AC: 1,2,3)
  - [x] Afficher etats `loading/empty/error/success` standardises
  - [x] Fournir messages actionnables en cas d'erreur de parsing
  - [x] Respecter le ton UX neutre analytique et les couleurs semantiques Theme A

- [x] Ajouter tests minimaux (AC: 1,2,3)
  - [x] Test unitaire parser: extraction de mains valides + detection invalides
  - [x] Test unitaire deduplication: doublons intra-batch et historiques
  - [x] Test integration flux import: fichier valide + invalide + continuité du traitement

## Dev Notes

- Story source: Epic 1 / Story 1.2 dans `epics.md`.
- FR cibles: FR1, FR2, FR3, FR4.
- NFR cibles: NFR9, NFR10, NFR13, NFR14.

### Contexte technique essentiel

- Architecture imposee:
  - feature-first frontend (`features/import/...`)
  - separation frontend/backend claire (meme si backend Tauri complet differe sur poste securise)
  - format reponse standard `{ data, error, meta }`
  - erreurs standardisees `{ code, message, details? }`
- Pipeline attendu:
  - Fichier HH -> parser/normalizer -> stockage local -> stats d'import
- Ne pas introduire de dependance externe inutile pour cette story (parser maison minimal suffit).

### Intelligence story precedente (1.1)

- La base app locale-first est deja en place (`Dashboard`, `Parametres`, persistence du chemin HH).
- Limitation connue: compilation Tauri desktop bloquee par `link.exe` manquant sur poste securise.
- Implication: implementer la story 1.2 de facon compatible navigateur (`npm run dev`) avec abstraction permettant bascule Tauri plus tard.

### Guardrails implementation

- **Do not reinvent**: reutiliser le module de preferences existant pour chemin HH.
- **Do not overbuild**: parser minimal et fiable d'abord; ne pas implémenter moteur GTO/EV ici.
- **Resilience first**: erreur fichier/main ne doit jamais stopper tout le lot.
- **Dedup explicite**: utiliser une cle stable (hand id) et tracer compte `new/duplicate/invalid`.
- **UX stricte**: loading/error/success uniformes, messages orientés action.

### Library / Framework Requirements

- Conserver stack actuelle React + Vite.
- Eviter ajout de lib de parsing lourde.
- Si ajout de dep necessaire (ex: schema validator), demander validation utilisateur avant.

### File Structure Requirements

- Cible minimale recommandee:
  - `src/features/import/components/import-panel.tsx`
  - `src/features/import/hooks/use-hh-import.ts`
  - `src/features/import/api/import-api.ts`
  - `src/features/import/schemas/hand-history-schema.ts`
  - `src/features/import/lib/hh-parser.ts`
  - `src/features/import/lib/dedup.ts`
- Respecter nommage `kebab-case` (fichiers) et `PascalCase` (composants).

### Testing Requirements

- Parser:
  - detecte mains valides
  - rejette mains mal formatees avec raison
- Dedup:
  - doublon meme batch
  - doublon deja importe
- Flux:
  - au moins un fichier invalide n'empeche pas les autres fichiers valides d'etre importes
- Regression:
  - verifier que les ecrans Story 1.1 restent fonctionnels

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` - Epic 1 / Story 1.2]
- [Source: `_bmad-output/planning-artifacts/architecture.md` - Import pipeline, feature structure, response/error formats]
- [Source: `_bmad-output/planning-artifacts/prd.md` - FR1 FR2 FR3 FR4 + NFR9 NFR10 NFR13 NFR14]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - feedback patterns, loading/empty/error, Theme A]
- [Source: `_bmad-output/implementation-artifacts/1-1-set-up-initial-project-from-starter-template.md`]

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- Sprint source: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Story key auto-detect: `1-2-importer-des-hand-histories-depuis-fichiers-et-dossiers-avec-deduplication`
- Previous story context loaded: `1-1-set-up-initial-project-from-starter-template.md`
- Validation command attempt blocked by PowerShell execution policy on secure machine.
- Correct-course reference loaded: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-22.md`.

### Completion Notes List

- Structure feature import ajoutee: `components`, `hooks`, `api`, `schemas`, `lib`.
- Ecran `Import HH` ajoute dans la navigation avec import fichiers et tentative import dossier configure.
- Parser HH PokerStars-like implemente avec isolation des mains invalides et raisons d'echec.
- Deduplication implementee (historique local + doublons intra-batch) par `handId`.
- Persistence locale implementee via `localStorage` (`pok.import.v1`) avec historique des imports.
- Tests `.test.mjs` ajoutes pour parser, dedup et flux d'import.
- Blocage restant: execution automatique des commandes `npm test`/`npm run build` impossible depuis l'agent a cause de la policy PowerShell.
- Import partiel explicite implemente: `PARTIAL_IMPORT` si erreurs de lecture fichier ou mains invalides detectees.
- UI import mise a jour pour distinguer succes complet vs import partiel (warning persistant + message actionnable).
- API import rendue testable via injection de storage optionnelle pour eviter mutation fragile de `globalThis.localStorage`.
- Tests import API renforces pour verifier le comportement "partial import" avec fichier invalide et fichier illisible.
- Contrat TypeScript hook aligne avec UI: `result.meta.parseErrors` ajoute dans `use-hh-import.d.ts`.
- Meta API harmonisee pour `NO_FILES_SELECTED`: `fileCount` et `parseErrors` sont retournes comme pour les autres cas.
- Test additionnel ajoute pour verrouiller la coherence de meta quand aucun fichier n'est selectionne.

### File List

- `_bmad-output/implementation-artifacts/1-2-importer-des-hand-histories-depuis-fichiers-et-dossiers-avec-deduplication.md`
- `src/App.tsx`
- `src/App.css`
- `src/features/import/components/import-panel.tsx`
- `src/features/import/hooks/use-hh-import.js`
- `src/features/import/hooks/use-hh-import.d.ts`
- `src/features/import/api/import-api.js`
- `src/features/import/api/import-api.d.ts`
- `src/features/import/api/import-api.test.mjs`
- `src/features/import/lib/hh-parser.js`
- `src/features/import/lib/hh-parser.d.ts`
- `src/features/import/lib/hh-parser.test.mjs`
- `src/features/import/lib/dedup.js`
- `src/features/import/lib/dedup.d.ts`
- `src/features/import/lib/dedup.test.mjs`
- `src/features/import/schemas/hand-history-schema.ts`
- `package.json`

### Change Log

- 2026-04-22: Applied approved correct-course fixes for Story 1.2 (partial import signaling, UI warning states, test hardening).
- 2026-04-23: Follow-up fixes after code-review (TS contract alignment + consistent NO_FILES_SELECTED meta + regression test).
