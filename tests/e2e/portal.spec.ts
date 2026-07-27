import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("presents the verified portal entry points", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("[data-shell-page-title]")).toHaveCount(0);
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

test("navigates from the portal prompt with an allowlisted command", async ({
  page,
}) => {
  await page.goto("/");

  const prompt = page.getByRole("textbox", { name: "Terminal command" });
  await expect(prompt).toBeVisible();
  await prompt.fill("plugins");
  await prompt.press("Enter");

  await expect(page).toHaveURL(/\/plugins\/$/);
  await expect(
    page.getByRole("heading", { name: "Verified plugin catalog" }),
  ).toBeVisible();
});

test("renders prompt errors as text without leaving the portal", async ({
  page,
}) => {
  await page.goto("/");

  const prompt = page.getByRole("textbox", { name: "Terminal command" });
  await prompt.fill("<img src=x onerror=alert(1)>");
  await prompt.press("Enter");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByText('command not found: "<img src=x onerror=alert(1)>"'),
  ).toBeVisible();
  await expect(page.locator(".terminal-output img")).toHaveCount(0);
});

test("changes the Starlight theme from the portal prompt", async ({ page }) => {
  await page.goto("/");

  const prompt = page.getByRole("textbox", { name: "Terminal command" });
  await prompt.fill("theme light");
  await prompt.press("Enter");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByText("theme set: light")).toBeVisible();
});

test("keeps the shell workspace chrome on documentation pages", async ({
  page,
}) => {
  await page.goto("/docs/");

  const shellHeader = page.locator("[data-shell-header]");
  await expect(shellHeader).toBeVisible();
  await expect(shellHeader).toContainText("ohtools@docs:/docs");
  await expect(page.locator("[data-shell-page-title]")).toContainText(
    "$ view /docs",
  );
});

test("keeps the Starlight navigation drawer available on mobile", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/docs/");

  const menu = page.locator("starlight-menu-button button");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute("aria-label", /menu/i);
  await menu.click();
  await expect(page.locator("starlight-menu-button")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(
    page
      .getByLabel("Main")
      .getByRole("link", { name: "Install and use the CLI" }),
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
