---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - C:\Users\gaetan.salber.ext\Documents\Projet-pok\brainstorming\brainstorming-session-2026-04-22-1500.md
workflowType: 'prd'
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 1
  projectDocsCount: 0
classification:
  projectType: desktop_app
  domain: edtech
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - Projet-pok

**Author:** Gaetan.salber
**Date:** 2026-04-23

## Executive Summary

`Projet-pok` est une application desktop orientée apprentissage poker MTT qui transforme la review technique en progression actionnable. Le produit cible les joueurs de micro-limites qui veulent améliorer rapidement leurs décisions sans passer par des outils complexes, coûteux et difficiles à utiliser.
Le problème adressé est double : la complexité des interfaces actuelles et l'absence de méthode claire pour passer des données de mains à un plan d'entraînement concret. La proposition de valeur est une expérience de review fluide où les calculs EV pertinents, l'analyse des ranges et le coaching sont intégrés dans un flux simple.

### What Makes This Special

Le produit se différencie par une UX moderne et intuitive, pensée pour réduire la friction cognitive des outils historiques. L'utilisateur peut analyser ses mains avec des calculs EV à la demande, identifier ses fuites prioritaires, puis recevoir des actions de progression directement exploitables.
L'insight central est que les joueurs n'ont pas seulement besoin de métriques, mais d'un système qui convertit la review en décisions d'entraînement claires et séquencées. `Projet-pok` se positionne ainsi comme une alternative accessible aux solutions premium coûteuses, avec une progression mesurable comme promesse principale.

## Project Classification

- **Project Type:** desktop_app
- **Domain:** edtech (apprentissage poker)
- **Complexity:** medium
- **Project Context:** greenfield

## Success Criteria

### User Success

Les utilisateurs doivent pouvoir importer leurs hand histories, revoir leurs mains une par une, lancer un calcul EV a la demande sur les coups importants, et identifier clairement leurs leaks prioritaires.
Le produit est considere utile si un joueur comprend rapidement quoi corriger, pourquoi, et dans quel ordre travailler ses faiblesses.

### Business Success

Le projet est actuellement oriente validation produit plutot qu'optimisation financiere.
Le succes business initial sera mesure par l'adoption et l'usage actif des fonctionnalites coeur (import, review, EV on-demand, priorisation des leaks), avant de fixer des objectifs de monetisation precis.

### Technical Success

Le MVP doit garantir :
- un import HH percu comme rapide et fiable,
- une experience fluide de review main par main,
- un calcul EV declenche uniquement a la demande sur les mains choisies (notamment les plus importantes),
- une analyse stable sans blocage sur des sessions de review standard.

### Measurable Outcomes

- l'utilisateur peut importer ses HH sans etape manuelle complexe,
- l'utilisateur peut selectionner une main et obtenir son analyse EV a la demande,
- l'application produit une liste de leaks priorisee par gravite,
- l'utilisateur termine une session de review complete avec des actions de progression identifiees.

## Product Scope

### MVP - Minimum Viable Product

- import HH
- review main par main
- EV on-demand
- priorisation des leaks

### Growth Features (Post-MVP)

- drills automatiques
- sizing optimizer

### Vision (Future)

Etendre la boucle de progression complete : detection avancee, coaching plus prescriptif, et entrainement intelligent automatise pour accelerer la montee en niveau sur tous profils MTT.

## User Journeys

### 1) Primary User - Success Path: Joueur MTT en progression

**Opening scene**  
Le joueur importe ses HH apres une session MTT. Il veut comprendre ses decisions cles, pas juste regarder des courbes.

**Rising action**  
Il ouvre la review tournoi, filtre les mains importantes, lance l'EV on-demand sur les spots critiques et compare ses decisions aux ranges attendues par position.

**Climax**  
L'application identifie clairement ses fuites prioritaires (gravite elevee), explique pourquoi il perd de l'EV, et transforme cela en axes de travail concrets.

**Resolution**  
Le joueur repart avec une vision claire : quoi corriger, dans quel ordre, et sur quels spots il doit s'entrainer en priorite.

### 2) Primary User - Edge Case: Joueur perdu apres une mauvaise session

**Opening scene**  
Apres une session frustrante, le joueur est en doute et ne sait pas si ses pertes viennent de la variance ou d'erreurs techniques.

**Rising action**  
Il relance la review sur les mains sensibles, utilise le coaching integre et consulte les recommandations de revision (ranges, spots, priorites).

