import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("presents the verified portal entry points", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /operations without guesswork/i }),
  ).toBeVisible();
  await expect(page.getByText(/catalog sequence 3/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /browse 4 plugins/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /explore 8 modules/i }),
  ).toBeVisible();
});

test("filters the signed catalog without browser network access", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/plugins/");

  await expect(
    page.getByRole("heading", { name: "Verified plugin catalog" }),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: /filter plugins/i })
    .fill("systemd");
  await expect(page.getByRole("link", { name: /systemd-base/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /docker-base/i })).toBeHidden();
  expect(requests.some((url) => url.includes("ohtools-plugin-catalog"))).toBe(
    false,
  );
});

test("serves the Russian module reference and passes critical accessibility checks", async ({
  page,
}) => {
  await page.goto("/ru/declarative/");

  await expect(
    page.getByRole("heading", { name: /декларативные модули/i }),
  ).toBeVisible();
  await expect(page.getByText("Предварительный контракт.")).toBeVisible();
  await expect(page.getByText(/не является immutable release/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /юнит systemd/i })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((violation) =>
      ["critical", "serious"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
});
