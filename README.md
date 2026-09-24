# PK — Trading Platform Website

A production-ready marketing site for **PK**, a fictional online trading brand, built with
Next.js App Router, TypeScript and Tailwind CSS. The information architecture and UI patterns
are inspired by modern global broker sites, but all branding, copy and imagery are original to
PK.

## 1. Install

```bash
npm install
```

## 2. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## 3. Build for production

```bash
npm run build
npm start
```

## 4. Deploy to Vercel

1. Push this project to a GitHub/GitLab/Bitbucket repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset: **Next.js** (auto-detected). No extra configuration needed.
4. Deploy — Vercel will run `npm install` and `npm run build` automatically.

You can also deploy from the CLI:

```bash
npm i -g vercel
vercel
```

## 5. Where to change the PK logo

`components/Logo.tsx` — the logo is currently a CSS/text treatment (a rounded square with
"PK" plus the wordmark). Replace the mark with an `<Image />` pointing at
`public/images/logo.svg` if you want a custom SVG logo instead.

## 6. Where to change colors

`app/globals.css` — all brand colors are defined as CSS variables at the top of the file under
`:root` (e.g. `--pk-accent`, `--pk-bg`, `--pk-surface`). Change the hex values there and the
whole site updates. They're re-exposed to Tailwind via the `@theme inline` block just below, as
utilities like `bg-accent`, `text-text-muted`, `border-border`, etc.

## 7. Where to change navigation

`data/navigation.ts` — desktop mega menus, mobile nav sections, the language list, and the
"Payments" top-level link are all data-driven from this file. Add, remove, or edit menu items,
links, descriptions and icons here; `components/Navbar.tsx`, `components/MegaMenu.tsx` and
`components/MobileNav.tsx` render whatever this file contains.

## 8. Where to change market/platform content

- `data/markets.ts` — the six market cards (Forex, Derived Indices, Stocks, etc.)
- `data/platforms.ts` — the four platform cards (PK MT5, PK Trader, PK Copy, PK Bot)
- `data/technology.ts` — the trading-technology feature grid
- `data/stats.ts` — the animated trust/statistics numbers
- `data/steps.ts` — the 3-step "Get started" section
- `data/footer.ts` — every footer column and link

Each file exports a typed array consumed by its matching section component, so editing content
never requires touching JSX.

## 9. Where to replace images

This build uses inline SVG and CSS-gradient visuals (hero chart, 24-hour clock, phone mockup) so
the project runs with zero external image dependencies. To swap in real photography or
illustrations:

- Drop files into `public/images/` (subfolders suggested: `hero/`, `markets/`, `platforms/`,
  `payments/`, `app/`, `icons/`).
- Import and render them with `next/image` in the relevant component (e.g.
  `components/Hero.tsx`, `components/MarketCard.tsx`).

## 10. Where to configure Login / Register URLs

Both buttons across the site (`components/Navbar.tsx`, `components/MobileNav.tsx`,
`components/Hero.tsx`, `components/CTASection.tsx`) point at the placeholder routes `/login`
and `/register`, implemented at `app/login/page.tsx` and `app/register/page.tsx`. Point these
`href`s at your real auth provider or update the placeholder pages directly to wire up a real
backend.

## Project structure

```
app/                Routes: home, /login, /register, robots.ts, sitemap.ts
components/          Reusable, typed UI components (Navbar, Hero, sections, cards, Button…)
data/                Typed content arrays that drive navigation, markets, platforms, footer…
public/images/       Static asset folders for future image replacement
app/globals.css      Brand color tokens, typography tokens, base styles, animation primitives
```

## Notes

- **Fonts**: Inter (body) and Manrope (display/headings) are loaded via a Google Fonts CSS
  `@import` in `app/globals.css` with system-font fallbacks, so the app builds and renders even
  without network access; swap in `next/font/google` if you prefer self-hosted fonts.
- **Icons**: [lucide-react](https://lucide.dev).
- **No regulatory claims**: the footer intentionally uses a placeholder regulatory notice — do
  not publish this site publicly without adding real, accurate licensing information.
- **Accessibility**: semantic landmarks, visible focus states, `aria-expanded`/`aria-label`
  attributes on interactive nav elements, and `prefers-reduced-motion` support are built in.
