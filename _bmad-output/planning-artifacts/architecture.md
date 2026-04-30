---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
inputDocuments:
  - C:\Users\gaetan.salber.ext\Documents\Projet-pok\_bmad-output\planning-artifacts\prd.md
workflowType: 'architecture'
project_name: 'Projet-pok'
user_name: 'Gaetan.salber'
date: '2026-04-23'
lastStep: 8
status: 'complete'
completedAt: '2026-04-23'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
Le produit couvre 50 capacites fonctionnelles structurees autour de 10 domaines: import HH, review tournoi/main par main, analyse EV a la demande, support ranges, detection/priorisation des leaks, coaching, statistiques globales, diagnostic, experience desktop locale et profiling adverse (VPIP/PFR/3-bet/etc).
Architecturalement, cela implique un noyau de traitement de donnees poker local, des services d'analyse reutilisables et une separation nette entre ingestion, calcul, orchestration de review et presentation.

**Non-Functional Requirements:**
Les 18 NFR imposent des exigences fortes sur la performance percue (import, ouverture tournoi, EV on-demand), la fiabilite de traitement (integrite donnees, tolerance aux erreurs), la securite locale (protection des donnees utilisateur), et l'integration des formats HH heterogenes.
Ces contraintes orientent vers une architecture modulaire locale-first, avec pipeline d'import robuste, validation de donnees et services de calcul isolables.

**Scale & Complexity:**
Le projet est un desktop analytique a complexite medium/high: volume de donnees croissant, logique metier specialisee, et forte exigence de lisibilite des resultats pour l'utilisateur.

- Primary domain: desktop analytics application (edtech poker)
- Complexity level: medium/high
- Estimated architectural components: 8-12 composants logiques majeurs

### Technical Constraints & Dependencies

- MVP Windows only, execution locale, fonctionnement offline par defaut.
- Import HH multi-formats avec detection d'erreurs et deduplication.
- Analyse EV declenchee a la demande sur mains ciblees (pas de calcul massif systematique).
- Mise a jour manuelle en MVP, preservation stricte des donnees utilisateur.
- Extensibilite requise post-MVP: nouveaux formats HH, nouvelles plateformes, auto-update.

### Cross-Cutting Concerns Identified

- Data quality governance: validation, normalisation, gestion des incoherences.
- Explainability-by-design: resultats EV et leaks interpretable par l'utilisateur.
- Performance UX: navigation review fluide et temps de reponse maitrises.
- Fault tolerance: erreurs d'import/analyse isolees, sans bloquer le flux global.
- Traceabilite analytique: relier decisions, contextes, stats adverses et recommandations.

## Starter Template Evaluation

### Primary Technology Domain

Desktop application (Windows-first MVP) avec frontend web embarque et backend natif, base sur les exigences de performance locale, traitement de fichiers HH et analyse EV a la demande.

### Starter Options Considered

- **Tauri (official create-tauri-app)**
  Starter maintenu officiellement, compatible React + TypeScript, bon alignement avec une app locale-first orientee performance.
- **Electron (electron-vite / quick-start)**
  Option mature et rapide cote JS/TS, mais plus lourde en empreinte runtime.
- **Wails v3**
  Interessant pour une approche Go-native, mais version v3 encore alpha, moins adaptee a un MVP ou la stabilite prime.

### Selected Starter: create-tauri-app (official)

**Rationale for Selection:**
Le starter officiel Tauri offre un bon equilibre entre maintenabilite, performance percue, footprint applicatif reduit et support desktop moderne.
Il correspond bien au besoin d'un outil de review poker local, oriente traitement de donnees et usage prolonge.

**Initialization Command:**

