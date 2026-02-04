import { test, expect } from "@playwright/test";

test.describe("Renderer E2E", () => {
  test("shows app header", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Statecraft", level: 1 })).toBeVisible();
    await expect(page.getByRole("img", { name: "Statecraft" })).toBeVisible();
  });

  test("loads board from API and shows board name, columns, and tasks", async ({ page }) => {
    await page.goto("/");
    // Wait for board to load (board name appears)
    await expect(page.getByRole("heading", { name: "E2E Test Board", level: 2 })).toBeVisible({
      timeout: 10_000,
    });
    // Column names (lane headers)
    await expect(page.getByText("Backlog").first()).toBeVisible();
    await expect(page.getByText("In Progress").first()).toBeVisible();
    await expect(page.getByText("Done").first()).toBeVisible();
    // At least one task card with id and title
    await expect(page.getByText("TASK-1").first()).toBeVisible();
    await expect(page.getByText("First E2E task").first()).toBeVisible();
    await expect(page.getByText("Second E2E task").first()).toBeVisible();
    await expect(page.getByText("In-progress task").first()).toBeVisible();
  });

  test("each column lane is visible and contains cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "E2E Test Board", level: 2 })).toBeVisible({
      timeout: 10_000,
    });
    const lanes = page.locator(".lane");
    await expect(lanes).toHaveCount(3);
    // Backlog has 1 task, In Progress 1, Done 1
    const cards = page.locator("[data-task-id]");
    await expect(cards).toHaveCount(3);
  });

  test("task cards show id and title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "E2E Test Board", level: 2 })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator("[data-task-id='TASK-1']")).toBeVisible();
    await expect(page.locator("[data-task-id='TASK-1']").getByText("First E2E task")).toBeVisible();
    await expect(page.locator("[data-task-id='TASK-2']")).toBeVisible();
    await expect(page.locator("[data-task-id='TASK-2']").getByText("Second E2E task")).toBeVisible();
  });

  test("board area has no load-board fallback when board is loaded", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "E2E Test Board", level: 2 })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("heading", { name: "Load board" })).not.toBeVisible();
  });

  test("task with description shows description text", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "E2E Test Board", level: 2 })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Used by E2E tests").first()).toBeVisible();
  });

  test("responsive: board and columns visible on narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "E2E Test Board", level: 2 })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Backlog").first()).toBeVisible();
    await expect(page.locator(".lane").first()).toBeVisible();
    await expect(page.locator("[data-task-id]").first()).toBeVisible();
  });
});
