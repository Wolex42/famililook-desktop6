# Change Log — famililook-desktop6 (FamiliMatch)

All changes must be logged here with validation status.
Format: Description / Context / Action (D/C/A)

---

## 2026-04-17 — SEO, PWA, and social discoverability fixes (CR-SEO-D6)

### CR-SEO-D6 — Full SEO/social/PWA pass for FamiliMatch
**Description:** Added all missing discoverability infrastructure: robots.txt (allows crawlers, points to sitemap), sitemap.xml (4 indexable routes), manifest.json (PWA installability), theme-color + apple-touch-icon in index.html, UTM parameter parsing in analytics (utm_source/medium/campaign/term/content + ref on every event). Generated icon-192.png, icon-512.png, and og-familimatch.png (1200x630 branded social preview) programmatically from brand SVG.
**Files changed:** `public/robots.txt` (NEW), `public/sitemap.xml` (NEW), `public/manifest.json` (NEW), `public/icon-192.png` (NEW), `public/icon-512.png` (NEW), `public/og-familimatch.png` (NEW), `index.html`, `src/utils/analytics.js`, `scripts/generate-icons.mjs` (NEW)
**Impact:** Social shares now show branded preview instead of broken image. Search engines can discover and index all public routes. UTM tracking enables attribution from social campaigns.
**Tests:** 51/51 unit PASS, 14/14 E2E PASS
**Risk Tier:** P2 (additive, no structural changes)
**Status:** COMPLETE

---

## 2026-04-17 — Fix E2E test-copy drift from Workstream B (CR-E2E-COPY-D6)

### CR-E2E-COPY-D6 — Update E2E tests to match current landing page copy
**Description:** CR-MATCH-COPY-01 (2026-04-14) changed 3 pieces of landing page copy but E2E tests were not updated. Fixed 3 failing tests: hero text ("How Compatible" → "How Alike Are You,"), CTA ("Try It Now — Free" → "Compare Now — Free"), upgrade modal ("requires Plus" → "Unlock Duo Mode").
**Files changed:** `e2e/solo-flow.spec.js`
**Tests:** 51/51 unit PASS, **14/14 E2E PASS** (was 11/14)
**Status:** COMPLETE

---

## 2026-04-17 — Sprint X Integration: @famililook/shared@0.4.0 + Icon System (CR-ICON-INT-D6)

### CR-ICON-INT-D6 — Wire shared icon system into FamiliMatch
**Description:** First-time installation of `@famililook/shared@^0.4.0` in desktop6. Created `.npmrc` (install-links=true) to prevent local symlink issues on Vercel. Wired `SharpIcon` wrapper (competitive adult register) and `featureIconMap` into `ResultsStory.jsx` — slides 2, 3, and 4 now render feature-specific icons instead of generic Check/X. Feature breakdown table rows show 14px icons alongside text labels.
**Context:** Sprint X Phase X3 icon system built in famililook-shared. This is the consumer integration sprint. Desktop6 was previously unconnected to the shared infrastructure.
**Files changed:** `.npmrc` (NEW), `package.json`, `package-lock.json`, `src/components/ResultsStory.jsx`
**Note:** FaceShapeIcon brow hint lines collapse at 14px in breakdown table — face silhouette alone carries meaning at that size. Text label alongside provides disambiguation.
**Tests:** 51/51 unit PASS, 11/14 E2E PASS (3 pre-existing LandingPage failures unrelated)
**Risk Tier:** P1 (shared package integration)
**Status:** COMPLETE

---

## 2026-04-14 — Workstream B: FamiliMatch Landing Copy + Trust Signals (CR-MATCH-COPY-01)

### CR-MATCH-COPY-01 — Landing page copy refresh
**Description:** CEO-approved copy changes (Workstream B-C3 Option A + B-C4 custom) to address trust gap and technical landing page language.

**Changes:**
1. **Badge copy** — "AI Facial Compatibility" → "Face Chemistry" (`LandingPage.jsx`)
2. **H1 copy** — "How Compatible / Are You?" → "How Alike Are You, / Really?" (`LandingPage.jsx`)
3. **Sub-head copy** — "Our AI analyses 8 facial features to discover your facial compatibility in seconds." → "Compare 8 facial features with anyone — friends, couples, siblings. Results in 10 seconds." (`LandingPage.jsx`)
4. **CTA text** — "Try It Now — Free" → "Compare Now — Free" (`LandingPage.jsx`)
5. **Trust signals added** — new trust strip below CTA: "Your photos are gone 10 seconds after your score appears. Never stored, never seen by anyone. No account." (`LandingPage.jsx`)

**Tests updated:** `LandingPage.test.jsx` — CTA button text assertion updated.

**Cross-repo impact:** None. desktop6 only.
**Risk Tier:** P2 (copy + visual, no structural changes)
**Status:** COMPLETE — 51 tests PASS, build PASS
**Quality gate:** PASSED

---

## 2026-04-13 — Phase A3: Challenge a Friend mechanic (CR-MATCH-A3)

**Risk Tier**: P1 (growth feature — viral loop)
**Approved by**: CEO (spec approved prior session, diffs approved this session)
**Executed by**: BE Lead (desktop7) + FE Lead (desktop6) agents
**Backend permission**: CEO granted for desktop7 POST /challenge/create + GET /challenge/{id} + POST /challenge/{id}/accept

