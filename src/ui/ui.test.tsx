import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";
import { Segmented } from "./Segmented";
import { Switch } from "./Switch";
import { Tabs } from "./Tabs";
import { Term } from "./Term";

function TabsDemo() {
  const [value, setValue] = useState<"a" | "b" | "c">("a");
  return (
    <>
      <Tabs
        label="Sections"
        value={value}
        onChange={setValue}
        tabs={[
          { id: "a", label: "Analyse" },
          { id: "b", label: "Historique" },
          { id: "c", label: "Ranges" },
        ]}
      />
      <output data-testid="current">{value}</output>
    </>
  );
}

describe("Tabs", () => {
  it("se parcourt aux flèches et reste accessible", async () => {
    const user = userEvent.setup();
    render(<TabsDemo />);
    const first = screen.getByRole("tab", { name: "Analyse" });
    expect(first).toHaveAttribute("aria-selected", "true");

    first.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("current")).toHaveTextContent("b");
    expect(screen.getByRole("tab", { name: "Historique" })).toHaveFocus();

    await user.keyboard("{End}");
    expect(screen.getByTestId("current")).toHaveTextContent("c");

    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("current")).toHaveTextContent("a");
  });

  it("ne rend focalisable que l'onglet actif", () => {
    render(<TabsDemo />);
    expect(screen.getByRole("tab", { name: "Analyse" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Ranges" })).toHaveAttribute("tabindex", "-1");
  });
});

describe("Dialog", () => {
  it("se ferme avec Échap et rend le focus", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Aide">
        <button type="button">Dans la boîte</button>
      </Dialog>,
    );
    expect(screen.getByRole("dialog", { name: "Aide" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("garde le focus à l'intérieur (Tab boucle)", async () => {
    const user = userEvent.setup();
    render(
      <Dialog open onClose={() => {}} title="Aide">
        <button type="button">Un</button>
      </Dialog>,
    );
    const close = screen.getByRole("button", { name: "Fermer" });
    const inner = screen.getByRole("button", { name: "Un" });
    expect(close).toHaveFocus();
    await user.tab();
    expect(inner).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
  });

  it("ne rend rien quand elle est fermée", () => {
    render(
      <Dialog open={false} onClose={() => {}} title="Aide">
        contenu
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Segmented et Switch", () => {
  it("signale le choix actif et notifie le changement", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Segmented
        label="Puissance"
        value={40}
        onChange={onChange}
        options={[
          { value: 20, label: "20 %" },
          { value: 40, label: "40 %" },
        ]}
      />,
    );
    expect(screen.getByRole("radio", { name: "40 %" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("radio", { name: "20 %" }));
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it("bascule l'interrupteur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Analyse automatique" description="Au lancement" />);
    await user.click(screen.getByRole("switch", { name: /analyse automatique/i }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("Term", () => {
  it("relie le mot à son explication", () => {
    render(<Term id="ev">EV</Term>);
    const term = screen.getByText("EV", { selector: ".term" });
    const bubble = screen.getByRole("tooltip", { hidden: true });
    expect(term).toHaveAttribute("aria-describedby", bubble.id);
    expect(bubble).toHaveTextContent(/espérance de gain/i);
  });
});
