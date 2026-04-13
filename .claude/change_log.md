# Change Log — famililook-desktop6 (FamiliMatch)

All changes must be logged here with validation status.
Format: Description / Context / Action (D/C/A)

---

## 2026-04-13 — Phase A2: Viral unlock — result reveal + share card (CR-MATCH-A2)

**Risk Tier**: P1 (growth feature)
**Approved by**: CEO (Visual Director spec approved with 3 additions)
**Executed by**: FE Lead agent | **Verified by**: QA Lead agent

| Date | Repo | Type | Description | Ref | Tier | Status |
|------|------|------|-------------|-----|------|--------|
| 2026-04-13 | desktop6 | Dep | Added canvas-confetti@^1.9.3 (4KB gzipped, lazy loaded) | CR-MATCH-A2-01 | P1 | CLOSED |
| 2026-04-13 | desktop6 | Code | Enhanced PercentageSlide: slower spring (120/12), 600ms delay, 72px text, glow pulse, names + feature count display | CR-MATCH-A2-02 | P1 | CLOSED |
| 2026-04-13 | desktop6 | Code | Confetti celebration: >= 75% light burst (40 particles), >= 90% full celebration (80 + second burst) | CR-MATCH-A2-03 | P1 | CLOSED |
| 2026-04-13 | desktop6 | Code | ShareCard.jsx full rewrite: 9:16 format (1080x1920), SVG person icon fallback, familimatch.com/?ref=share URL | CR-MATCH-A2-04 | P1 | CLOSED |
| 2026-04-13 | desktop6 | Code | Share flow: navigator.share() with Blob image, clipboard copy fallback on desktop, download final fallback | CR-MATCH-A2-05 | P1 | CLOSED |
| 2026-04-13 | desktop6 | Code | SoloPage header: removed back-to-hub portal transition, clean branded header with Back to landing | CR-MATCH-A2-06 | P1 | CLOSED |
| 2026-04-13 | desktop6 | Code | Share CTA copy changed to "Share Your Score" across Solo + Duo results | CR-MATCH-A2-07 | P1 | CLOSED |

**Tests**: 51/51 passed, build succeeded. Quality floor maintained.
**CEO additions implemented**: (1) Person SVG fallback for missing names (2) ?ref=share tracking URL (3) Blob-based navigator.share()

---

## 2026-04-13 — Phase A1: Fix broken FamiliMatch product (CR-MATCH-A1)

**Risk Tier**: P1 (product growth blocker)
**Approved by**: CEO
**Executed by**: FE Lead agent | **Verified by**: QA Lead agent

| Date | Repo | Type | Description | Ref | Tier | Status |
|------|------|------|-------------|-----|------|--------|
| 2026-04-13 | desktop6 | Code | A1.1: Removed back button from landing page header — FamiliMatch is standalone, not a sub-product | CR-MATCH-A1-01 | P1 | CLOSED |
| 2026-04-13 | desktop6 | Code | A1.2: Fixed upgrade flow — Duo/Group upgrade now opens famililook.com/plans in new tab instead of navigating away | CR-MATCH-A1-02 | P1 | CLOSED |
| 2026-04-13 | desktop6 | Code | A1.3: Removed fabricated "Thousands of comparisons made" counter — no fake social proof | CR-MATCH-A1-03 | P1 | CLOSED |
| 2026-04-13 | desktop3 | Code | A1.4: Added familimatch.com + www.familimatch.com to CORS allowed origins | CR-MATCH-A1-04 | P1 | CLOSED |
| 2026-04-13 | desktop7 | Code | A1.4: Added familimatch.com + www.familimatch.com + Vercel URL to CORS defaults | CR-MATCH-A1-04 | P1 | CLOSED |

**Tests**: 51/51 passed, build succeeded. Quality floor maintained.
**Removed unused imports**: `reversePortalTransition`, `ChevronLeft`, `useComparisonCount`

---

## 2026-04-14 — Sprint D2: Wire AppErrorBus from famililook-shared (CR-ERRORBUS-D6-01)

**Description:** Wired AppErrorBus from famililook-shared into desktop6. Created re-export shim at `src/infrastructure/AppErrorBus.js`. Copied ErrorToast component and mounted in App.jsx. Migrated `useMatchHistory.addEntry` quota failure to `reportError()` (user now sees toast instead of silent data loss). 16 remaining catches are legitimate graceful degradation — annotated with `eslint-disable-line no-empty` comments for future ESLint enforcement.

**Files added:** `src/infrastructure/AppErrorBus.js`, `src/components/ui/ErrorToast.jsx`
**Files modified:** `src/App.jsx`, `src/api/matchClient.js`, `src/utils/analytics.js`, `src/hooks/useMatchHistory.js`, `src/hooks/useMatchConnection.js`, `src/state/ConsentContext.jsx`, `src/state/MatchContext.jsx`, `src/pages/LandingPage.jsx`
**Cross-repo impact:** None — consuming shared package, no changes to shared package.
**Deferred:** AppStorage migration — requires Platform Architect key schema design for multi-product support.
**Tests:** 51 unit + 14 E2E PASS, build PASS
**Status:** COMPLETE

