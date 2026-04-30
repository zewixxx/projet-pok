# Story 5.2: Visualiser pertes EV, tendances et spots les plus couteux

Status: done

## Story

As a joueur MTT qui veut prioriser ses revisions,
I want visualiser mes pertes EV, mes tendances de progression et les spots les plus couteux,
so that je decide ou investir mon prochain effort d'entrainement.

## Acceptance Criteria

1. **Given** des sessions review historisees, **When** l'utilisateur consulte les insights de performance, **Then** les zones principales de perte EV sont visibles, **And** les spots les plus couteux sont identifies explicitement (FR33, FR35).
2. **Given** des donnees multi-sessions, **When** la vue tendance est affichee, **Then** l'utilisateur voit l'evolution de sa progression dans le temps, **And** peut relier cette evolution a ses priorites de travail (FR34).

## Tasks / Subtasks

- [x] Etendre l'agregateur stats avec estimation EV losses.
- [x] Ajouter une serie de tendance EV.
- [x] Identifier les spots les plus couteux.
- [x] Integrer ces blocs dans la vue Stats.
- [x] Ajouter test unitaire de non-regression.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### File List

- `src/features/stats/lib/stats-overview.js`
- `src/features/stats/lib/stats-overview.test.mjs`
- `src/features/stats/components/stats-panel.tsx`