```bash
npm create tauri-app@latest projet-pok -- --template react-ts
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
Frontend TypeScript/React + backend natif Tauri (Rust), avec pont de commandes securise entre UI et couche native.

**Styling Solution:**
Base React TS sans design system impose; liberte d'ajouter ensuite Tailwind/CSS modules selon les decisions UX.

**Build Tooling:**
Tooling standard Tauri + stack frontend moderne, scripts de dev/build packages pour desktop.

**Testing Framework:**
Base extensible sans verrouillage; strategie de tests a preciser dans les decisions architecture suivantes.

**Code Organization:**
Separation naturelle frontend (`src`) / backend natif (`src-tauri`) favorisant une architecture modulaire.

**Development Experience:**
Workflow dev local avec fenetre desktop native, hot-reload frontend, et commandes standardisees.

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Stockage local principal: SQLite
- Communication interne: commandes Tauri typees frontend/backend
- Chiffrement local des donnees sensibles
- Architecture frontend: React Router + state split (server state/query vs UI/app state)

**Important Decisions (Shape Architecture):**
- Cache EV persistant en base pour eviter les recalculs inutiles
- Logs locaux structures pour diagnostic produit
- Strategie offline-first stricte (pas de dependance cloud en MVP)

**Deferred Decisions (Post-MVP):**
- Crash reporting distant
- Auto-update
- Extension multi-plateforme

### Data Architecture

- **Primary store:** SQLite local
- **Data modeling:** separation explicite entre mains brutes importees, mains normalisees, analyses EV, statistiques agregees, et metriques de leaks
- **Validation strategy:** validation a l'import + normalisation + marquage des anomalies
- **Migration approach:** migrations versionnees au demarrage app
- **Caching strategy:** cache EV en base avec invalidation sur changement de contexte d'analyse

### Authentication & Security

- **Encryption:** chiffrement local des donnees sensibles au repos
- **Authorization:** application mono-utilisateur MVP (pas de RBAC)
- **Security boundary:** aucun envoi externe implicite; toute sortie de donnees doit etre action explicite utilisateur
- **Diagnostic safety:** logs techniques sans exposition de donnees sensibles en clair

### API & Communication Patterns

- **Pattern:** commandes/invocations Tauri typees pour tous les cas d'usage metier
- **Error handling:** enveloppe d'erreurs standardisee (code, contexte, action conseillee)
- **Internal contracts:** contrats stricts UI <-> backend pour import, analyse EV, leaks, stats adverses
- **Rate limiting:** non applicable MVP (local app), mais garde-fous sur analyses couteuses

### Frontend Architecture

- **Routing:** React Router
- **State management split:**
  - TanStack Query pour la donnee serveur-like (IPC/backend)
  - Zustand pour etat UI et orchestration locale
- **Component architecture:** feature-based modules (import, review, ev-analysis, leaks, stats, diagnostic)
- **Performance:** virtualisation listes de mains + calculs EV declenches a la demande

### Infrastructure & Deployment

- **Target platform:** Windows MVP
- **Release strategy:** mise a jour manuelle
- **Logging/Monitoring:** logs locaux structures + outils de diagnostic integres
- **Build pipeline:** packaging desktop reproductible, profils dev/prod separes

### Decision Impact Analysis

**Implementation Sequence:**
1. Initialiser projet via starter Tauri React TS
2. Mettre en place schema SQLite + migrations
3. Implementer pipeline import/validation HH
4. Implementer review main/tournoi
5. Ajouter moteur EV on-demand + cache
6. Ajouter leaks/priorisation + stats adverses
7. Finaliser diagnostic + durcissement securite locale

**Cross-Component Dependencies:**
- Import/normalisation alimente toutes les couches (review, EV, leaks, stats)
- Cache EV depend du modele de donnees normalise
- Diagnostic depend des logs structures et des contrats d'erreurs

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
5 areas where AI agents could make different choices

### Naming Patterns

**Database Naming Conventions:**
- Tables et colonnes en `snake_case` (ex: `player_stats`, `hand_id`)
- Clefs et index en conventions explicites et predecibles (ex: `idx_hands_tournament_id`)

**API Naming Conventions:**
- Payloads et objets de commande en `camelCase` (ex: `handId`, `playerStats`)
- Parametres et proprietes normalises sur l'ensemble des commandes Tauri

**Code Naming Conventions:**
- Composants React en `PascalCase` (ex: `ReviewPanel`)
- Fichiers frontend en `kebab-case` (ex: `review-panel.tsx`)
- Variables/fonctions TypeScript en `camelCase`

### Structure Patterns

**Project Organization:**
- Organisation par feature (`features/import`, `features/review`, `features/ev`, `features/leaks`, `features/stats`, `features/diagnostic`)
- Separation claire UI/frontend et backend natif Tauri

**File Structure Patterns:**
- Tests co-localises (`*.test.ts` / `*.test.tsx`)
- Utilitaires partages dans des modules dedies, pas disperses par convenience locale
- Configuration centralisee avec conventions stables

### Format Patterns

**API Response Formats:**
- Reponse standard: `{ data, error, meta }`
- Erreur standard: `{ code, message, details? }`

**Data Exchange Formats:**
- Dates au format ISO 8601
- Null handling explicite (pas d'ambiguite entre `null`, `undefined` et absence de cle)
- Indicateurs booleens natifs (`true/false`)

### Communication Patterns

**Event System Patterns:**
- Nommage d'evenements stable et descriptif (namespace fonctionnel + action)
- Payloads d'evenement structures et versionnables

**State Management Patterns:**
- `TanStack Query` pour la donnee backend-like / IPC
- `Zustand` pour etat UI local et orchestration
- Mises a jour immuables et predecibles

### Process Patterns

**Error Handling Patterns:**
- Distinction stricte entre erreur technique (logs) et message utilisateur (UX)
- Erreurs recoverables avec action conseillee lorsque possible

**Loading State Patterns:**
- Conventions `isLoading` / `isFetching` harmonisees
- Etats de chargement explicites par feature critique

### Enforcement Guidelines

**All AI Agents MUST:**
- Respecter les conventions de nommage definies (snake_case DB, camelCase payloads, PascalCase composants, kebab-case fichiers).
- Utiliser les formats de reponse/erreur standardises.
- Conserver l'organisation par feature et la separation frontend/backend.

**Pattern Enforcement:**
- Revue code orientee conformite patterns a chaque story
- Correction immediate des violations de convention
- Evolution des patterns uniquement par decision explicite documentee

### Pattern Examples

**Good Examples:**
- Table: `hand_reviews`, colonne: `created_at`
- Payload commande: `{ handId, tournamentId }`
- Composant: `LeakPriorityPanel` dans `leak-priority-panel.tsx`
- Reponse: `{ data: {...}, error: null, meta: {...} }`

**Anti-Patterns:**
- Melanger `snake_case` et `camelCase` dans un meme payload
- Reponses heterogenes selon les features
- Fichiers et composants avec conventions contradictoires
- Etats de chargement non standardises d'une feature a l'autre

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
projet-pok/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
├── .env.example
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── src/
│   ├── app/
│   │   ├── main.tsx
│   │   ├── router.tsx
│   │   ├── providers.tsx
│   │   └── layout/
│   │       ├── app-shell.tsx
│   │       └── app-header.tsx
│   ├── routes/
│   │   ├── dashboard.tsx
│   │   ├── tournaments.tsx
│   │   ├── hand-review.tsx
│   │   ├── leaks.tsx
│   │   ├── stats.tsx
│   │   └── diagnostics.tsx
│   ├── features/
│   │   ├── import/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   ├── schemas/
│   │   │   └── api/
│   │   ├── review/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── api/
│   │   ├── ev-analysis/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── api/
│   │   ├── leaks/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── api/
│   │   ├── stats/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── api/
│   │   ├── opponent-profiling/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── api/
│   │   └── diagnostics/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── api/
│   ├── components/
│   │   ├── ui/
│   │   └── shared/
│   ├── stores/
│   │   ├── app-store.ts
│   │   └── ui-store.ts
│   ├── services/
│   │   ├── tauri-client.ts
│   │   ├── query-client.ts
│   │   └── logger.ts
│   ├── lib/
│   │   ├── format/
│   │   ├── validation/
│   │   ├── errors/
│   │   └── constants/
│   ├── types/
│   │   ├── domain/
│   │   ├── api/
│   │   └── ui/
│   ├── assets/
│   └── styles/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/
│   │   │   ├── import_commands.rs
│   │   │   ├── review_commands.rs
│   │   │   ├── ev_commands.rs
│   │   │   ├── leaks_commands.rs
│   │   │   ├── stats_commands.rs
│   │   │   └── diagnostic_commands.rs
│   │   ├── domain/
│   │   │   ├── hand.rs
│   │   │   ├── tournament.rs
│   │   │   ├── ev.rs
│   │   │   ├── leak.rs
│   │   │   └── player_stats.rs
│   │   ├── application/
│   │   │   ├── import_service.rs
│   │   │   ├── review_service.rs
│   │   │   ├── ev_service.rs
│   │   │   ├── leaks_service.rs
│   │   │   ├── stats_service.rs
│   │   │   └── diagnostic_service.rs
│   │   ├── infrastructure/
│   │   │   ├── db/
│   │   │   │   ├── connection.rs
│   │   │   │   ├── migrations/
│   │   │   │   ├── repositories/
│   │   │   │   └── schema/
│   │   │   ├── parser/
│   │   │   │   ├── hh_parser.rs
│   │   │   │   ├── room_adapters/
│   │   │   │   └── normalizer.rs
│   │   │   ├── security/
│   │   │   │   ├── encryption.rs
│   │   │   │   └── key_manager.rs
│   │   │   └── logging/
│   │   │       └── logger.rs
│   │   ├── shared/
│   │   │   ├── errors.rs
│   │   │   ├── result.rs
│   │   │   └── time.rs
│   │   └── contracts/
│   │       ├── response.rs
│   │       └── command_payloads.rs
│   └── capabilities/
├── tests/
│   ├── frontend/
│   ├── backend/
│   ├── integration/
│   └── e2e/
└── docs/
    ├── architecture/
    ├── api-contracts/
    └── decision-records/
```

