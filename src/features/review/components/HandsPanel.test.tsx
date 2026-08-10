import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockHands } from "../mockData";
import HandsPanel from "./HandsPanel";

async function expandPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /spots à retenir/i }));
}

describe("HandsPanel", () => {
  it("reste replié par défaut avec un résumé", () => {
    render(<HandsPanel hands={mockHands} />);
    expect(screen.getByText(/spots à retenir/i)).toBeInTheDocument();
    expect(screen.getByText(/ouvrir pour rejouer/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /très coûteux/i })).not.toBeInTheDocument();
  });

  it("affiche les colonnes EV− et EV+ une fois ouvert", async () => {
    const user = userEvent.setup();
    render(<HandsPanel hands={mockHands} />);
    await expandPanel(user);
    expect(screen.getByRole("heading", { name: /très coûteux/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /très bons coups/i })).toBeInTheDocument();
  });

  it("filtre sur EV− uniquement", async () => {
    const user = userEvent.setup();
    render(<HandsPanel hands={mockHands} />);
    await expandPanel(user);
    await user.click(screen.getByRole("tab", { name: /^ev−$/i }));
    expect(screen.getByRole("heading", { name: /très coûteux/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /très bons coups/i })).not.toBeInTheDocument();
  });

  it("appelle onSelectHand au clic", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<HandsPanel hands={mockHands} onSelectHand={onSelect} />);
    await expandPanel(user);
    const cards = screen.getAllByRole("button").filter((b) => b.className.includes("ev-hand"));
    expect(cards.length).toBeGreaterThan(0);
    await user.click(cards[0]);
    expect(onSelect).toHaveBeenCalled();
  });
});
