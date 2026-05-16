import { expect, test } from "@playwright/test";

import { signInAsTestUser } from "../helpers/playwright-auth";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context }) => {
  await signInAsTestUser(context, {
    providerUserId: `tasks-${test.info().workerIndex}-${Date.now()}`,
  });
});

test("TC-E2E-03: add a task; it appears in the open list and persists across reload", async ({
  page,
}) => {
  await page.goto("/app");
  const title = `Buy milk ${Date.now()}`;

  await page.getByLabel("Add a task").fill(title);
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText(title)).toBeVisible();

  // Reload: task should still be there.
  await page.reload();
  await expect(page.getByText(title)).toBeVisible();
});

test("TC-E2E-04: clicking Done moves a task from open to recently-done", async ({ page }) => {
  await page.goto("/app");
  const title = `Refactor ${Date.now()}`;

  await page.getByLabel("Add a task").fill(title);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(title)).toBeVisible();

  // The task row's "Done" button has aria-label `Mark "<title>" done`.
  await page.getByRole("button", { name: `Mark "${title}" done` }).click();

  // The done section appears with the task.
  await expect(page.getByTestId("done-tasks").getByText(title)).toBeVisible();
});

test("TC-E2E-05: submitting a title with an email shows a PII error and adds nothing", async ({
  page,
}) => {
  await page.goto("/app");

  await page.getByLabel("Add a task").fill("email me at bob@bob.com");
  await page.getByRole("button", { name: "Add" }).click();

  // An inline alert should appear under the form. (Next.js also injects its
  // own #__next-route-announcer__ role=alert, so scope to the form.)
  const form = page.getByTestId("add-task-form");
  await expect(form.getByRole("alert")).toContainText(/pii/i);

  // The (visible) task list should NOT contain that string.
  const list = page.getByTestId("open-tasks");
  await expect(list.getByText("email me at bob@bob.com")).toHaveCount(0);
});
