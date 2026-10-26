import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./HomePage";
import type { HomeData, HomeLeak } from "./useHomeData";
import { sessionsFromTournaments } from "./useHomeData";
import type { SessionPoint } from "./types";
import type { RemoteTournament } from "../ai/useRemoteReview";

function session(date: string, net: number, cumul: number, place = 40): SessionPoint {
  return {
    date,
    label: `Tournoi ${date}`,
    buyIn: 5,
    netEuros: net,
    cumulEuros: cumul,
    evEuros: net,
    cumulEv: cumul,
    sdEuros: net,
    cumulSd: cumul,
    place,
    total: 500,
    hands: 80,
  };
}

const LEAK: HomeLeak = {
  id: "overfold-turn-early",
  category: "overfold",
  description: "Folds trop serrés au turn en début de table",
  costBb100: 3.4,
  occurrences: 12,
  totalLossBb: 40,
  severity: "critical",
  sampleHandIds: ["h1"],
};

function realData(overrides: Partial<HomeData> = {}): HomeData {
  return {
    mode: "real",
    sessions: [session("2026-04-01", -5, -5, 300), session("2026-04-10", 25, 20, 3), session("2026-04-20", -5, 15, 200)],
    byLimit: [],
    leaks: [LEAK],
    recent: [
      { id: "t3", name: "ATOM PKO", dateIso: "2026-04-20", buyIn: 5, place: 200, total: 500, net: -5, hands: 80, analyzed: false },
      { id: "t2", name: "GALAXY KO", dateIso: "2026-04-10", buyIn: 5, place: 3, total: 500, net: 25, hands: 90, analyzed: true, mistakes: 7 },
    ],
    analysis: { analyzed: 1, total: 3, mistakes: 7, lossBb: 20 },
    positions: null,
    nextToAnalyze: { id: "t3", name: "ATOM PKO", dateIso: "2026-04-20", buyIn: 5, place: 200, total: 500, net: -5, hands: 80, analyzed: false },
    ...overrides,
  };
}

const handlers = () => ({
  onReviewTournament: vi.fn(),
  onOpenLeak: vi.fn(),
  onImport: vi.fn(),
  onDemoReview: vi.fn(),
});

describe("HomePage", () => {
  it("affiche l'accueil de bienvenue quand rien n'est importé", async () => {
    const user = userEvent.setup();
    const h = handlers();
    render(<HomePage data={{ ...realData(), mode: "empty", sessions: [], leaks: [], recent: [], analysis: null, nextToAnalyze: null }} {...h} />);
    expect(screen.getByRole("heading", { name: /bienvenue/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /chercher mes mains/i }));
    expect(h.onImport).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /voir une démo/i }));
    expect(h.onDemoReview).toHaveBeenCalled();
  });

  it("propose d'analyser le tournoi le plus récent non analysé", async () => {
    const user = userEvent.setup();
    const h = handlers();
    render(<HomePage data={realData()} {...h} />);
    expect(screen.getByRole("heading", { name: /2 tournois à analyser/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /analyser et réviser/i }));
    expect(h.onReviewTournament).toHaveBeenCalledWith("t3");
  });

  it("met en avant la fuite n°1 quand tout est analysé", async () => {
    const user = userEvent.setup();
    const h = handlers();
    render(<HomePage data={realData({ nextToAnalyze: null, analysis: { analyzed: 3, total: 3, mistakes: 20, lossBb: 60 } })} {...h} />);
    expect(screen.getByRole("heading", { name: /folds trop serrés/i, level: 2 })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /voir un exemple$/i }));
    expect(h.onOpenLeak).toHaveBeenCalledWith(LEAK);
  });

  it("calcule les chiffres clés à partir des tournois", () => {
    render(<HomePage data={realData()} {...handlers()} />);
    const kpis = screen.getByRole("region", { name: /chiffres clés/i });
    // +15 € sur 15 € investis → ROI +100 %
    expect(within(kpis).getByText(/\+15\s€/)).toBeInTheDocument();
    expect(within(kpis).getByText(/\+100\s%/)).toBeInTheDocument();
  });

  it("signale clairement les données d'exemple", () => {
    render(
      <HomePage
        data={realData({ mode: "demo", analysis: null, nextToAnalyze: null, recent: [] })}
        {...handlers()}
      />,
    );
    expect(screen.getByText(/données d'exemple/i, { selector: ".badge" })).toBeInTheDocument();
  });

  it("ouvre la review d'un tournoi depuis la liste", async () => {
    const user = userEvent.setup();
    const h = handlers();
    render(<HomePage data={realData()} {...h} />);
    await user.click(screen.getByRole("button", { name: /revoir galaxy ko/i }));
    expect(h.onReviewTournament).toHaveBeenCalledWith("t2");
  });
});

describe("sessionsFromTournaments", () => {
  const t = (id: string, date: string, place: number, prize?: number): RemoteTournament =>
    ({
      id,
      name: id,
      dateIso: date,
      handsCount: 50,
      place,
      totalPlayers: 100,
      buyInEuros: 10,
      prizeEuros: prize,
      handIds: [],
      fileKey: id,
      analyzed: false,
    }) as RemoteTournament;

  it("remet les tournois dans l'ordre chronologique et cumule le résultat", () => {
    const sessions = sessionsFromTournaments([t("c", "2026-04-03", 5, 50), t("b", "2026-04-02", 40), t("a", "2026-04-01", 9, 20)]);
    expect(sessions.map((s) => s.label)).toEqual(["a", "b", "c"]);
    expect(sessions.map((s) => s.netEuros)).toEqual([10, -10, 40]);
    expect(sessions.map((s) => s.cumulEuros)).toEqual([10, 0, 40]);
  });

  it("ignore les tournois sans résultat connu", () => {
    const sessions = sessionsFromTournaments([t("x", "2026-04-03", 0), t("y", "2026-04-02", 12, 5)]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].label).toBe("y");
  });
});
