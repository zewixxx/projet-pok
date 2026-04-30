---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
inputDocuments:
  - C:\Users\gaetan.salber.ext\Documents\Projet-pok\_bmad-output\planning-artifacts\prd.md
  - C:\Users\gaetan.salber.ext\Documents\Projet-pok\_bmad-output\planning-artifacts\architecture.md
  - C:\Users\gaetan.salber.ext\Documents\Projet-pok\_bmad-output\planning-artifacts\ux-design-specification.md
---

# Projet-pok - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Projet-pok, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: L'utilisateur peut selectionner un ou plusieurs fichiers HH a importer depuis le systeme local.  
FR2: L'utilisateur peut lancer un import depuis un dossier configure.  
FR3: Le systeme peut detecter et ignorer les doublons de mains importees.  
FR4: Le systeme peut signaler les fichiers ou mains non lisibles avec une explication exploitable.  
FR5: L'utilisateur peut consulter un resume d'import (nombre de mains valides, rejetees, en erreur).  
FR6: L'utilisateur peut consulter la liste de ses tournois importes.  
FR7: L'utilisateur peut ouvrir une review detaillee d'un tournoi.  
FR8: L'utilisateur peut naviguer main par main dans un tournoi.  
FR9: L'utilisateur peut filtrer les mains a fort impact (all-in, gros pots, spots marques).  
FR10: L'utilisateur peut marquer une main pour revision ulterieure.  
FR11: L'utilisateur peut declencher une analyse EV sur une main selectionnee.  
FR12: Le systeme peut fournir une comparaison EV des actions candidates sur la main analysee.  
FR13: Le systeme peut presenter l'impact EV de l'action reellement jouee.  
FR14: L'utilisateur peut relancer l'analyse EV apres modification du contexte de review.  
FR15: Le systeme peut indiquer clairement quand une analyse ne peut pas etre calculee.  
FR16: L'utilisateur peut afficher les ranges recommandees par position pendant la review.  
FR17: L'utilisateur peut comparer sa decision a une plage de jeu attendue.  
FR18: Le systeme peut relier une erreur de range a un leak identifiable.  
FR19: L'utilisateur peut consulter des explications pedagogiques sur les ecarts de decision.  
FR20: L'utilisateur peut regrouper ses erreurs de range par type de spot.  
FR21: Le systeme peut detecter les leaks recurrents a partir des mains analysees.  
FR22: Le systeme peut classer les leaks par gravite.  
FR23: Le systeme peut classer les leaks par frequence.  
FR24: Le systeme peut classer les leaks par impact EV potentiel.  
FR25: L'utilisateur peut consulter une liste priorisee de leaks a corriger.  
FR26: Le systeme peut generer des recommandations d'amelioration basees sur les leaks detectes.  
FR27: L'utilisateur peut consulter, pour chaque leak, ce qu'il doit reviser en priorite.  
FR28: Le systeme peut distinguer les erreurs structurelles des erreurs ponctuelles.  
FR29: L'utilisateur peut associer des actions de travail a un leak donne.  
FR30: L'utilisateur peut suivre l'evolution d'un leak dans le temps.  
FR31: L'utilisateur peut consulter ses statistiques globales de review.  
FR32: L'utilisateur peut consulter ses statistiques par position.  
FR33: L'utilisateur peut consulter les zones principales de perte EV.  
FR34: L'utilisateur peut visualiser des tendances de progression sur ses sessions review.  
FR35: L'utilisateur peut identifier les spots ou il perd le plus d'EV.  
FR36: L'utilisateur peut lancer un mode diagnostic autonome.  
FR37: Le systeme peut verifier la coherence des donnees importees.  
FR38: Le systeme peut signaler les incoherences detectees dans les resultats d'analyse.  
FR39: Le systeme peut proposer des actions correctives en cas de probleme diagnostic.  
FR40: L'utilisateur peut acceder a un historique des incidents de diagnostic.  
FR41: L'utilisateur peut utiliser toutes les fonctions coeur sans dependance cloud.  
FR42: L'utilisateur peut acceder a ses donnees review en local sur sa machine.  
FR43: L'utilisateur peut installer une nouvelle version via un processus de mise a jour manuelle.  
FR44: Le systeme peut preserver les donnees utilisateur lors d'une mise a jour manuelle.  
FR45: L'utilisateur peut configurer les chemins d'acces necessaires au fonctionnement local.  
FR46: L'utilisateur peut consulter les statistiques adverses cles sur les mains reviewees (VPIP, PFR, 3-bet, fold to 3-bet, aggression factor).  
FR47: Le systeme peut afficher ces statistiques adverses dans le contexte de la main analysee.  
FR48: L'utilisateur peut comparer ses decisions a la dynamique des profils adverses observes.  
FR49: L'utilisateur peut filtrer ou rechercher des spots selon des profils adverses statistiques.  
FR50: Le systeme peut signaler les limites de fiabilite des stats adverses quand l'echantillon est faible.

