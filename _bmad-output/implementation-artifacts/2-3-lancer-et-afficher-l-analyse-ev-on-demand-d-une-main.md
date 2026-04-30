# Story 2.3: Lancer et afficher l'analyse EV on-demand d'une main

Status: done

## Story

As a joueur MTT qui investigue une decision,
I want declencher une analyse EV sur la main courante et voir les actions candidates,
so that je quantifie objectivement l'impact de mon move.

## Acceptance Criteria

1. **Given** une main selectionnee en review, **When** l'utilisateur declenche l'analyse EV on-demand, **Then** le systeme calcule et retourne un resultat exploitable dans les delais cibles, **And** l'etat de calcul est clairement visible pendant le traitement (FR11, NFR3).
2. **Given** une analyse EV terminee, **When** les resultats sont affiches, **Then** l'utilisateur voit la comparaison EV des actions candidates, **And** l'impact EV de l'action reellement jouee est explicite (FR12, FR13).
3. **Given** un cas ou l'EV ne peut pas etre calculee, **When** le moteur renvoie un echec, **Then** le systeme affiche un message clair et actionnable, **And** permet de poursuivre la review sans blocage global (FR15, NFR10).

## Tasks / Subtasks

- [x] Ajouter un module EV on-demand local avec resultat normalise `{ data, error, meta }`.
- [x] Ajouter la detection de l'action jouee, des actions candidates et une estimation EV coherente MVP.
- [x] Integrer les etats `idle/computing/success/failed` dans la review detaillee.
- [x] Afficher EV action jouee, meilleure action, perte EV et comparatif des options.
- [x] Ajouter tests unitaires pour succes et echec EV non calculable.

## Dev Agent Record

### Agent Model Used

Codex 5.3

### Completion Notes List

- Ajout de `analyzeHandEvOnDemand` dans `src/features/review/lib/ev-analysis.js`.
- Ajout des tests dans `src/features/review/lib/ev-analysis.test.mjs`.
- Integration de l'analyse EV dans `TournamentReviewPanel` avec les etats UX attendus.
- Ajout du panneau de rendu EV dans `src/App.css`.

### File List

- `src/features/review/lib/ev-analysis.js`
- `src/features/review/lib/ev-analysis.test.mjs`
- `src/features/review/components/tournament-review-panel.tsx`
- `src/App.css`
