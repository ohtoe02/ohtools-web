export type TerminalLocale = "en" | "ru";
export type TerminalTheme = "auto" | "dark" | "light";

export interface TerminalContext {
  base: string;
  locale: TerminalLocale;
}

export type TerminalCommandResult =
  | { kind: "noop" }
  | { kind: "clear" }
  | { kind: "navigate"; href: string }
  | { kind: "theme"; theme: TerminalTheme; message: string }
  | { kind: "output"; tone: "normal" | "error"; lines: string[] };

const copy = {
  en: {
    help: [
      "help             show available commands",
      "docs             open documentation",
      "plugins          open verified catalog",
      "modules          open declarative modules",
      "lang <locale>    en | ru",
      "theme <mode>     dark | light | system",
      "clear            clear this session",
    ],
    invalidTheme: "invalid theme: dark | light | system",
    invalidLocale: "invalid locale: en | ru",
    theme: (value: string) => `theme set: ${value}`,
    notFound: (command: string) => [
      `command not found: "${command}"`,
      'run "help"',
    ],
  },
  ru: {
    help: [
      "help             показать доступные команды",
      "docs             открыть документацию",
      "plugins          открыть проверенный каталог",
      "modules          открыть декларативные модули",
      "lang <locale>    en | ru",
      "theme <mode>     dark | light | system",
      "clear            очистить сессию",
    ],
    invalidTheme: "неверный режим темы: dark | light | system",
    invalidLocale: "неверная локаль: en | ru",
    theme: (value: string) => `тема установлена: ${value}`,
    notFound: (command: string) => [
      `команда не найдена: "${command}"`,
      'выполните "help"',
    ],
  },
} as const;

function sitePath(context: TerminalContext, value: string): string {
  const base = `/${context.base.split("/").filter(Boolean).join("/")}`;
  const locale = context.locale === "ru" ? "/ru" : "";
  return `${base === "/" ? "" : base}${locale}${value}`;
}

export function parseTerminalCommand(
  raw: string,
  context: TerminalContext,
): TerminalCommandResult {
  const command = raw.trim().replace(/\s+/g, " ");
  if (!command) return { kind: "noop" };

  const normalized = command.toLowerCase();
  const [name, argument, ...rest] = normalized.split(" ");
  const localeCopy = copy[context.locale];

  if (name === "help" && !argument) {
    return { kind: "output", tone: "normal", lines: [...localeCopy.help] };
  }
  if (name === "clear" && !argument) return { kind: "clear" };
  if (name === "docs" && !argument) {
    return { kind: "navigate", href: sitePath(context, "/docs/") };
  }
  if (name === "plugins" && !argument) {
    return { kind: "navigate", href: sitePath(context, "/plugins/") };
  }
  if (name === "modules" && !argument) {
    return { kind: "navigate", href: sitePath(context, "/declarative/") };
  }

  if (name === "lang" && argument && rest.length === 0) {
    if (argument !== "en" && argument !== "ru") {
      return {
        kind: "output",
        tone: "error",
        lines: [localeCopy.invalidLocale],
      };
    }
    return {
      kind: "navigate",
      href: sitePath({ ...context, locale: argument }, "/"),
    };
  }

  if (name === "theme" && argument && rest.length === 0) {
    if (argument !== "dark" && argument !== "light" && argument !== "system") {
      return {
        kind: "output",
        tone: "error",
        lines: [localeCopy.invalidTheme],
      };
    }
    return {
      kind: "theme",
      theme: argument === "system" ? "auto" : argument,
      message: localeCopy.theme(argument),
    };
  }

  return {
    kind: "output",
    tone: "error",
    lines: localeCopy.notFound(command),
  };
}