### NonFunctional Requirements

NFR1: L'import d'un fichier HH standard doit demarrer en moins de 2 secondes apres action utilisateur.  
NFR2: L'ouverture d'un tournoi importe doit s'afficher en moins de 2 secondes dans des conditions normales.  
NFR3: Le lancement d'une analyse EV on-demand sur une main doit retourner un resultat exploitable en moins de 5 secondes pour les cas standards.  
NFR4: La navigation main par main doit rester fluide sans blocage perceptible pendant une session de review normale.  
NFR5: Les donnees de review utilisateur stockees localement doivent etre protegees contre l'acces non autorise au niveau applicatif.  
NFR6: Le systeme ne doit effectuer aucun envoi de donnees vers des services externes sans action explicite de l'utilisateur.  
NFR7: Les chemins d'import et donnees locales sensibles ne doivent pas etre exposes en clair dans les messages utilisateur non techniques.  
NFR8: Le produit doit inclure des mentions claires d'usage educatif et de protection des donnees utilisateur.  
NFR9: Le systeme doit preserver l'integrite des donnees importees en cas d'interruption ou d'erreur d'import.  
NFR10: Une erreur sur un fichier ou une main ne doit pas interrompre l'ensemble du processus de review.  
NFR11: Le mode diagnostic doit fournir un resultat exploitable pour les erreurs d'import ou d'analyse les plus frequentes.  
NFR12: La mise a jour manuelle ne doit pas supprimer les donnees utilisateur existantes.  
NFR13: Le moteur d'import doit accepter les formats HH cibles MVP sans conversion manuelle obligatoire cote utilisateur.  
NFR14: Le systeme doit detecter et signaler clairement les versions ou formats HH non supportes.  
NFR15: Les statistiques adverses (VPIP et autres) doivent etre calculees uniquement lorsque les donnees necessaires sont presentes et qualifiees.  
NFR16: Le systeme doit afficher un indicateur de fiabilite quand l'echantillon statistique adverse est insuffisant.  
NFR17: L'application doit supporter une croissance progressive du volume de mains locales sans degradation majeure de l'experience de review.  
NFR18: L'architecture doit permettre l'ajout de nouveaux formats HH sans refonte complete du pipeline d'import.

### Additional Requirements

- Le projet doit etre initialise avec le starter officiel Tauri React TypeScript: `npm create tauri-app@latest projet-pok -- --template react-ts` (priorite Story 1.1).  
- La stack cible doit rester Windows-first MVP avec execution locale et mode offline par defaut.  
- Le stockage principal doit etre SQLite local avec migrations versionnees au demarrage.  
- Le pipeline import doit implementer parsing modulaire, normalisation et validation qualite de donnees.  
- Les analyses EV doivent etre on-demand avec cache persistant en base et invalidation sur changement de contexte.  
- La communication frontend-backend doit passer exclusivement par commandes Tauri typees.  
- Les contrats de reponse doivent etre standardises: `{ data, error, meta }`.  
- Les erreurs doivent suivre le format standard: `{ code, message, details? }`.  
- Les donnees sensibles doivent etre chiffrees localement au repos.  
- Les logs locaux doivent etre structures et compatibles mode diagnostic, sans exposition de donnees sensibles.  
- Le state management frontend doit suivre le split impose: TanStack Query (donnee backend-like) + Zustand (etat UI/orchestration).  
- L'architecture frontend doit rester feature-based (import, review, ev-analysis, leaks, stats, opponent-profiling, diagnostics).  
- L'architecture backend doit respecter la separation Domain/Application/Infrastructure.  
- Les conventions de nommage sont obligatoires: snake_case DB, camelCase payloads, PascalCase composants, kebab-case fichiers.  
- La release MVP doit supporter uniquement la mise a jour manuelle avec preservation des donnees utilisateur.  
- Les tests doivent couvrir unitaires frontend/backend, integration des contrats UI-backend, et E2E des parcours critiques.

