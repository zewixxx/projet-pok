# Sprint Change Proposal - 2026-04-22

## 1. Issue Summary

Pendant l'implementation de la Story `1.2` (import HH + deduplication), un ecart de trajectoire a ete detecte entre:
- les criteres d'acceptation planifies (notamment FR2: import depuis dossier configure),
- et la realite d'execution sur environnement web securise (sandbox navigateur), ou l'import dossier direct n'est pas disponible.

En parallele, le code review a releve deux risques qualite:
- feedback utilisateur incomplet en cas d'import partiel (fichiers illisibles / mains invalides),
- test d'integration fragile sur `localStorage` (stabilite CI).

Le changement est declenche pour aligner artefacts, implementation et UX sans rollback du sprint.

## 2. Impact Analysis

### Epic Impact

- **Epic 1** reste valide et poursuivable.
- **Story 1.2** doit etre precisee sur le contexte d'execution (desktop natif vs web securise).
- **Story 1.3** (resume d'import exploitable) est impactee positivement: le correctif introduit deja un signal "import partiel" utile pour la suite.

### Story Impact

- Story impactee directement: `1-2-importer-des-hand-histories-depuis-fichiers-et-dossiers-avec-deduplication`.
- Stories futures liees: `1.3` (resume d'import) et `1.4` (liste tournois importes), sans changement d'ordre obligatoire.

### Artifact Conflicts

- **PRD / Epics**: FR2 doit etre maintenu mais explicite par contexte d'execution.
- **Architecture**: necessite clarification "import dossier = capacite native desktop (Tauri), fallback web explicite".
- **UX Design**: doit formaliser l'etat "success partiel / warning persistant" pour import avec incidents.

### Technical Impact

- Ajustement API import (`error` non nul en import partiel) + details exploitables.
- Ajustement UI pour distinguer success complet vs partiel.
- Durcissement des tests pour reduire faux negatifs CI.
- Aucun changement de stack ni nouvelle dependance.

## 3. Recommended Approach

### Choix retenu: Option 1 - Direct Adjustment

- **Effort estime:** Low/Medium
- **Risque:** Low
- **Impact planning:** faible, sans replan global.

### Pourquoi ce choix

- Corrige le mismatch exigences/realite sans casser la roadmap.
- Preserve la progression de l'Epic 1.
- Evite un rollback couteux et inutile.
- Renforce fiabilite UX/qualite code tout en preparant l'implementation desktop native ulterieure.

## 4. Detailed Change Proposals

### 4.1 Story Update - AC2 (Story 1.2)

**Story:** `1-2-importer-des-hand-histories-depuis-fichiers-et-dossiers-avec-deduplication`  
**Section:** Acceptance Criteria (AC2)

**OLD**
- Given un dossier d'import configure, When l'utilisateur declenche l'import depuis ce dossier, Then le systeme traite les fichiers HH presents, And applique les memes regles de validation que l'import par fichiers (FR2).

**NEW**
- Given un dossier d'import configure en **environnement desktop natif**, When l'utilisateur declenche l'import depuis ce dossier, Then le systeme traite les fichiers HH presents, And applique les memes regles de validation que l'import par fichiers (FR2).
- Given un dossier d'import configure en **environnement web securise**, When l'utilisateur declenche l'import dossier, Then le systeme affiche un message explicite d'indisponibilite, And propose l'alternative "import par fichiers", And n'interrompt pas le flux d'usage.

**Rationale**
- Alignement explicite entre exigences produit et contraintes d'execution.

### 4.2 Implementation Change - Partial Import Feedback

**Artifacts cibles:** `src/features/import/api/import-api.js`, `src/features/import/components/import-panel.tsx`, `src/features/import/hooks/use-hh-import.js`

**OLD**
- `importFromFiles()` renvoie `error: null` meme en presence de `parseErrors`.
- L'UI peut afficher un succes global sans distinguer les incidents partiels.

**NEW**
- `importFromFiles()` renvoie un `error` structure quand import partiel (`PARTIAL_IMPORT`) tout en conservant `data` + `meta`.
- L'UI differencie:
  - succes complet (aucun incident),
  - succes partiel / warning persistant (incidents presents),
  - erreur bloquante.
- Message actionnable: corriger fichiers en erreur puis relancer.

**Rationale**
- Conformite FR4, NFR10 et patterns UX "neutre/factuel/actionnable".

### 4.3 Test Hardening - localStorage and Partial Import

**Artifact cible:** `src/features/import/api/import-api.test.mjs`

**OLD**
- Mutation directe `globalThis.localStorage = ...` potentiellement fragile selon runtime.

**NEW**
- Injection de storage via parametre API ou mock robuste (`Object.defineProperty`).
- Ajout test explicite "partial import" qui valide:
  - `error.code === "PARTIAL_IMPORT"`,
  - presence d'incidents (`parseErrors` et/ou `invalidHands`),
  - continuite du flux (des imports valides sont conserves).

**Rationale**
- Stabilite des tests et verrouillage du comportement attendu.

## 5. Implementation Handoff

### Scope Classification

- **Minor** (implementation directe par Developer agent).

### Handoff Recipients and Responsibilities

- **Developer agent**
  - Appliquer les patchs code sur API/hook/UI/tests.
  - Mettre a jour la Story 1.2 (AC2) dans l'artefact implementation.
  - Verifier lint/tests/build (dans la limite des restrictions machine).
- **Product Owner (light touch)**
  - Valider que la reformulation AC2 ne degrade pas FR2 et reste conforme MVP.

### Success Criteria

- Story 1.2 alignee avec contexte desktop/web.
- Import partiel visible et exploitable cote utilisateur.
- Test "partial import" present et stable.
- Aucun impact regressif sur Dashboard/Parametres.

---

## Checklist Status Snapshot

- 1. Trigger & Context: [x] Done
- 2. Epic Impact: [x] Done
- 3. Artifact Conflict Analysis: [x] Done
- 4. Path Forward Evaluation: [x] Done
- 5. Sprint Change Proposal Components: [x] Done
- 6. Final Review/Handoff prep: [!] Action-needed (attend approbation finale utilisateur)