**Climax**  
L'app distingue les erreurs reelles des resultats trompeurs, puis met en avant les corrections a plus fort impact EV.

**Resolution**  
Le joueur recupere une direction claire et un plan de revision cible au lieu de partir dans tous les sens.

### 3) Ops/Analysis User: Analyse des pertes EV et des stats joueur

**Opening scene**  
L'utilisateur veut une vue globale de son jeu : ou l'EV est perdue, dans quelles positions, contre quels profils adverses.

**Rising action**  
Il navigue dans les statistiques agregees, croise les decisions avec les profils de joueurs rencontres, et identifie les patterns recurrents de perte EV.

**Climax**  
Les zones les plus couteuses apparaissent clairement (positions, types de spots, decisions), avec recommandations d'amelioration.

**Resolution**  
Il peut prioriser ses efforts d'entrainement sur les leaks les plus rentables a corriger.

### 4) Support/Troubleshooting User: Auto-diagnostic utilisateur

**Opening scene**  
L'utilisateur remarque un probleme potentiel (import incomplet, resultat EV inattendu, incoherence apparente).

**Rising action**  
Il active un mode diagnostic qui verifie la qualite des donnees importees, l'etat des calculs et les eventuelles anomalies de parsing.

**Climax**  
Le diagnostic explique precisement la cause du probleme et propose des actions de correction immediates.

**Resolution**  
L'utilisateur resout seul la majorite des incidents sans support externe, puis reprend son flux de review.

### Journey Requirements Summary

Ces parcours revelent les capacites essentielles suivantes :

- import HH fiable avec controle qualite des donnees
- review tournoi et main par main avec filtres de priorite
- EV on-demand sur spots selectionnes
- moteur de detection et priorisation des leaks
- coaching integre oriente actions de revision
- analytics par position, spot, profil adverse et perte EV
- mode diagnostic autonome pour resolution des problemes courants

## Domain-Specific Requirements

### Compliance & Regulatory
- Positionner le produit comme outil d'apprentissage et de review (pas un outil de triche ni de conseil financier).
- Prevoir une politique de confidentialite claire sur les donnees de mains importees et leur usage.

### Technical Constraints
- MVP local-first sur PC pour limiter la complexite operationnelle initiale.
- Import HH rapide et fiable, avec feedback clair en cas d'erreur de parsing.
- Calcul EV declenche a la demande uniquement sur les mains selectionnees pour garder une UX fluide.

### Integration Requirements
- Support prioritaire des formats HH des rooms cibles micro-limites MTT.
- Architecture d'import extensible pour ajouter d'autres formats sans refonte majeure.

### Risk Mitigations
- Eviter les analyses trompeuses via des controles de qualite sur les donnees importees.
- Rendre les recommandations explicables (pourquoi une fuite est priorisee) pour limiter les mauvaises interpretations.
- Prevoir des mecanismes de diagnostic utilisateur pour resoudre les problemes d'import et d'analyse courants.

## Desktop App Specific Requirements

### Project-Type Overview

`Projet-pok` est concu comme une application desktop locale-first orientee review poker MTT. La V1 cible Windows pour reduire la complexite de livraison et accelerer la validation produit.

### Technical Architecture Considerations

- Architecture desktop locale avec stockage principal sur machine utilisateur.
- Flux d'import base sur fichiers HH, avec parsing robuste et controles qualite.
- Calcul EV declenche a la demande sur mains selectionnees, pour maitriser la charge de calcul.
- Fonctionnement offline par defaut pour review/analyse locale.
- Mecanismes de logs et diagnostic local pour resoudre les erreurs d'import/analyse.

### Platform Support

- **MVP/V1:** Windows uniquement.
- Extension multi-plateforme (Mac/Linux) evaluee apres validation de l'usage reel sur V1.

### System Integration

- Lecture des hand histories depuis le systeme de fichiers local.
- Gestion des chemins/dossiers d'import configurables par utilisateur.
- Gestion des erreurs de format avec feedback explicite et actions correctives proposees.

### Update Strategy

