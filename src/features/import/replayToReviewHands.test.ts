import { describe, expect, it } from "vitest";
import { MOCK_HANDS } from "../review/fixtures/mockHand";
import { replayHandsToReviewHands } from "./replayToReviewHands";

describe("replayHandsToReviewHands", () => {
  it("calcule un impact EV positif depuis coachTips / evComparisons (Records)", () => {
    const [review] = replayHandsToReviewHands(MOCK_HANDS, "t1", "2026-05-01");
    expect(review.evImpact).toBeGreaterThan(0);
    expect(review.summary).toMatch(/relance/i);
  });
});