---

## 2026-04-14 — Sprint D1: Playwright E2E setup (CR-E2E-D6-01)

**Description:** Installed Playwright with Chromium. Created `playwright.config.js` (port 5174, iPhone 14 Pro viewport, strictPort). Added `test:e2e` script. Created `e2e/solo-flow.spec.js` with 14 E2E tests covering:
- Landing page (hero, mode cards, tier gating, upgrade modal, privacy/terms links)
- Solo flow navigation (consent gate, upload UI, compare button state, back button with onboarding dismissal)
- Privacy note visibility
- Direct URL navigation (/solo, /privacy, /terms, unknown routes)

**Files added:** `playwright.config.js`, `e2e/solo-flow.spec.js`
**Files modified:** `package.json` (added @playwright/test + test:e2e script)
**Tests:** 51 unit tests + 14 E2E tests PASS, build PASS
**Status:** COMPLETE

---

## 2026-04-14 — Wire @famililook/shared dependency (CR-SHARED-WIRE-D6)

**Description:** Added `@famililook/shared: file:../famililook-shared` to dependencies. npm creates symlink at node_modules/@famililook/shared → ../../famililook-shared. No source code changes — desktop6 is not yet consuming any shared modules in its source.
**Context:** Session A2. Part of Sprint A (Shared Package Completion). Desktop6 is now wired alongside desktop2 and desktop4.
**Cross-repo impact:** None — dependency wiring only, no behaviour change.
**Tests:** 51 passing, build PASS.
**Commit:** 49e78f6
**Status:** COMPLETE

---

## 2026-03-31 | Sprint 0A — FamiliMatch Source Restoration (Pending)

**Description**: Full source restoration of FamiliMatch FE — 15 files spanning config, state, components, and utilities. Partial rewrite to rebuild the FamiliMatch experience from desktop6 skeleton.

**Context**: Sprint 0A initiated to restore FamiliMatch source code. No backend changes. No contract changes (compare_faces.v1 remains frozen). Product is deployed but source needs restoration for maintainability and further development.

**Risk Tier**: P1 (Significant — multi-file, partial rewrite, affects live product)

**Scope validation**: Pending working_set.txt update

**Files** (15 total):
- `famililook-desktop6/index.html`
- `famililook-desktop6/vite.config.js`
- `famililook-desktop6/src/main.jsx`
- `famililook-desktop6/src/App.jsx`
- `famililook-desktop6/src/state/ConsentContext.jsx`
- `famililook-desktop6/src/state/MatchContext.jsx`
- `famililook-desktop6/src/components/ConsentModal.jsx`
- `famililook-desktop6/src/components/PhotoUpload.jsx`
- `famililook-desktop6/src/components/OnboardingScreen.jsx`
- `famililook-desktop6/src/components/FeatureScanAnimation.jsx`
- `famililook-desktop6/src/components/ResultsStory.jsx`
- `famililook-desktop6/src/components/RoomLobby.jsx`
- `famililook-desktop6/src/components/CountdownOverlay.jsx`
- `famililook-desktop6/src/utils/config.js`
- `famililook-desktop6/src/utils/constants.js`

**Status**: PENDING CEO APPROVAL

---

## 2026-03-31 | Sprint 3: Quality + Polish (CR-0010)

**Risk Tier**: P2–P3 (mixed)
**Approved by**: CEO
**Executed by**: FE Lead agent | **Verified by**: QA Lead agent

| Date | Repo | Type | Description | Ref | Tier | Approver | Status |
|------|------|------|-------------|-----|------|----------|--------|
| 2026-03-31 | desktop6 | Code | FM-007: Name passthrough — compareSolo() accepts nameA/nameB params; SoloPage passes userName and personBName with fallback defaults | FM-007 | P2 | CEO | CLOSED |
| 2026-03-31 | desktop6 | Code | FM-017: Fabricated counter — useComparisonCount() returns "Thousands of" instead of fake incrementing number on LandingPage | FM-017 | P3 | CEO | CLOSED |

---

## 2026-03-31 | Sprint 2: DFMEA + Gap Analysis Fixes (CR-0009)

**Risk Tier**: P2
**Approved by**: CEO
**Executed by**: FE Lead agent | **Verified by**: QA Lead agent

