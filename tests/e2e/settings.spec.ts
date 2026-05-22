import { expect, test } from "@playwright/test";

import { signInAsTestUser } from "../helpers/playwright-auth";

test("TC-E2E-07: issuing a PAT shows the plaintext token once, with a copy button", async ({
  context,
  page,
}) => {
  await signInAsTestUser(context, {
    providerUserId: `settings-${test.info().workerIndex}-${Date.now()}`,
  });

  await page.goto("/app/settings");

  await page.getByLabel("Issue a new token").fill("my-laptop");
  await page.getByRole("button", { name: "New token" }).click();

  const issued = page.getByTestId("issued-pat");
  await expect(issued).toBeVisible();
  await expect(issued).toContainText(/ctd_[A-Z2-7]{22}/);
  await expect(issued).toContainText(/save it now/i);
  await expect(issued.getByRole("button", { name: /copy token/i })).toBeVisible();

  // The new token appears in the listing too.
  const list = page.getByTestId("pat-list");
  await expect(list.getByText("my-laptop")).toBeVisible();
});