### UX Design Requirements

UX-DR1: Implementer le theme visuel Dark Analyst avec tokens de couleurs explicites (background, surfaces, texte, accent, semantiques).  
UX-DR2: Implementer la paire typographique Inter + JetBrains Mono avec echelle typographique definie (H1/H2/H3/body/data/meta).  
UX-DR3: Implementer le systeme d'espacement 8px et la grille desktop 12 colonnes.  
UX-DR4: Implementer le layout principal review en 2 panneaux (liste mains priorisees a gauche, detail analytique a droite).  
UX-DR5: Implementer une hierarchie visuelle constante leak -> impact EV -> cause -> action.  
UX-DR6: Creer le composant metier `LeakPriorityCard` (variants compact/detailed + etats).  
UX-DR7: Creer le composant metier `EvImpactPanel` (idle/computing/success/failed + variant expanded).  
UX-DR8: Creer le composant metier `RangeActionComparator` (match/deviation/no_data).  
UX-DR9: Creer le composant metier `OpponentStatsStrip` avec affichage de fiabilite echantillon.  
UX-DR10: Creer le composant metier `ReviewActionPlanPanel` pour transformer les insights en plan d'entrainement priorise.  
UX-DR11: Creer le composant metier `DiagnosticIssueTimeline` pour l'historique incidents et actions correctives.  
UX-DR12: Implementer les parcours UX critiques: import -> review -> EV on-demand -> correction.  
UX-DR13: Implementer le parcours analytics globales: segmentation positions/spots/profils -> priorisation leaks.  
UX-DR14: Implementer le parcours diagnostic: incident -> cause -> action -> relance -> statut.  
UX-DR15: Standardiser la hierarchie boutons (primary/secondary/tertiary/danger) avec etats complets.  
UX-DR16: Standardiser les patterns feedback (success/warning/error/info) avec structure message: evenement -> impact -> action.  
UX-DR17: Standardiser validation formulaires en 2 temps (inline + post-submit) avec messages actionnables.  
UX-DR18: Implementer navigation laterale stable (Dashboard, Tournois, Review, Leaks, Stats, Diagnostic).  
UX-DR19: Preserver le contexte utilisateur (filtres, scroll, dernier spot) lors des navigations.  
UX-DR20: Implementer loading/empty/search-filter patterns standardises sur ecrans critiques.  
UX-DR21: Respecter WCAG 2.1 AA (contraste 4.5:1, focus visible, navigation clavier complete).  
UX-DR22: Ne jamais encoder la gravite uniquement par couleur; ajouter labels/icones textuels.  
UX-DR23: Assurer compatibilite lecteur d'ecran (notamment NVDA) sur review/stats/diagnostic.  
UX-DR24: Implementer la strategie responsive desktop-first avec breakpoints sm/md/lg/xl/2xl et adaptation progressive.

### FR Coverage Map