### Architectural Boundaries

**API Boundaries:**
- Frontend n'accede au backend que via commandes Tauri typees.
- Contrat de reponse unique `{ data, error, meta }`.
- Contrat d'erreur unique `{ code, message, details? }`.

**Component Boundaries:**
- Frontend organise par feature; chaque feature expose composants + hooks + api.
- UI shared decouplee du domaine metier.

**Service Boundaries:**
- `application/` orchestre les cas d'usage.
- `infrastructure/` gere DB, parsing, securite, logs.
- `domain/` contient regles metier pures.

**Data Boundaries:**
- SQLite comme source de verite locale.
- Migrations versionnees.
- Cache EV persistant en DB, invalide sur changement de contexte.

### Requirements to Structure Mapping

**Feature/Epic Mapping:**
- Import HH -> `features/import` + `commands/import_commands.rs` + `application/import_service.rs`
- Review main/tournoi -> `features/review` + `review_commands.rs` + `review_service.rs`
- EV on-demand -> `features/ev-analysis` + `ev_commands.rs` + `ev_service.rs`
- Leaks/priorisation -> `features/leaks` + `leaks_commands.rs` + `leaks_service.rs`
- Stats adverses (VPIP/PFR/...) -> `features/opponent-profiling` + `stats_commands.rs` + `stats_service.rs`
- Diagnostic -> `features/diagnostics` + `diagnostic_commands.rs` + `diagnostic_service.rs`

