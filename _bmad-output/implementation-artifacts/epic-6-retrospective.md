# Epic 6 Retrospective - Diagnostic et fiabilite plateforme

Date: 2026-04-22
Epic: 6 - Securiser la continuite d'usage (diagnostic + fiabilite plateforme)
Statut: done

## Portee couverte

- Story `6.1` terminee: moteur de diagnostic autonome local + vue `Diagnostic`.
- Story `6.2` terminee: historique des incidents + etat de reprise du flux.
- Story `6.3` terminee: backup/restauration pour mise a jour manuelle sans perte.

## Ce qui a bien fonctionne

- Livraison incrementale rapide avec validation continue par lint.
- Pattern local-first respecte sur tout l'epic (stockage local, aucun cloud).
- Contrats de retour coherents (`status`, `summary`, `issues`, actions).
- UX orientee action: relance diagnostic, reprise proposee, restauration explicite.

## Difficultes rencontrees

- Environnement machine restreint (policy PowerShell), execution shell/tests limitee.
- Besoin de garder des heuristiques simples MVP pour diagnostic/EV/leaks.
- Coherence des statuts sprint a realigner en fin de sequence multi-stories.

## Decisions et compromis

- Diagnostic centré sur des checks robustes MVP (import/hands/actions/leaks), pas de deep engine.
- Sauvegarde update manuelle basee sur cles locales critiques, restauration deterministic.
- Historique incidents borne (30 entrees) pour eviter croissance locale non controlee.

## Actions d'amelioration (suite)

- Ajouter export JSON du rapport diagnostic (partage/debug).
- Ajouter score de sante global (0-100) et evolution temporelle.
- Ajouter verification integrite schema/version pour migrations futures.
- Ajouter tests E2E des parcours `backup -> restore -> verify`.

## Risques residuels

- Heuristiques de diagnostic peuvent produire faux positifs sur HH atypiques.
- Sans pipeline CI local complet, regression runtime possible non captee immediatement.
- Story `1.1` reste bloquee environnement (`link.exe`) pour validation desktop complete.

## Conclusion

Epic 6 est fonctionnellement complete pour le MVP local-first: diagnostic autonome, historique et reprise, et process de mise a jour manuelle protegeant les donnees utilisateur.