FR1: Epic 1 - Import multi-fichiers HH local  
FR2: Epic 1 - Import depuis dossier configure  
FR3: Epic 1 - Deduplication des mains  
FR4: Epic 1 - Signalement des fichiers/mains non lisibles  
FR5: Epic 1 - Resume d'import exploitable  
FR6: Epic 1 - Liste des tournois importes  
FR7: Epic 2 - Ouverture review detaillee tournoi  
FR8: Epic 2 - Navigation main par main  
FR9: Epic 2 - Filtrage des mains a fort impact  
FR10: Epic 2 - Marquage de main pour revision  
FR11: Epic 2 - Declenchement EV on-demand  
FR12: Epic 2 - Comparaison EV des actions candidates  
FR13: Epic 2 - Affichage impact EV action jouee  
FR14: Epic 2 - Relance EV apres changement de contexte  
FR15: Epic 2 - Gestion des cas EV non calculable  
FR16: Epic 3 - Affichage ranges recommandees par position  
FR17: Epic 3 - Comparaison decision vs range attendue  
FR18: Epic 3 - Liaison erreur de range -> leak  
FR19: Epic 3 - Explications pedagogiques des ecarts  
FR20: Epic 3 - Regroupement erreurs par type de spot  
FR21: Epic 4 - Detection des leaks recurrents  
FR22: Epic 4 - Classement leaks par gravite  
FR23: Epic 4 - Classement leaks par frequence  
FR24: Epic 4 - Classement leaks par impact EV  
FR25: Epic 4 - Liste priorisee de leaks  
FR26: Epic 4 - Recommandations d'amelioration  
FR27: Epic 4 - Priorites de revision par leak  
FR28: Epic 4 - Distinction erreurs structurelles/ponctuelles  
FR29: Epic 4 - Association actions de travail a un leak  
FR30: Epic 4 - Suivi evolution des leaks dans le temps  
FR31: Epic 5 - Statistiques globales de review  
FR32: Epic 5 - Statistiques par position  
FR33: Epic 5 - Zones principales de perte EV  
FR34: Epic 5 - Tendances de progression review  
FR35: Epic 5 - Identification des spots les plus couteux  
FR36: Epic 6 - Lancement mode diagnostic autonome  
FR37: Epic 6 - Verification coherence donnees importees  
FR38: Epic 6 - Signalement incoherences d'analyse  
FR39: Epic 6 - Actions correctives en diagnostic  
FR40: Epic 6 - Historique incidents diagnostic  
FR41: Epic 1 - Usage coeur sans cloud  
FR42: Epic 1 - Acces donnees locales utilisateur  
FR43: Epic 6 - Processus de mise a jour manuelle  
FR44: Epic 6 - Preservation donnees lors mise a jour  
FR45: Epic 1 - Configuration chemins d'acces locaux  
FR46: Epic 3 - Consultation stats adverses cles  
FR47: Epic 3 - Affichage stats adverses en contexte main  
FR48: Epic 3 - Comparaison decisions vs dynamique adverse  
FR49: Epic 3 - Filtrage/recherche par profils adverses  
FR50: Epic 3 - Signalement fiabilite echantillon stats

## Epic List

### Epic 1: Demarrer la review locale de facon fiable
L'utilisateur peut importer ses HH, corriger les erreurs d'import et acceder a ses tournois en local pour lancer sa premiere review sans friction.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR41, FR42, FR45

### Epic 2: Revoir un tournoi main par main avec analyse EV on-demand
L'utilisateur peut naviguer dans les mains importantes d'un tournoi et obtenir une analyse EV exploitable a la demande sur chaque spot cle.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15

### Epic 3: Comprendre la decision via ranges et contexte adverse
L'utilisateur peut comparer ses decisions aux ranges attendues et aux profils adverses pour comprendre precisement ses erreurs de decision.
**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR46, FR47, FR48, FR49, FR50

### Epic 4: Prioriser les leaks et transformer l'analyse en plan d'entrainement
L'utilisateur peut identifier ses leaks les plus couteux, recevoir des recommandations ciblees et suivre sa progression dans le temps.
**FRs covered:** FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30

### Epic 5: Piloter la progression par statistiques globales
L'utilisateur peut mesurer ses pertes EV, ses tendances et ses zones de faiblesse pour orienter ses futures sessions de travail.
**FRs covered:** FR31, FR32, FR33, FR34, FR35

### Epic 6: Securiser la continuite d'usage (diagnostic + fiabilite plateforme)
L'utilisateur peut diagnostiquer les incidents, appliquer des corrections, maintenir ses donnees et continuer a utiliser l'app en conditions reelles.
**FRs covered:** FR36, FR37, FR38, FR39, FR40, FR43, FR44

## Epic 1: Demarrer la review locale de facon fiable

L'utilisateur peut importer ses HH, corriger les erreurs d'import et acceder a ses tournois en local pour lancer sa premiere review sans friction.

### Story 1.1: Set up initial project from starter template

As a joueur MTT utilisateur desktop,  
I want une application Projet-pok initialisee en local avec configuration des chemins d'acces,  
So that je peux commencer a utiliser le produit offline de facon fiable.

**Acceptance Criteria:**

