import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockHands } from "../mockData";
import HandsPanel from "./HandsPanel";

describe("HandsPanel", () => {
  it("affiche les erreurs coûteuses et les meilleurs coups", () => {
    render(<HandsPanel hands={mockHands} />);
    expect(screen.getByRole("heading", { name: /erreurs les plus coûteuses/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /meilleurs coups/i })).toBeInTheDocument();
  });

  it("filtre sur les erreurs uniquement", async () => {
    const user = userEvent.setup();
    render(<HandsPanel hands={mockHands} />);
    await user.click(screen.getByRole("radio", { name: /^erreurs$/i }));
    expect(screen.getByRole("heading", { name: /erreurs les plus coûteuses/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /meilleurs coups/i })).not.toBeInTheDocument();
  });

  it("filtre sur les beaux coups uniquement", async () => {
    const user = userEvent.setup();
    render(<HandsPanel hands={mockHands} />);
    await user.click(screen.getByRole("radio", { name: /beaux coups/i }));
    expect(screen.getByRole("heading", { name: /meilleurs coups/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /erreurs les plus coûteuses/i })).not.toBeInTheDocument();
  });

  it("appelle onSelectHand au clic sur une main", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<HandsPanel hands={mockHands} onSelectHand={onSelect} />);
    const rows = screen.getAllByRole("button").filter((b) => b.className.includes("hand-row"));
    expect(rows.length).toBeGreaterThan(0);
    await user.click(rows[0]);
    expect(onSelect).toHaveBeenCalledWith(expect.any(String));
  });

  it("signale une liste vide sans planter", () => {
    render(<HandsPanel hands={[]} />);
    expect(screen.getByText(/pas de grosse erreur détectée/i)).toBeInTheDocument();
    expect(screen.getByText(/pas encore de beau coup/i)).toBeInTheDocument();
  });
});
