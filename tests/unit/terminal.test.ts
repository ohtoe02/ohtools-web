import { describe, expect, test } from "vitest";

import { parseTerminalCommand } from "../../src/lib/terminal/commands";

const englishContext = {
  base: "/ohtools-web/",
  locale: "en" as const,
};

describe("parseTerminalCommand", () => {
  test("normalizes whitespace and resolves portal navigation inside the site base", () => {
    expect(parseTerminalCommand("  PlUgInS  ", englishContext)).toEqual({
      kind: "navigate",
      href: "/ohtools-web/plugins/",
    });
    expect(parseTerminalCommand("modules", englishContext)).toEqual({
      kind: "navigate",
      href: "/ohtools-web/declarative/",
    });
  });

  test("keeps navigation inside the active locale", () => {
    expect(
      parseTerminalCommand("docs", {
        base: "/ohtools-web/",
        locale: "ru",
      }),
    ).toEqual({
      kind: "navigate",
      href: "/ohtools-web/ru/docs/",
    });
  });

  test("switches language at the portal root", () => {
    expect(parseTerminalCommand("lang ru", englishContext)).toEqual({
      kind: "navigate",
      href: "/ohtools-web/ru/",
    });
    expect(
      parseTerminalCommand("lang en", {
        base: "/ohtools-web/",
        locale: "ru",
      }),
    ).toEqual({
      kind: "navigate",
      href: "/ohtools-web/",
    });
  });

  test("maps the public system theme name to Starlight auto mode", () => {
    expect(parseTerminalCommand("theme dark", englishContext)).toEqual({
      kind: "theme",
      theme: "dark",
      message: "theme set: dark",
    });
    expect(parseTerminalCommand("theme system", englishContext)).toEqual({
      kind: "theme",
      theme: "auto",
      message: "theme set: system",
    });
  });

  test("returns localized help and validation output", () => {
    const help = parseTerminalCommand("help", englishContext);
    expect(help.kind).toBe("output");
    if (help.kind === "output") {
      expect(help.tone).toBe("normal");
      expect(help.lines).toContain("plugins          open verified catalog");
      expect(help.lines).toContain("theme <mode>     dark | light | system");
    }

    expect(
      parseTerminalCommand("theme midnight", {
        base: "/ohtools-web/",
        locale: "ru",
      }),
    ).toEqual({
      kind: "output",
      tone: "error",
      lines: ["неверный режим темы: dark | light | system"],
    });
  });

  test("treats empty input as a no-op and clear as an explicit action", () => {
    expect(parseTerminalCommand("   ", englishContext)).toEqual({
      kind: "noop",
    });
    expect(parseTerminalCommand("clear", englishContext)).toEqual({
      kind: "clear",
    });
  });

  test("rejects unknown commands and shell metacharacters as plain input", () => {
    expect(parseTerminalCommand("plugins; rm -rf /", englishContext)).toEqual({
      kind: "output",
      tone: "error",
      lines: ['command not found: "plugins; rm -rf /"', 'run "help"'],
    });
  });
});