**Given** un poste Windows cible MVP sans dependance cloud  
**When** le projet est initialise via `npm create tauri-app@latest projet-pok -- --template react-ts` puis dependances installees  
**Then** la structure frontend/backend est operationnelle pour execution locale  
**And** les scripts de dev/build permettent de lancer l'application en environnement local.

**Given** un utilisateur qui ouvre l'application pour la premiere fois  
**When** il accede aux parametres de base  
**Then** il peut enregistrer un chemin de dossier HH valide  
**And** ce chemin est conserve localement pour les imports suivants.

**Given** le mode local-first requis  
**When** l'application est en execution sans connexion internet  
**Then** les fonctions coeur deja initialisees restent disponibles  
**And** aucune dependance cloud n'est necessaire (FR41, FR42).

### Story 1.2: Importer des hand histories depuis fichiers et dossiers avec deduplication

As a joueur MTT en review,  
I want importer mes HH depuis un ou plusieurs fichiers et depuis un dossier configure,  
So that je peux alimenter rapidement ma base de mains sans doublons.

**Acceptance Criteria:**

**Given** un ou plusieurs fichiers HH selectionnes par l'utilisateur  
**When** l'import est lance  
**Then** le systeme ingere les mains lisibles depuis ces fichiers  
**And** les mains invalides sont isolees sans interrompre l'import global (FR1, FR4, NFR10).

**Given** un dossier d'import configure  
**When** l'utilisateur declenche l'import depuis ce dossier  
**Then** le systeme traite les fichiers HH presents  
**And** applique les memes regles de validation que l'import par fichiers (FR2).

**Given** des mains deja importees dans la base locale  
**When** une nouvelle operation d'import contient des doublons  
**Then** les doublons sont detectes et ignores  
**And** seules les nouvelles mains valides sont ajoutees (FR3, NFR9).

### Story 1.3: Fournir un resume d'import exploitable avec erreurs actionnables

As a joueur MTT qui vient d'importer des HH,  
I want un resume clair des resultats d'import et des erreurs detectees,  
So that je comprends immediatement quoi corriger avant de lancer la review.

**Acceptance Criteria:**

**Given** une operation d'import terminee  
**When** l'utilisateur consulte le resultat  
**Then** le systeme affiche le nombre de mains valides, rejetees et en erreur  
**And** le resume est lisible sans details techniques non necessaires (FR5, NFR7).

**Given** des fichiers ou mains non lisibles  
**When** le systeme presente les erreurs  
**Then** chaque erreur inclut une explication exploitable  
**And** propose une action corrective concrete (FR4).

**Given** des formats HH non supportes ou versions incompatibles  
**When** ils sont detectes a l'import  
**Then** le systeme signale explicitement la non-compatibilite  
**And** distingue clairement ce cas d'une erreur temporaire (NFR14).

### Story 1.4: Consulter la liste des tournois importes en mode local offline

As a joueur MTT qui prepare sa session de review,  
I want consulter la liste de mes tournois importes en local,  
So that je peux selectionner rapidement un tournoi a analyser meme hors ligne.

**Acceptance Criteria:**

**Given** des mains importees associees a des tournois  
**When** l'utilisateur ouvre la vue tournois  
**Then** le systeme affiche la liste des tournois importes  
**And** cette liste est basee exclusivement sur les donnees locales (FR6, FR42).

**Given** l'absence de connexion internet  
**When** l'utilisateur accede a la liste des tournois  
**Then** la fonctionnalite reste disponible  
**And** aucun appel externe n'est requis (FR41, NFR6).

**Given** un volume croissant de donnees importees  
**When** la vue tournois est chargee dans des conditions normales  
**Then** l'ouverture reste fluide et exploitable pour demarrer la review  
**And** respecte les objectifs de performance percue du MVP (NFR2, NFR17).

## Epic 2: Revoir un tournoi main par main avec analyse EV on-demand

L'utilisateur peut naviguer dans les mains importantes d'un tournoi et obtenir une analyse EV exploitable a la demande sur chaque spot cle.

### Story 2.1: Ouvrir une review detaillee d'un tournoi et naviguer main par main

As a joueur MTT en session d'analyse,  
I want ouvrir un tournoi importe et parcourir chaque main de facon fluide,  
So that je peux analyser mes decisions dans l'ordre du tournoi.

