# Story 5.1: Afficher les statistiques globales et par position

Status: done

## Story

As a joueur MTT qui veut une vue macro de son jeu,
I want consulter mes statistiques globales et par position,
so that j'identifie rapidement les zones de performance faible.

## Acceptance Criteria

1. **Given** des donnees de review disponibles en base locale, **When** l'utilisateur ouvre la vue statistiques, **Then** les statistiques globales de review sont affichees, **And** une vue par position est disponible avec une lecture claire (FR31, FR32).
2. **Given** un volume de mains croissant, **When** les statistiques sont chargees, **Then** la consultation reste exploitable sans blocage perceptible, **And** respecte les contraintes de fluidite du MVP (NFR4, NFR17).

## Tasks / Subtasks

- [x] Ajouter un agregateur de statistiques globales/par position.
- [x] Ajouter tests unitaires de l'agregateur.
- [x] Ajouter une vue `StatsPanel` lisible dans l'app.
- [x] Integrer la navigation `Stats` dans la sidebar.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### File List

- `src/features/stats/lib/stats-overview.js`
- `src/features/stats/lib/stats-overview.test.mjs`
- `src/features/stats/components/stats-panel.tsx`
- `src/App.tsx`
- `src/App.css`
