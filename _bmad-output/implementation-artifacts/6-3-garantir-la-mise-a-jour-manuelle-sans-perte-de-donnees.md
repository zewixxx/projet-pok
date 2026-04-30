# Story 6.3: Garantir la mise a jour manuelle sans perte de donnees

Status: done

## Story

As a joueur MTT utilisateur regulier,
I want mettre a jour l'application manuellement sans risque pour mes donnees locales,
so that je reste sur une version recente sans perdre mon historique.

## Acceptance Criteria

1. **Given** une nouvelle version disponible, **When** l'utilisateur suit le processus de mise a jour manuelle, **Then** l'installation est possible sans dependance cloud obligatoire, **And** les etapes sont comprehensibles pour un utilisateur non technique (FR43).
2. **Given** une mise a jour terminee, **When** l'utilisateur relance l'application, **Then** les donnees de review locales existantes sont preservees, **And** les vues import/review/leaks/stats restent accessibles apres migration (FR44, NFR12).

## Tasks / Subtasks

- [x] Ajouter module de sauvegarde/restauration locale pre-update.
- [x] Ajouter verification des pre-requis de preservation de donnees.
- [x] Exposer commandes simples en UI (Verifier / Sauvegarder / Restaurer).
- [x] Ajouter tests unitaires de non-regression.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### File List

- `src/features/update/lib/manual-update.js`
- `src/features/update/lib/manual-update.test.mjs`
- `src/App.tsx`
