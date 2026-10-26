/** Vocabulaire du poker expliqué simplement (affiché en infobulle via <Term>). */

export const GLOSSARY = {
  ev: "EV (espérance de gain) : ce qu'une décision rapporte en moyenne, en grosses blindes. Plus c'est haut, mieux c'est.",
  bb: "bb (grosse blinde) : l'unité de mesure des mises. Compter en bb permet de comparer des niveaux de blindes différents.",
  equite:
    "Équité : tes chances de gagner la main, en pourcentage, en tenant compte des cartes à venir.",
  equiteRequise:
    "Équité requise : le minimum d'équité dont tu as besoin pour qu'un call soit rentable, d'après les cotes du pot.",
  range: "Range : l'ensemble des mains qu'un joueur peut avoir dans cette situation.",
  fuite:
    "Fuite (leak) : une erreur qui revient souvent et te coûte de l'argent sur la durée. En corriger une rapporte plus que d'étudier des cas isolés.",
  itm: "ITM (In The Money) : la part de tes tournois où tu as été payé.",
  roi: "ROI : le bénéfice divisé par les buy-ins investis. +20 % veut dire que tu gagnes 20 centimes par euro misé.",
  abi: "ABI : le buy-in moyen de tes tournois.",
  bb100: "bb/100 : gain ou perte moyen sur 100 mains, en grosses blindes.",
  confiance:
    "Confiance : la fiabilité de l'estimation du moteur (faible, moyenne ou haute). Elle augmente quand la range adverse est bien cernée.",
  solveur:
    "Un solveur calcule la stratégie théoriquement parfaite. Ici, le moteur donne une estimation rapide et utile pour progresser, mais ce n'est pas un solveur.",
  pot: "Pot : la somme de tous les jetons déjà misés sur la main.",
  stack: "Stack : le nombre de jetons d'un joueur, ici exprimé en grosses blindes.",
  position:
    "Position : ta place à la table par rapport au bouton. Plus tu parles tard, plus tu as d'informations.",
  ante: "Ante : une petite mise obligatoire payée par tous les joueurs à chaque main.",
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
