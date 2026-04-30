# Story 1.1: Set up initial project from starter template

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a joueur MTT utilisateur desktop,
I want une application Projet-pok initialisee en local avec configuration des chemins d'acces,
so that je peux commencer a utiliser le produit offline de facon fiable.

## Acceptance Criteria

1. **Given** un poste Windows cible MVP sans dependance cloud, **When** le projet est initialise via `npm create tauri-app@latest projet-pok -- --template react-ts` puis dependances installees, **Then** la structure frontend/backend est operationnelle pour execution locale, **And** les scripts de dev/build permettent de lancer l'application en environnement local.
2. **Given** un utilisateur qui ouvre l'application pour la premiere fois, **When** il accede aux parametres de base, **Then** il peut enregistrer un chemin de dossier HH valide, **And** ce chemin est conserve localement pour les imports suivants.
3. **Given** le mode local-first requis, **When** l'application est en execution sans connexion internet, **Then** les fonctions coeur deja initialisees restent disponibles, **And** aucune dependance cloud n'est necessaire.

## Tasks / Subtasks

- [ ] Initialiser le projet Tauri React TypeScript dans le workspace (AC: 1)
  - [x] Executer la commande d'init recommandee (`npm create tauri-app@latest ... -- --template react-ts`)
  - [x] Installer les dependances frontend et CLI Tauri si necessaire
  - [ ] Verifier le demarrage local (`npm run tauri dev`) et le build de base
- [x] Verifier et aligner la structure projet avec l'architecture cible (AC: 1)
  - [x] Conserver la separation `src/` (frontend) et `src-tauri/` (backend natif)
  - [x] Mettre en place les points d'entree app (`main.tsx`, routing de base)
  - [x] Poser les fichiers de config minimaux attendus (vite/tsconfig/tauri conf)
- [x] Ajouter la configuration locale des chemins d'import (AC: 2)
  - [x] Creer un stockage local simple de preferences (MVP local)
  - [x] Ajouter un ecran ou panneau de parametres minimal pour definir le chemin HH
  - [x] Persister et relire le chemin au redemarrage
- [ ] Verifier les garde-fous offline/local-first (AC: 3)
  - [x] Confirmer qu'aucun appel externe obligatoire n'est requis au demarrage
  - [ ] Verifier que l'app s'ouvre et reste utilisable sans internet
  - [x] Documenter les limitations eventuelles pour prochaines stories
- [ ] Ajouter les tests et checks minimaux de qualite (AC: 1,2,3)
  - [x] Test unitaire basique de persistence du chemin local
  - [x] Test d'integration de chargement de configuration au startup
  - [x] Verifier que les conventions de nommage/projet sont respectees

## Dev Notes

- Story source: Epic 1 / Story 1.1 dans `epics.md`.
- FR cibles: FR41, FR42, FR45.
- NFR impacts: NFR6 (pas d'envoi externe implicite), NFR12 (base de continuite pour updates), NFR17 (base scalable).
- Aucun previous story file (premiere story du sprint).

### Project Structure Notes

- Stack imposee: Tauri + React TypeScript (starter officiel).
- Boundaries a respecter des maintenant:
  - Frontend uniquement dans `src/`
  - Backend natif Tauri uniquement dans `src-tauri/`
  - Communication via commandes Tauri typees (pas d'acces direct backend hors bridge)
- Nommage impose:
  - Components: `PascalCase`
  - Fichiers frontend: `kebab-case`
  - Payloads/contracts: `camelCase`
- L'init ne doit pas creer d'infra non necessaire a cette story (pas de schema complet DB a ce stade).

### Developer Context (Guardrails)

- **Do not reinvent:** utiliser le starter officiel, ne pas re-scaffold manuellement la stack.
- **Do not overbuild:** cette story initialise et valide la base locale; ne pas implementer import parser complet ici.
- **Offline-first strict:** aucune fonctionnalite critique de bootstrap ne depend d'un service distant.
- **UX baseline:** garder une base compatible Theme A/shadcn pour la suite, sans viser la finition visuelle complete dans cette story.
- **Future compatibility:** preparer les points d'extension pour TanStack Query + Zustand, sans les sur-configurer prematurement.

### Library / Framework Requirements

- `create-tauri-app` en version stable recente (`@latest`) ; la release 4.7.0 est publiee et valide le template `react-ts`.
- Commande recommandee (npm 7+): `npm create tauri-app@latest projet-pok -- --template react-ts`.
- Verifier les scripts dev/build disponibles immediatement apres init.

### Testing Requirements

- Validation manuelle:
  - lancement app desktop en dev
  - relance app et conservation du chemin HH
  - verification mode offline (sans internet)
- Tests minimaux automatiques:
  - test persistence configuration locale
  - test chargement config au startup
- Aucun merge sans preuve que l'app demarre et que la config locale persiste.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` - Epic 1 / Story 1.1]
- [Source: `_bmad-output/planning-artifacts/architecture.md` - Starter Template Evaluation / Selected Starter / Initialization Command]
- [Source: `_bmad-output/planning-artifacts/architecture.md` - API & Communication Patterns / Structure Patterns / Naming Patterns]
- [Source: `_bmad-output/planning-artifacts/prd.md` - FR41, FR42, FR45]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - Design System Foundation / Accessibility baseline]
- [Source: [create-tauri-app GitHub](https://github.com/tauri-apps/create-tauri-app), [Tauri Create Project docs](https://tauri.app/start/create-project)]

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Debug Log References

- Sprint source: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Story key auto-detect: `1-1-set-up-initial-project-from-starter-template`

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Questions/clarifications differes:
  - Prefere-tu stocker le chemin HH via store frontend (ex: localStorage) ou via backend Tauri (fichier de config local) des Story 1.1 ?
  - Souhaites-tu poser des maintenant la base TanStack Query + Zustand, ou la deferer a Story 1.2 ?
- Implementation executee dans `C:\Users\gaetan.salber.ext\projet-pok` avec remplacement du template Tauri par une base app locale-first minimale.
- Ajout d'une navigation de base (Dashboard / Parametres), d'un indicateur online/offline, et d'une persistence locale du chemin HH.
- Ajout de tests minimaux sur la persistence (`preferences.test.mjs`).
- Blocage environnement detecte: `tauri dev` ne peut pas aboutir sur ce poste car `link.exe` (MSVC Build Tools) est indisponible.
- HALT applique tant que l'outillage C++ Windows n'est pas disponible; reprise immediate possible apres deblocage IT.

### File List

- `_bmad-output/implementation-artifacts/1-1-set-up-initial-project-from-starter-template.md`
- `C:\Users\gaetan.salber.ext\projet-pok\src\App.tsx`
- `C:\Users\gaetan.salber.ext\projet-pok\src\App.css`
- `C:\Users\gaetan.salber.ext\projet-pok\src\lib\preferences.js`
- `C:\Users\gaetan.salber.ext\projet-pok\src\lib\preferences.d.ts`
- `C:\Users\gaetan.salber.ext\projet-pok\src\lib\preferences.test.mjs`

## Change Log

- 2026-04-23: Remplacement du template de bienvenue par une base applicative locale-first.
- 2026-04-23: Ajout panneau Parametres pour chemin HH avec sauvegarde locale et rechargement au startup.
- 2026-04-23: Ajout tests minimaux de persistence.
- 2026-04-23: Story maintenue `in-progress` en raison d'un blocage environnement (`link.exe` manquant) sur validation Tauri desktop.
