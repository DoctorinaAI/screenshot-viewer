# Design Vision

The viewer is an internal tool — content density and scannability beat decoration. The target audience is engineers triaging integration-test output, so the design favours quick recognition (status pills, branch chips, language flags) over hero imagery.

## Principles

1. **Design system first.** No screen ships until its primitives exist in `src/shared/ui/`. Pages compose components; they don't reinvent layout.
2. **Adaptive, mobile-first.** Every layout works at 360 px wide and scales up. Run cards collapse to a single column on phones; the run-page grid switches grouping behaviour at narrow breakpoints.
3. **Reuse the foxic vocabulary.** Pull components and tokens from [foxic/client](https://github.com/plugfox/foxic/tree/main/client/src/shared/ui) where they exist — same shadcn flavour, same CVA + Tailwind + Kobalte stack. Adapt naming for this domain (`RunCard`, `ShotCell`, `GroupingSwitcher`).
4. **No hand-rolled accessibility.** If a control needs focus trapping, ARIA roles, or keyboard navigation, it goes through Kobalte. Plain HTML is reserved for buttons, badges, cards.
5. **Content over chrome.** No decorative gradients, no animations that delay interaction. Skeleton loaders for everything that takes more than ~100 ms.
6. **State is visible.** Status pill on every run card. Per-shot `status` (`ok` / `warning` / `failed`) is shown as a small badge in the corner of each tile. Failed shots float to the top of their group.

## Layout breakpoints

Mirror Tailwind defaults; do not invent custom names.

| Breakpoint | Width | Run-card grid | Run-page shot grid |
|---|---|---|---|
| (base) | < 640 px | 1 col | 1 col, grouping selector as sticky bottom bar |
| `sm` | ≥ 640 px | 2 col | 2 col |
| `md` | ≥ 768 px | 2 col | 3 col, sidebar pushes content |
| `lg` | ≥ 1024 px | 3 col | 4 col, fixed sidebar |
| `xl` | ≥ 1280 px | 4 col | 5–6 col |

## Theme

- Light + dark, system preference by default. Theme switcher in the header.
- Tokens defined as CSS custom properties on `:root` and `:root.dark`; Tailwind reads them via `@theme inline { ... }` (v4 syntax).
- Status colours are semantic (`--color-status-ok`, `--color-status-warning`, `--color-status-failed`), not raw red/green/yellow — keeps room to retune contrast.

## Component checklist (Milestone 1)

These exist in foxic and should be ported / adapted first:

- [ ] `button` — variants: default, secondary, destructive, outline, ghost, link. Sizes: sm, md, lg, icon.
- [ ] `badge` — status, branch, language, neutral.
- [ ] `card` — `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- [ ] `input` + `textarea` + `label`.
- [ ] `select` (Kobalte) — filter dropdowns.
- [ ] `dialog` (Kobalte) — fullscreen image viewer.
- [ ] `dropdown-menu` (Kobalte) — overflow actions on cards.
- [ ] `popover` (Kobalte) — filter pickers.
- [ ] `tooltip` (Kobalte) — hover hints on truncated commit subjects, status chips.
- [ ] `tabs` (Kobalte) — grouping switcher.
- [ ] `table` — debug / details views (e.g., shot metadata drawer).
- [ ] `skeleton` — loading placeholders.
- [ ] `switch`, `checkbox` — filter toggles.
- [ ] `separator` — section dividers.
- [ ] `avatar` — author avatars on run cards.

## Out of scope for the design system

- Charts. We have no aggregate metrics yet. Add when needed.
- Forms. The only inputs are filters; no validation, no submit semantics beyond Firestore queries.
- Notifications / toasts beyond a single error toast on sign-in failure.

## Showcase route

`/ui-kit` lists each component with all its variants — same pattern as foxic's `ui-kit.html`. Used during the design-system milestone as a visual contract and afterwards as a regression check.