- **MVP:** mise a jour manuelle (telechargement et installation d'une nouvelle version).
- Auto-update differe post-MVP pour limiter le risque technique initial.

### Offline Capabilities

- Review, analyse EV on-demand, priorisation des leaks et diagnostic disponibles en mode offline.
- Aucune dependance cloud obligatoire pour le coeur fonctionnel MVP.

### Implementation Considerations

- Prioriser la stabilite du parsing HH et la clarte UX de review avant l'extension fonctionnelle.
- Concevoir des composants d'import et d'analyse extensibles pour supporter d'autres rooms/formats ensuite.
- Preparer des points d'extension pour futures versions (cross-platform, sync, auto-update).

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP oriente "valeur immediate pour le joueur" (comprendre ses erreurs et savoir quoi corriger).
**Resource Requirements:** 1 dev full-stack desktop + 1 support produit/QA, avec feedback utilisateur continu.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Importer les HH localement
- Revoir tournoi et mains cles
- Lancer EV a la demande sur spots choisis
- Obtenir une priorisation claire des leaks

**Must-Have Capabilities:**
- Import HH fiable (avec gestion erreurs de format)
- Review main par main
- EV on-demand
- Priorisation des leaks par gravite
- UX simple orientee action
- Mode diagnostic utilisateur de base

### Post-MVP Features

**Phase 2 (Post-MVP):**
- Drills automatiques cibles sur leaks
- Sizing optimizer
- Coaching plus prescriptif (plan d'entrainement personnalise)

**Phase 3 (Expansion):**
- Multi-plateforme (Mac/Linux)
- Auto-update integre
- Extension format/reseaux MTT plus larges
- Fonctions premium avancees de progression

### Risk Mitigation Strategy

**Technical Risks:** parsing HH instable selon room/version -> couche parsing modulaire + tests sur corpus reel + mode diagnostic explicite.
**Market Risks:** valeur percue insuffisante face aux outils existants -> focus UX "simple + actionnable" + mesure du temps pour arriver a une recommandation utile.
**Resource Risks:** surcharge de scope -> verrouiller MVP sur 4 capacites coeur, repousser optimizer/drills post-MVP.

## Functional Requirements

### Import & Data Intake

- FR1: L'utilisateur peut selectionner un ou plusieurs fichiers HH a importer depuis le systeme local.
- FR2: L'utilisateur peut lancer un import depuis un dossier configure.
- FR3: Le systeme peut detecter et ignorer les doublons de mains importees.
- FR4: Le systeme peut signaler les fichiers ou mains non lisibles avec une explication exploitable.
- FR5: L'utilisateur peut consulter un resume d'import (nombre de mains valides, rejetees, en erreur).

### Session & Tournament Review

- FR6: L'utilisateur peut consulter la liste de ses tournois importes.
- FR7: L'utilisateur peut ouvrir une review detaillee d'un tournoi.
- FR8: L'utilisateur peut naviguer main par main dans un tournoi.
- FR9: L'utilisateur peut filtrer les mains a fort impact (all-in, gros pots, spots marques).
- FR10: L'utilisateur peut marquer une main pour revision ulterieure.

### EV Analysis

- FR11: L'utilisateur peut declencher une analyse EV sur une main selectionnee.
- FR12: Le systeme peut fournir une comparaison EV des actions candidates sur la main analysee.
- FR13: Le systeme peut presenter l'impact EV de l'action reellement jouee.
- FR14: L'utilisateur peut relancer l'analyse EV apres modification du contexte de review.
- FR15: Le systeme peut indiquer clairement quand une analyse ne peut pas etre calculee.

### Ranges & Decision Support

- FR16: L'utilisateur peut afficher les ranges recommandees par position pendant la review.
- FR17: L'utilisateur peut comparer sa decision a une plage de jeu attendue.
- FR18: Le systeme peut relier une erreur de range a un leak identifiable.
- FR19: L'utilisateur peut consulter des explications pedagogiques sur les ecarts de decision.
- FR20: L'utilisateur peut regrouper ses erreurs de range par type de spot.

### Leak Detection & Prioritization

- FR21: Le systeme peut detecter les leaks recurrents a partir des mains analysees.
- FR22: Le systeme peut classer les leaks par gravite.
- FR23: Le systeme peut classer les leaks par frequence.
- FR24: Le systeme peut classer les leaks par impact EV potentiel.
- FR25: L'utilisateur peut consulter une liste priorisee de leaks a corriger.

### Coaching & Guidance

- FR26: Le systeme peut generer des recommandations d'amelioration basees sur les leaks detectes.
- FR27: L'utilisateur peut consulter, pour chaque leak, ce qu'il doit reviser en priorite.
- FR28: Le systeme peut distinguer les erreurs structurelles des erreurs ponctuelles.
- FR29: L'utilisateur peut associer des actions de travail a un leak donne.
- FR30: L'utilisateur peut suivre l'evolution d'un leak dans le temps.

### Statistics & Insights

- FR31: L'utilisateur peut consulter ses statistiques globales de review.
- FR32: L'utilisateur peut consulter ses statistiques par position.
- FR33: L'utilisateur peut consulter les zones principales de perte EV.
- FR34: L'utilisateur peut visualiser des tendances de progression sur ses sessions review.
- FR35: L'utilisateur peut identifier les spots ou il perd le plus d'EV.

### Diagnostic & Reliability

- FR36: L'utilisateur peut lancer un mode diagnostic autonome.
- FR37: Le systeme peut verifier la coherence des donnees importees.
- FR38: Le systeme peut signaler les incoherences detectees dans les resultats d'analyse.
- FR39: Le systeme peut proposer des actions correctives en cas de probleme diagnostic.
- FR40: L'utilisateur peut acceder a un historique des incidents de diagnostic.

### Desktop Platform Experience

- FR41: L'utilisateur peut utiliser toutes les fonctions coeur sans dependance cloud.
- FR42: L'utilisateur peut acceder a ses donnees review en local sur sa machine.
- FR43: L'utilisateur peut installer une nouvelle version via un processus de mise a jour manuelle.
- FR44: Le systeme peut preserver les donnees utilisateur lors d'une mise a jour manuelle.
- FR45: L'utilisateur peut configurer les chemins d'acces necessaires au fonctionnement local.

### Statistics & Opponent Profiling

- FR46: L'utilisateur peut consulter les statistiques adverses cles sur les mains reviewees (VPIP, PFR, 3-bet, fold to 3-bet, aggression factor).
- FR47: Le systeme peut afficher ces statistiques adverses dans le contexte de la main analysee.
- FR48: L'utilisateur peut comparer ses decisions a la dynamique des profils adverses observes.
- FR49: L'utilisateur peut filtrer ou rechercher des spots selon des profils adverses statistiques.
- FR50: Le systeme peut signaler les limites de fiabilite des stats adverses quand l'echantillon est faible.

## Non-Functional Requirements

### Performance

- NFR1: L'import d'un fichier HH standard doit demarrer en moins de 2 secondes apres action utilisateur.
- NFR2: L'ouverture d'un tournoi importe doit s'afficher en moins de 2 secondes dans des conditions normales.
- NFR3: Le lancement d'une analyse EV on-demand sur une main doit retourner un resultat exploitable en moins de 5 secondes pour les cas standards.
- NFR4: La navigation main par main doit rester fluide sans blocage perceptible pendant une session de review normale.

### Security

- NFR5: Les donnees de review utilisateur stockees localement doivent etre protegees contre l'acces non autorise au niveau applicatif.
- NFR6: Le systeme ne doit effectuer aucun envoi de donnees vers des services externes sans action explicite de l'utilisateur.
- NFR7: Les chemins d'import et donnees locales sensibles ne doivent pas etre exposes en clair dans les messages utilisateur non techniques.
- NFR8: Le produit doit inclure des mentions claires d'usage educatif et de protection des donnees utilisateur.

### Reliability

- NFR9: Le systeme doit preserver l'integrite des donnees importees en cas d'interruption ou d'erreur d'import.
- NFR10: Une erreur sur un fichier ou une main ne doit pas interrompre l'ensemble du processus de review.
- NFR11: Le mode diagnostic doit fournir un resultat exploitable pour les erreurs d'import ou d'analyse les plus frequentes.
- NFR12: La mise a jour manuelle ne doit pas supprimer les donnees utilisateur existantes.

### Integration

- NFR13: Le moteur d'import doit accepter les formats HH cibles MVP sans conversion manuelle obligatoire cote utilisateur.
- NFR14: Le systeme doit detecter et signaler clairement les versions ou formats HH non supportes.
- NFR15: Les statistiques adverses (VPIP et autres) doivent etre calculees uniquement lorsque les donnees necessaires sont presentes et qualifiees.
- NFR16: Le systeme doit afficher un indicateur de fiabilite quand l'echantillon statistique adverse est insuffisant.

### Scalability (MVP-appropriate)

- NFR17: L'application doit supporter une croissance progressive du volume de mains locales sans degradation majeure de l'experience de review.
- NFR18: L'architecture doit permettre l'ajout de nouveaux formats HH sans refonte complete du pipeline d'import.