| Date | Repo | Type | Description | Ref | Tier | Status |
|------|------|------|-------------|-----|------|--------|
| 2026-04-13 | desktop7 | Code | NEW app/challenges.py: 3 endpoints (create, get, accept). In-memory store, 7-day TTL, 10/IP rate limit, Pydantic validated | CR-MATCH-A3-01 | P1 | CLOSED |
| 2026-04-13 | desktop7 | Code | Registered challenges_router in main.py | CR-MATCH-A3-02 | P3 | CLOSED |
| 2026-04-13 | desktop7 | Config | Added /challenge/* route to Caddyfile → match-server:8030 | CR-MATCH-A3-03 | P2 | CLOSED |
| 2026-04-13 | desktop6 | Code | matchClient.js: added createChallenge, getChallenge, acceptChallenge API functions | CR-MATCH-A3-04 | P1 | CLOSED |
| 2026-04-13 | desktop6 | Code | App.jsx: added /challenge/:id route → ChallengePage (lazy loaded) | CR-MATCH-A3-05 | P1 | CLOSED |
| 2026-04-13 | desktop6 | Code | SoloPage.jsx: added "Challenge [Name]" button on results, creates challenge + native share | CR-MATCH-A3-06 | P1 | CLOSED |
| 2026-04-13 | desktop6 | Code | NEW ChallengePage.jsx: full challenge landing (fetch metadata, accept, photo upload, comparison, results, loop) | CR-MATCH-A3-07 | P1 | CLOSED |

**Tests**: desktop6 51/51 passed, desktop7 111/120 passed (9 pre-existing protocol count failures). Build succeeded.
**Analytics events**: challenge_created, challenge_opened, challenge_completed (with beat_challenger flag)

---

## 2026-04-13 — Hotfix: AppErrorBus inline for Vercel (CR-MATCH-HF-01)

**Risk Tier**: P2 (infrastructure — dependency removal + code inline)
**Approved by**: NOT APPROVED (governance bypass — retroactive logging)
**Executed by**: Direct edit (no agent involvement)
**Reviewed by**: Platform Architect, QA Lead, Change Manager (retroactive review 2026-04-13)

| Date | Repo | Type | Description | Ref | Tier | Status |
|------|------|------|-------------|-----|------|--------|
| 2026-04-13 | desktop6 | Code | Replaced @famililook/shared re-export with full 276-line inlined AppErrorBus module | CR-MATCH-HF-01a | P2 | CLOSED |
| 2026-04-13 | desktop6 | Dep | Removed @famililook/shared from package.json dependencies | CR-MATCH-HF-01b | P2 | CLOSED |
| 2026-04-13 | desktop6 | Dep | Regenerated package-lock.json after dependency removal | CR-MATCH-HF-01c | P3 | CLOSED |

**Governance note**: Applied without validate_scope, diff preview, or CEO approval. Retroactively logged.
**Cross-repo impact**: Disconnects desktop6 from famililook-shared. Packaging strategy unresolved for Vercel.
**Platform Architect conditions**: Add SYNC-SOURCE header. Resolve Vercel packaging strategy this sprint.
**QA Lead conditions**: Port AppErrorBus unit tests to desktop6. Zero direct test coverage currently.

---

## 2026-04-13 — Hotfix: Fusion image double data-URL prefix (CR-MATCH-HF-02)

**Risk Tier**: P3 (single-line display bugfix)
**Approved by**: NOT APPROVED (governance bypass — retroactive logging)
**Executed by**: Direct edit (no agent involvement)
**Reviewed by**: Platform Architect, QA Lead, Change Manager (retroactive review 2026-04-13)

| Date | Repo | Type | Description | Ref | Tier | Status |
|------|------|------|-------------|-----|------|--------|
| 2026-04-13 | desktop6 | Code | Added defensive data: prefix check in FusionSlide to prevent double-prefixing when backend returns full data URL | CR-MATCH-HF-02 | P3 | CLOSED |

**Governance note**: Applied without validate_scope, diff preview, or CEO approval. Retroactively logged.
**Platform Architect finding**: SYMPTOM fix — root cause is matchClient.js should normalise fusion_image. Fallback MIME type says png but backend returns jpeg. P2 action: move normalisation to matchClient.js.
**Patch count warning**: ResultsStory.jsx now at 4 patches in 30 days — exceeds 3-patch threshold. Next patch MUST route to /crew redesign.
**QA Lead conditions**: Add ResultsStory render tests for fusion image handling.

---

## 2026-04-13 — Hotfix: Hetzner .env CORS origins (CR-MATCH-HF-03)

**Risk Tier**: P2 (production server config — affects all products via desktop3)
**Approved by**: NOT APPROVED (governance bypass — retroactive logging)
**Executed by**: Direct server edit (no agent involvement)
**Reviewed by**: Platform Architect, QA Lead, Change Manager (retroactive review 2026-04-13)

| Date | Repo | Type | Description | Ref | Tier | Status |
|------|------|------|-------------|-----|------|--------|
| 2026-04-13 | desktop3 (server) | Config | Added https://familimatch.com,https://www.familimatch.com to CORS_ORIGINS env var on Hetzner | CR-MATCH-HF-03 | P2 | CLOSED |

**Governance note**: No git trace. Server-only .env change. Applied without validate_scope or CEO approval. Retroactively logged.
**Cross-repo impact**: Affects desktop3 which serves ALL products. CORS_ORIGINS env var verified to include all required domains.
**Architecture note**: config.py uses override (not merge) pattern for CORS_ORIGINS env var — fragile. P2 action: fix to merge pattern (requires CEO backend permission).

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