| Date | Repo | Type | Description | Ref | Tier | Approver | Status |
|------|------|------|-------------|-----|------|----------|--------|
| 2026-03-31 | desktop6 | Code | FM-006: Test coverage — 6 test files (matchClient, LandingPage, ConsentContext, MatchContext, config, constants) with 51 passing tests | FM-006 | P2 | CEO | CLOSED |
| 2026-03-31 | desktop6 | Code | FM-009: JWT-based tier gating — LandingPage.jsx uses signed token instead of ?tier= URL param, useMatchConnection.js passes token to WebSocket, MatchContext stores tierToken | FM-009 | P2 | CEO | CLOSED |
| 2026-03-31 | desktop6 | Code | DFMEA-FM-05: WebSocket auto-reconnection — useMatchConnection.js has exponential backoff reconnect with REJOIN_ROOM protocol, RoomPage.jsx shows reconnecting banner | DFMEA-FM-05 | P2 | CEO | CLOSED |

---

## 2026-03-31 | Sprint 1: Revenue + Critical UX (CR-0008)

**Risk Tier**: P2
**Approved by**: CEO
**Executed by**: FE Lead agent | **Verified by**: QA Lead agent

| Date | Repo | Type | Description | Ref | Tier | Approver | Status |
|------|------|------|-------------|-----|------|----------|--------|
| 2026-03-31 | desktop6 | Code | FM-012: Consent check (bipaConsented) added to auto-navigation useEffect on LandingPage; pending mode + consent modal flow | FMEA-FM-012 | P2 | CEO | CLOSED |
| 2026-03-31 | desktop6 | Code | GAP-01: Error card with "Try Again" button added between analysis and results phases on SoloPage | FMEA-GAP-01 | P2 | CEO | CLOSED |

---

## 2026-03-31 | Sprint 0A Close — Item-Level Change Entries

### FM-001: Build Infrastructure Restored
**Description**: Restored `index.html`, `vite.config.js`, `src/main.jsx`, `src/App.jsx` — the four files required for Vite to build and mount the React app.
**Context**: Build was failing with missing entry point. Sprint 0A priority item.
**Action**: Files created from FamiliMatch architecture spec. Build now succeeds (`npm run build` PASS).
**Risk Tier**: P1
**Status**: CLOSED

### FM-002: matchClient.js Import Resolved
**Description**: `matchClient.js` had an unresolved import of `constants.js`. Created `src/utils/constants.js` with API endpoints and configuration constants.
**Context**: Runtime crash on any API call due to missing module.
**Action**: `constants.js` created with correct exports. Import chain verified.
**Risk Tier**: P2
**Status**: CLOSED

### FM-003: State Contexts Restored
**Description**: Restored `src/state/ConsentContext.jsx` and `src/state/MatchContext.jsx` — the two React contexts required by App.jsx provider tree.
**Context**: App would not render without context providers. ConsentContext manages GDPR consent state; MatchContext manages match session state.
**Action**: Both context files created with correct provider/hook exports.
**Risk Tier**: P1
**Status**: CLOSED

### FM-004: Components and Pages Restored
**Description**: Restored 7 components (`ConsentModal`, `PhotoUpload`, `OnboardingScreen`, `FeatureScanAnimation`, `ResultsStory`, `RoomLobby`, `CountdownOverlay`) and 3 pages (`ResultsPage`, `PrivacyPage`, `TermsPage`).
**Context**: UI was a skeleton with no interactive components or legal pages. All components referenced by App.jsx routes.
**Action**: 10 files created. Components follow FamiliMatch brand (blue-indigo palette). Pages follow platform legal templates.
**Risk Tier**: P1
**Status**: CLOSED

### FM-005: Utility Config Files Restored
**Description**: Restored `src/utils/config.js` and `src/utils/constants.js` — runtime configuration and API constants.
**Context**: Multiple components import from these utilities. Missing files caused cascading import failures.
**Action**: Both files created with environment-aware configuration (dev/prod API URLs).
**Risk Tier**: P2
**Status**: CLOSED

### FM-INFRA: Tailwind + PostCSS + Index CSS
**Description**: Created `tailwind.config.js`, `postcss.config.js`, and `src/index.css` — CSS build pipeline for Tailwind utility classes.
**Context**: Components use Tailwind classes throughout. Without these files, all styling was missing.
**Action**: Three files created. Tailwind config includes FamiliMatch brand colours. PostCSS configured with tailwind and autoprefixer plugins.
**Risk Tier**: P2
**Status**: CLOSED

### FM-MOD: Landing and Room Page Updates
**Description**: Modified `src/pages/LandingPage.jsx` and `src/pages/RoomPage.jsx` to integrate with restored components and state contexts.
**Context**: Pre-existing pages needed updates to work with the newly restored component tree.
**Action**: Both files updated with correct imports and component usage.
**Risk Tier**: P2
**Status**: CLOSED

---

### Sprint 0A Totals
- **New files created**: 21
- **Files modified**: 2 (LandingPage.jsx, RoomPage.jsx)
- **Total files in scope**: 23
- **Build status**: PASS
- **Contract impact**: None (compare_faces.v1 remains FROZEN)

---
