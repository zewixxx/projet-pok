import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MOCK_HANDS } from "../fixtures/mockHand";
import { replayHandsToReviewHands } from "../../import/replayToReviewHands";
import PokerTableReview from "./PokerTableReview";

function setup() {
  const reviewHands = replayHandsToReviewHands(MOCK_HANDS, "t", "2026-04-01");
  return render(<PokerTableReview hands={MOCK_HANDS} reviewHands={reviewHands} />);
}

const caption = () => document.querySelector(".caption")?.textContent ?? "";

describe("PokerTableReview", () => {
  it("affiche la table, les commandes et le panneau d'analyse", () => {
    setup();
    expect(screen.getByRole("group", { name: /navigation du replay/i })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: /panneau d'analyse/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /coup suivant/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /coup précédent/i })).toBeDisabled();
  });

  it("avance coup par coup avec les boutons et les flèches", async () => {
    const user = userEvent.setup();
    setup();
    const first = caption();
    await user.click(screen.getByRole("button", { name: /coup suivant/i }));
    const second = caption();
    expect(second).not.toBe(first);
    await user.keyboard("{ArrowRight}");
    expect(caption()).not.toBe(second);
    await user.keyboard("{ArrowLeft}");
    expect(caption()).toBe(second);
  });

  it("saute à la décision du héros avec la touche D et affiche le conseil", async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.getByText(/pas encore ton tour/i)).toBeInTheDocument();
    await user.keyboard("d");
    expect(screen.queryByText(/pas encore ton tour/i)).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: /conseil du coach/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /comparaison des options/i })).toBeInTheDocument();
  });

  it("change d'onglet au clavier et affiche l'historique de la main", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("tab", { name: /historique/i }));
    expect(screen.getByRole("region", { name: /préflop/i })).toBeInTheDocument();
    expect(screen.getByText(/tes cartes/i)).toBeInTheDocument();
  });

  it("ne réagit pas aux flèches pendant une saisie", async () => {
    const user = userEvent.setup();
    setup();
    const before = caption();
    await user.click(screen.getByRole("button", { name: /main 1 sur/i }));
    const field = screen.getByRole("spinbutton", { name: /numéro de main/i });
    field.focus();
    await user.keyboard("{ArrowRight}");
    expect(caption()).toBe(before);
  });
});
