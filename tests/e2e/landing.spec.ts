import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { width: 375, height: 667, name: "mobile" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 1280, height: 800, name: "desktop" },
];

for (const v of VIEWPORTS) {
  test.describe(`landing page at ${v.width}x${v.height} (${v.name})`, () => {
    test.use({ viewport: { width: v.width, height: v.height } });

    test("renders headline + visible sign-in CTA", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByTestId("signin-cta")).toBeVisible();
    });

    test("TC-E2E-08/09: no horizontal scroll", async ({ page }) => {
      await page.goto("/");
      // Document scroll width should not exceed the viewport width.
      const overflow = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        return docW > window.innerWidth;
      });
      expect(overflow).toBe(false);
    });
  });
}
