// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://ohtoe02.github.io",
  base: process.env.SITE_BASE ?? "/ohtools-web",
  integrations: [
    starlight({
      title: "ohtools",
      description:
        "Verified documentation, declarative modules, and plugin catalog for ohtools.",
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        ru: { label: "Русский", lang: "ru" },
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/ohtoe02/ohtools-web",
        },
      ],
      components: {
        Header: "./src/components/overrides/ShellHeader.astro",
        PageTitle: "./src/components/overrides/ShellPageTitle.astro",
      },
      customCss: ["./src/styles/custom.css"],
      sidebar: [
        {
          label: "Portal",
          items: [
            { label: "Overview", slug: "index" },
            { label: "Declarative modules", link: "/declarative/" },
            { label: "Plugin catalog", link: "/plugins/" },
          ],
        },
        {
          label: "Documentation",
          items: [{ autogenerate: { directory: "docs" } }],
        },
      ],
      head: [
        {
          tag: "meta",
          attrs: {
            name: "theme-color",
            content: "#070b08",
            media: "(prefers-color-scheme: dark)",
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "theme-color",
            content: "#f6f2e7",
            media: "(prefers-color-scheme: light)",
          },
        },
        {
          tag: "meta",
          attrs: {
            "http-equiv": "Content-Security-Policy",
            content:
              "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; font-src 'self'; base-uri 'self'; form-action 'none'",
          },
        },
      ],
    }),
  ],
});
