import { expect, test } from "@playwright/test";

test("public pages render entries", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Memories" })).toBeVisible();
  await expect(page.getByRole("link", { name: /伏見稲荷大社の朝/ })).toBeVisible();
  await page.getByRole("link", { name: /伏見稲荷大社の朝/ }).click();
  await expect(page.getByRole("heading", { name: "伏見稲荷大社の朝" })).toBeVisible();
});