**Acceptance Criteria:**

**Given** un tournoi importe disponible dans la liste  
**When** l'utilisateur selectionne ce tournoi  
**Then** la vue review detaillee du tournoi s'ouvre  
**And** l'ouverture respecte l'objectif de performance percue (FR7, NFR2).

**Given** la review detaillee ouverte  
**When** l'utilisateur passe a la main suivante ou precedente  
**Then** la navigation main par main est disponible sans rupture de contexte  
**And** la fluidite reste conforme aux exigences UX du MVP (FR8, NFR4).

### Story 2.2: Filtrer et marquer les mains prioritaires

As a joueur MTT qui veut focaliser son temps,  
I want filtrer les spots a fort impact et marquer des mains a reviser,  
So that je concentre l'analyse sur les decisions les plus importantes.

**Acceptance Criteria:**

**Given** une liste de mains d'un tournoi  
**When** l'utilisateur applique des filtres de priorite (all-in, gros pots, spots marques)  
**Then** la liste affiche uniquement les mains correspondant aux criteres  
**And** le filtrage reste coherent avec le contexte de review (FR9).

**Given** une main affichee dans la review  
**When** l'utilisateur la marque pour revision ulterieure  
**Then** l'etat marque est persiste localement  
**And** la main est retrouvable comme spot prioritaire dans la session (FR10, FR42).

### Story 2.3: Lancer et afficher l'analyse EV on-demand d'une main

As a joueur MTT qui investigue une decision,  
I want declencher une analyse EV sur la main courante et voir les actions candidates,  
So that je quantifie objectivement l'impact de mon move.

**Acceptance Criteria:**

**Given** une main selectionnee en review  
**When** l'utilisateur declenche l'analyse EV on-demand  
**Then** le systeme calcule et retourne un resultat exploitable dans les delais cibles  
**And** l'etat de calcul est clairement visible pendant le traitement (FR11, NFR3).

**Given** une analyse EV terminee  
**When** les resultats sont affiches  
**Then** l'utilisateur voit la comparaison EV des actions candidates  
**And** l'impact EV de l'action reellement jouee est explicite (FR12, FR13).

**Given** un contexte modifie (ex: parametre de review)  
**When** l'utilisateur relance l'analyse EV  
**Then** le calcul est rejoue avec le nouveau contexte  
**And** les anciens resultats ne sont pas presentes comme valides (FR14).

**Given** un cas ou l'EV ne peut pas etre calculee  
**When** le moteur renvoie un echec  
**Then** le systeme affiche un message clair et actionnable  
**And** permet de poursuivre la review sans blocage global (FR15, NFR10).

## Epic 3: Comprendre la decision via ranges et contexte adverse

L'utilisateur peut comparer ses decisions aux ranges attendues et aux profils adverses pour comprendre precisement ses erreurs de decision.

### Story 3.1: Afficher les ranges recommandees et comparer la decision jouee

As a joueur MTT qui veut progresser techniquement,  
I want voir les ranges recommandees par position et comparer mon action a la range attendue,  
So that j'identifie clairement mes ecarts de decision.

**Acceptance Criteria:**

**Given** une main ouverte en review  
**When** l'utilisateur active l'affichage des ranges  
**Then** les ranges recommandees par position sont visibles dans le contexte de la main  
**And** la lecture reste compréhensible pour un niveau debutant/intermediaire (FR16).

**Given** une action jouee par l'utilisateur  
**When** la comparaison est effectuee  
**Then** le systeme montre l'ecart entre action jouee et plage attendue  
**And** explicite si la decision est conforme ou deviante (FR17).

### Story 3.2: Expliquer les erreurs de range et regrouper les ecarts par type de spot

As a joueur MTT en apprentissage,  
I want relier les erreurs de range a des leaks et lire des explications pedagogiques,  
So that je comprends pourquoi je perds de l'EV sur des spots recurrents.

**Acceptance Criteria:**

**Given** des ecarts detectes entre decision jouee et range attendue  
**When** le diagnostic de decision est affiche  
**Then** chaque ecart est relie a un leak identifiable  
**And** la relation leak/decision est explicite pour l'utilisateur (FR18).

