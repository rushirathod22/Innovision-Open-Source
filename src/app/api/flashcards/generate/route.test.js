import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

describe("POST /api/flashcards/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if neither topic nor content is provided", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({}),
    };

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Please provide either a topic or course content");
  });

  it("generates fallback flashcards for known topic", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({
        topic: "JavaScript",
        count: 5,
      }),
    };

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cards).toBeDefined();
    expect(Array.isArray(data.cards)).toBe(true);
    expect(data.cards.length).toBeGreaterThan(0);
    expect(data.cards[0]).toHaveProperty("question");
    expect(data.cards[0]).toHaveProperty("answer");
    expect(data.cards[0]).toHaveProperty("hint");
  });

  it("generates custom fallback cards for arbitrary topics", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({
        topic: "Quantum Computing Basics",
        count: 4,
      }),
    };

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cards.length).toBe(4);
    expect(data.cards[0].question).toContain("Quantum Computing Basics");
  });

  it("respects minimum and maximum card count limits", async () => {
    const req = {
      json: vi.fn().mockResolvedValue({
        topic: "Data Structures",
        count: 20, // should clamp to 12 or available
      }),
    };

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.cards.length).toBeLessThanOrEqual(12);
  });
});