**Cross-Cutting Concerns:**
- Securite/chiffrement -> `infrastructure/security/`
- Logging structure -> `infrastructure/logging/` + `services/logger.ts`
- Validation formats/import -> `infrastructure/parser/` + `lib/validation/`

### Integration Points

**Internal Communication:**
- UI -> hooks/query -> `tauri-client` -> commandes Rust -> services application -> repositories.

**External Integrations:**
- MVP: uniquement systeme de fichiers local pour import HH.

**Data Flow:**
- Fichier HH -> parser/normalizer -> DB -> agregations stats/leaks -> UI review -> EV on-demand -> cache EV DB.

### File Organization Patterns

**Configuration Files:**
- Frontend: racine (`vite`, `tsconfig`, `package`)
- Backend Tauri: `src-tauri/tauri.conf.json`, `Cargo.toml`
- Environnement: `.env.example` uniquement, pas de secrets commites.

**Source Organization:**
- Feature-first cote frontend.
- Domain/Application/Infrastructure cote backend.

**Test Organization:**
- Unit frontend/back-end separes.
- Integration tests pour contrats UI<->backend.
- E2E pour parcours critiques review/EV/import.

**Asset Organization:**
- Assets UI dans `src/assets`.
- Documentation technique dans `docs/`.

### Development Workflow Integration

