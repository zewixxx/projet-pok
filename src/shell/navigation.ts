export type AppPage = "home" | "review" | "import" | "settings";

export interface NavItem {
  id: AppPage;
  label: string;
  hint: string;
}

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { id: "home", label: "Accueil", hint: "Ton bilan et tes priorités" },
  { id: "review", label: "Review", hint: "Rejouer et corriger tes mains" },
  { id: "import", label: "Importer", hint: "Récupérer tes historiques" },
  { id: "settings", label: "IA & réglages", hint: "Puissance, modèle, affichage" },
];