**Given** une erreur de range diagnostiquee  
**When** l'utilisateur consulte le detail  
**Then** une explication pedagogique orientee correction est fournie  
**And** elle reste factuelle et non complaisante (FR19, UX-DR16).

**Given** plusieurs erreurs de nature similaire  
**When** l'utilisateur consulte la synthese d'erreurs  
**Then** les erreurs sont regroupees par type de spot  
**And** la priorisation des themes de travail est facilitee (FR20).

### Story 3.3: Integrer les statistiques adverses dans la decision de review

As a joueur MTT qui adapte ses decisions aux profils,  
I want voir les stats adverses dans le contexte de la main et filtrer les spots par profil,  
So that je compare mes decisions a la dynamique reelle des adversaires.

**Acceptance Criteria:**

**Given** des donnees adverses suffisantes sur les mains reviewees  
**When** l'utilisateur ouvre une main  
**Then** les stats adverses cles (VPIP, PFR, 3-bet, fold to 3-bet, AF) sont visibles  
**And** elles sont contextualisees dans le spot analyse (FR46, FR47).

**Given** une analyse decisionnelle en cours  
**When** l'utilisateur confronte sa ligne au profil adverse  
**Then** il peut comparer sa decision a la dynamique observee  
**And** le systeme explicite les limites si echantillon insuffisant (FR48, FR50, NFR16).

**Given** une liste de spots en review  
**When** l'utilisateur applique un filtre par profil adverse statistique  
**Then** les spots sont filtrables/recherchables selon ces profils  
**And** la navigation reste fluide en usage normal (FR49, NFR4).

## Epic 4: Prioriser les leaks et transformer l'analyse en plan d'entrainement

L'utilisateur peut identifier ses leaks les plus couteux, recevoir des recommandations ciblees et suivre sa progression dans le temps.

### Story 4.1: Detecter et classer les leaks recurrents

As a joueur MTT focalise sur le ROI de progression,  
I want detecter mes leaks recurrents et les classer par gravite/frequence/impact EV,  
So that je sais quoi corriger en priorite.

**Acceptance Criteria:**

**Given** un ensemble de mains analysees  
**When** le moteur de leaks est execute  
**Then** les leaks recurrents sont identifies automatiquement  
**And** relies aux patterns de decisions constates (FR21).

**Given** des leaks detectes  
**When** la priorisation est calculee  
**Then** les leaks sont classes par gravite, frequence et impact EV potentiel  
**And** la methode de classement est coherente et stable (FR22, FR23, FR24).

### Story 4.2: Afficher une liste priorisee de leaks avec recommandations actionnables

As a joueur MTT qui veut un plan concret,  
I want consulter une liste priorisee de leaks et des recommandations ciblees,  
So that je transforme l'analyse en actions de revision immediates.

**Acceptance Criteria:**

**Given** des leaks classes par priorite  
**When** l'utilisateur ouvre la vue leaks  
**Then** il accede a une liste priorisee claire  
**And** chaque item presente au minimum gravite, impact EV et confiance (FR25, UX-DR5).

**Given** un leak selectionne  
**When** l'utilisateur consulte son detail  
**Then** le systeme propose des recommandations d'amelioration concretes  
**And** indique ce qu'il faut reviser en priorite pour ce leak (FR26, FR27).

**Given** des erreurs heterogenes dans l'historique  
**When** la synthese coaching est calculee  
**Then** le systeme distingue erreurs structurelles et ponctuelles  
**And** adapte le niveau de priorite de correction en consequence (FR28).

### Story 4.3: Construire et suivre un plan de travail par leak

As a joueur MTT en progression continue,  
I want associer des actions de travail a chaque leak et suivre leur evolution,  
So that je mesure l'effet de mes revisions dans le temps.

**Acceptance Criteria:**

**Given** un leak prioritaire affiche  
**When** l'utilisateur ajoute une action de travail  
**Then** l'action est associee au leak cible  
**And** visible dans son plan d'entrainement (FR29, UX-DR10).

**Given** des sessions de review successives  
**When** l'utilisateur consulte l'evolution d'un leak  
**Then** le systeme affiche la tendance d'amelioration/degradation  
**And** conserve l'historique localement pour comparaison temporelle (FR30, FR42).

