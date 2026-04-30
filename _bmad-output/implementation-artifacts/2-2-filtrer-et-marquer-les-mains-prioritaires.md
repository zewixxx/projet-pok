# Story 2.2: Filtrer et marquer les mains prioritaires

Status: done

## Story

As a joueur MTT qui veut focaliser son temps,
I want filtrer les spots a fort impact et marquer des mains a reviser,
so that je concentre l'analyse sur les decisions les plus importantes.

## Acceptance Criteria

1. **Given** une liste de mains d'un tournoi, **When** l'utilisateur applique des filtres de priorite (all-in, gros pots, spots marques), **Then** la liste affiche uniquement les mains correspondant aux criteres, **And** le filtrage reste coherent avec le contexte de review (FR9).
2. **Given** une main affichee dans la review, **When** l'utilisateur la marque pour revision ulterieure, **Then** l'etat marque est persiste localement, **And** la main est retrouvable comme spot prioritaire dans la session (FR10, FR42).

## Tasks / Subtasks

- [x] Ajouter la logique de signaux de priorite sur une main (all-in, gros pot).
- [x] Ajouter le filtrage combine des mains selon les criteres actifs.
- [x] Ajouter la persistance locale des mains marquees par `tournamentId`.
- [x] Integrer filtres + action marquer/retirer dans `TournamentReviewPanel`.
- [x] Ajouter des tests utilitaires sur detection de priorite et filtrage.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Ajout de `getHandSignals` et `filterHandsByPriority` dans `src/features/review/lib/tournament-review.js`.
- Ajout de `getMarkedHands` et `toggleMarkedHand` dans `src/features/import/api/import-api.js`.
- Ajout des filtres `All-in`, `Gros pots`, `Spots marques` et du bouton de marquage dans `src/features/review/components/tournament-review-panel.tsx`.
- Persistance des spots marques dans `pok.import.v1` via `markedHands`.
- Ajout des styles UI des filtres dans `src/App.css`.
- Ajout des tests `getHandSignals` et `filterHandsByPriority`.

### File List

- `src/features/import/api/import-api.js`
- `src/features/import/api/import-api.d.ts`
- `src/features/review/lib/tournament-review.js`
- `src/features/review/lib/tournament-review.test.mjs`
- `src/features/review/components/tournament-review-panel.tsx`
- `src/App.css`