**Development Server Structure:**
- Frontend hot reload via Vite.
- Fenetre desktop via `npm run tauri dev`.

**Build Process Structure:**
- Build frontend puis packaging Tauri natif.

**Deployment Structure:**
- Packaging Windows MVP avec update manuel.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
Les choix principaux (Tauri + React TS + SQLite + offline-first + update manuel MVP) sont compatibles et sans contradiction.

**Pattern Consistency:**
Les conventions de nommage, formats de reponses/erreurs, state management et regles de logging sont coherentes avec la stack choisie.

**Structure Alignment:**
La structure projet proposee supporte clairement les decisions d'architecture et les flux metier critiques (import, review, EV, leaks, stats, diagnostic).

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
En l'absence d'epics, la couverture est validee au niveau categories FR.

**Functional Requirements Coverage:**
Les FR1-FR50 sont supportes par les modules/features et services backend definis.

**Non-Functional Requirements Coverage:**
Les NFR performance, securite, fiabilite, integration et scalabilite MVP sont adresses via les decisions techniques retenues.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Les decisions critiques sont explicites et actionnables.

**Structure Completeness:**
L'arborescence cible est suffisamment detaillee pour demarrer l'implementation.

**Pattern Completeness:**
Les regles anti-conflits entre agents sont definies (naming, formats, process).

### Gap Analysis Results

- **Important (non bloquant):** absence de spec UX detaillee pour figer interactions fines.
- **Deferred (assume):** auto-update, multi-plateforme, crash reporting distant.

### Validation Issues Addressed

- Les risques de divergence agent ont ete reduits par des conventions explicites.
- Les frontieres frontend/backend/data sont clarifiees.
- Les dependances techniques MVP sont cadrees.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Contexte projet analyse
- [x] Complexite evaluee
- [x] Contraintes techniques identifiees
- [x] Cross-cutting concerns cartographies

**✅ Architectural Decisions**
- [x] Decisions critiques documentees
- [x] Stack technologique specifiee
- [x] Patterns d'integration definis
- [x] Contraintes perf/securite couvertes

**✅ Implementation Patterns**
- [x] Naming conventions fixees
- [x] Format conventions fixees
- [x] Communication patterns fixes
- [x] Process patterns fixes

**✅ Project Structure**
- [x] Arborescence complete definie
- [x] Boundaries clarifiees
- [x] Points d'integration cartographies
- [x] Mapping exigences -> structure etabli

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** High

**Key Strengths:**
- Architecture locale-first adaptee au produit
- Forte coherence donnees/analyse/performance
- Regles de consistance robustes pour implementation multi-agents

**Areas for Future Enhancement:**
- UX detaillee
- strategie update auto
- extension multi-plateforme

### Implementation Handoff

**AI Agent Guidelines:**
- Suivre les decisions d'architecture et conventions sans deviation
- Respecter les boundaries et contrats de donnees
- Maintenir les formats standardises (reponse/erreur/logs)

**First Implementation Priority:**
Initialiser le projet via le starter valide:
`npm create tauri-app@latest projet-pok -- --template react-ts`