## Epic 5: Piloter la progression par statistiques globales

L'utilisateur peut mesurer ses pertes EV, ses tendances et ses zones de faiblesse pour orienter ses futures sessions de travail.

### Story 5.1: Afficher les statistiques globales et par position

As a joueur MTT qui veut une vue macro de son jeu,  
I want consulter mes statistiques globales et par position,  
So that j'identifie rapidement les zones de performance faible.

**Acceptance Criteria:**

**Given** des donnees de review disponibles en base locale  
**When** l'utilisateur ouvre la vue statistiques  
**Then** les statistiques globales de review sont affichees  
**And** une vue par position est disponible avec une lecture claire (FR31, FR32).

**Given** un volume de mains croissant  
**When** les statistiques sont chargees  
**Then** la consultation reste exploitable sans blocage perceptible  
**And** respecte les contraintes de fluidite du MVP (NFR4, NFR17).

### Story 5.2: Visualiser pertes EV, tendances et spots les plus couteux

As a joueur MTT qui veut prioriser ses revisions,  
I want visualiser mes pertes EV, mes tendances de progression et les spots les plus couteux,  
So that je decide ou investir mon prochain effort d'entrainement.

**Acceptance Criteria:**

**Given** des sessions review historisees  
**When** l'utilisateur consulte les insights de performance  
**Then** les zones principales de perte EV sont visibles  
**And** les spots les plus couteux sont identifies explicitement (FR33, FR35).

**Given** des donnees multi-sessions  
**When** la vue tendance est affichee  
**Then** l'utilisateur voit l'evolution de sa progression dans le temps  
**And** peut relier cette evolution a ses priorites de travail (FR34).

## Epic 6: Securiser la continuite d'usage (diagnostic + fiabilite plateforme)

L'utilisateur peut diagnostiquer les incidents, appliquer des corrections, maintenir ses donnees et continuer a utiliser l'app en conditions reelles.

### Story 6.1: Executer un diagnostic autonome sur import et analyse

As a joueur MTT confronte a un resultat incoherent,  
I want lancer un diagnostic autonome sur mes donnees et calculs,  
So that je comprends la cause du probleme sans support externe.

**Acceptance Criteria:**

**Given** une incoherence constatee dans import ou analyse  
**When** l'utilisateur lance le mode diagnostic  
**Then** le systeme verifie la coherence des donnees importees et des resultats  
**And** signale les anomalies detectees de facon explicite (FR36, FR37, FR38).

**Given** une anomalie detectee  
**When** le resultat diagnostic est presente  
**Then** une action corrective concrete est proposee  
**And** le format du message distingue clairement cause et solution (FR39, NFR11).

### Story 6.2: Historiser les incidents et permettre la reprise du flux

As a joueur MTT qui veut stabiliser son usage,  
I want consulter l'historique des incidents et reprendre rapidement ma review,  
So that une erreur ponctuelle ne bloque pas ma progression.

**Acceptance Criteria:**

**Given** un ou plusieurs incidents diagnostiques  
**When** l'utilisateur ouvre l'historique  
**Then** les incidents sont listables avec statut, cause et action appliquee  
**And** l'historique est conserve localement (FR40, FR42).

**Given** une erreur sur fichier ou main pendant un flux global  
**When** le systeme rencontre cette erreur  
**Then** l'execution globale continue autant que possible  
**And** l'utilisateur peut reprendre son flux de review apres correction (NFR10, NFR9).

### Story 6.3: Garantir la mise a jour manuelle sans perte de donnees

As a joueur MTT utilisateur regulier,  
I want mettre a jour l'application manuellement sans risque pour mes donnees locales,  
So that je reste sur une version recente sans perdre mon historique.

**Acceptance Criteria:**

**Given** une nouvelle version disponible  
**When** l'utilisateur suit le processus de mise a jour manuelle  
**Then** l'installation est possible sans dependance cloud obligatoire  
**And** les etapes sont comprehensibles pour un utilisateur non technique (FR43, NFR8).

**Given** une mise a jour terminee  
**When** l'utilisateur relance l'application  
**Then** les donnees de review locales existantes sont preservees  
**And** les vues import/review/leaks/stats restent accessibles apres migration (FR44, NFR12).
