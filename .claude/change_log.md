# Change Log — famililook-desktop6 (FamiliMatch)

All changes must be logged here with validation status.
Format: Description / Context / Action (D/C/A)

---

### 2026-04-25 — A-HOTFIX CI follow-up: Vitest grep flag + shared-journey env (PR #1)

**Risk Tier:** P2 (CI / config only — zero product source touched)
**Branch:** `hotfix/a-card5-clipping-integrity` (follow-up commit, NOT amend of `a420d8bd`)
**Approved by:** CEO (session A-HOTFIX-CI-FIX-2026-04-25 spawn brief)
**Executed by:** FE Lead agent (desktop6)
**Files touched:** 2 — `.github/workflows/verify.yml`, `vite.config.js` (+ this change_log)

**Description:**
PR #1 had two failing CI checks. Product code on Vercel preview verified
correct by CEO device test, so this commit only addresses CI/test config:

1. *Contract Schema Validation job* — workflow ran
   `npm run test:run -- --grep "contract"`. `--grep` is a Mocha/Jest-CLI
   flag and was rejected by Vitest 2.x. Replaced with the Vitest-native
   equivalent `-t "contract"` (testNamePattern). Added `--passWithNoTests`
   so the job stays green while desktop6 has zero contract-tagged tests
   (contracts currently validated upstream in famililook-shared / desktop3).

2. *Run unit tests job* — three new `extraAction` tests in
   `tests/components/ResultsStory.test.jsx` (lines 329, 345, 359) query
   `role="navigation"` which only renders on the shared-journey path
   (`VITE_USE_SHARED_JOURNEY === 'true'`). Local passes because the env
   var is set in shell; CI failed because nothing set it. Belt-and-braces
   fix: added `test.env.VITE_USE_SHARED_JOURNEY = 'true'` to `vite.config.js`
   so `npm run test:run` produces identical results in any shell, AND
   added `env: VITE_USE_SHARED_JOURNEY: 'true'` to the workflow's unit-test
   and build steps for redundancy.

**Constraint compliance:**
- No product source modified (ResultsStory.jsx, SoloPage.jsx,
  ChallengePage.jsx untouched).
- No test logic modified (queries are correct; only environment wiring fixed).
- Single follow-up commit, not an amend of `a420d8bd`.

**Verification:**
- `npm run test:run` (with shell env unset to simulate CI): 119 / 119 PASS.
- `npm run build`: PASS.
- `npm run test:run -- -t "contract" --passWithNoTests`: exits 0 (119 skipped).

**Status:** CLOSED pending CI green on PR #1.

---

### 2026-04-25 — A-HOTFIX v2: FamiliMatch results visual clipping + Card 5 integrity fix (Solo + Challenge)

**Risk Tier:** P1 (production hotfix — visual correctness + dark-pattern integrity)
**Branch:** `hotfix/a-card5-clipping-integrity` (off `main` at `c079bb35`)
**Approved by:** CEO (consolidation gate v2 signed off 2026-04-25)
**Spec authors:** Mobile UX Lead (visual + addendum), User Psychology Lead (integrity), Copywriter (Variant 2 wording)
**Consolidation:** Change Manager — `Agent_1/crew/output/GATE_REPORT_A_HOTFIX_v2_2026_04_25.md` (supersedes v1)
**Executed by:** FE Lead agent
**Verified by:** QA Lead agent + CEO physical-device verification (iPhone, including deep-link `/challenge/<id>` test) — pending

**Description:**
Two distinct defects fixed in one atomic PR on the
`if (USE_SHARED_JOURNEY)` branch of `src/components/ResultsStory.jsx`,
applied across two consumer surfaces (`SoloPage`, `ChallengePage`):

1. *Visual clipping* — replaced magic `140px` chrome reservation with a
   measured `--results-chrome-height` CSS variable (set via ResizeObserver
   on the chrome bar element); lifted Go Back / Try Again into a
   `position: fixed` action bar respecting `env(safe-area-inset-bottom)`;
   added optional `extraAction` prop to ResultsStory so deep-link entry
   surfaces can inject a third button into the bar; deleted duplicate
   Share/Challenge stack on `SoloPage.jsx` (lines 290–317); deleted
   "Share Your Score" on `ChallengePage.jsx` (lines 336–346) and lifted
   "Challenge Someone Else" into the fixed bar via the new prop;
   replaced `100vh` with `100dvh`; added persistent chevron gesture cue.
   ResultsPage explicitly NO-EDIT (benign — single CTA, inherits
   ResultsStory-internal fixes).

2. *Card 5 integrity violation* — removed fabricated `BASELINE = 2847` +
   random-interval `setTimeout` `+1` tick (the canonical "fake counter"
   pattern named verbatim in User Psychology Lead persona charter §4.5
   and forbidden by §7.1). Replacement: **Variant 2** — real
   "X of 8 features" callback sourced from
   `results.feature_comparisons.filter(c => c.match).length` —
   contract-frozen `compare_faces.v1` field. **Static display** — no
   count-up animation (the entire timing surface that produced the
   dark pattern is gone). Three branches:
   - default (2 ≤ N ≤ 7): "{N} of 8 features in common." (no sub-line)
   - low guard (N ≤ 1): "Your faces tell a different story." +
     "Less in the features, more in the chemistry."
   - high edge (N = 8): "8 of 8 features in common." (no sub-line)

**Persona charter clauses cited:**
- User Psychology Lead §4.5 (authenticity detector — "fake counters
  trigger immediate distrust") — DIRECT VIOLATION pre-fix.
- User Psychology Lead §7.1 (no dark patterns — "off the table
  permanently") — DIRECT VIOLATION pre-fix.
- User Psychology Lead §4.3 (trust architecture — fake counter is a
  benevolence-trust leak).
- Mobile UX Lead non-negotiable #5 (physical-device verification).

**Pattern introduced:** 2026-04-20 commit `ed83cf48`
("feat(desktop6): redesign 4 SwipeJourney cards — emotional UX sprint").
The persona charter was dated 2026-04-14 — six days before the commit;
the non-negotiable was already in force when the violation landed.
Surface in next `SESSION_PROTOCOL.md` retrospective alongside the
2026-04-22 FMEA consolidation gap.

**`extraAction` prop signature (PINNED, gate report §1.4):**
```ts
extraAction?: { label: string; onClick: () => void }
```
Optional. SoloPage and ResultsPage do not pass it. ChallengePage passes
`{ label: 'Challenge Someone Else 🎯', onClick: () => navigate('/') }`.
No `variant`, no `disabled`, no `aria-label`. Defensive render: only
render the third button when both `label` is truthy AND
`typeof onClick === 'function'`. Third button always uses the same
gradient as "Try Again" — consumers do not pick a button colour.

**Files changed:**
- `famililook-desktop6/src/components/ResultsStory.jsx`
- `famililook-desktop6/src/pages/SoloPage.jsx`
- `famililook-desktop6/src/pages/ChallengePage.jsx`
- `famililook-desktop6/tests/components/ResultsStory.regression.test.jsx`
  (3 new branch tests + 1 negative-assertion + 2 boundary + 1 floor edge)
- `famililook-desktop6/tests/components/ResultsStory.test.jsx`
  (4 new `extraAction` prop tests + 3 chrome-measurement tests)
- `famililook-desktop6/playwright.config.js` (+5 device projects)
- `famililook-desktop6/e2e/results-story-visual.spec.js` (new)
- `famililook-desktop6/e2e/challenge-results-visual.spec.js` (new)

**Files explicitly NOT changed:**
- `famililook-desktop6/src/pages/ResultsPage.jsx` — benign, no edit
  (cross-route grep result, recorded in PR description).

**Cross-repo impact:** None.
- `famililook-shared` not touched. SwipeJourney prop surface unchanged.
- `compare_faces.v1` schema not touched.
- `journeyConfig.js` not touched. Card 5 stays in slot 5; only its body
  changes.

**Tests:**
- Unit + regression: 106 → 119 (3 new Variant 2 branch tests + 1
  negative-assertion + 2 boundary tests + 1 floor edge + 4 extraAction
  prop tests + 3 chrome-measurement tests; 1 prior dark-pattern
  assertion rewritten). PASS.
- E2E existing: 14 → 14 (chromium project, all green). PASS.
- E2E new visual specs (results-story + challenge-results): scaffolded
  for 5-device matrix; baselines captured during CEO + QA Lead
  device-matrix verification round (iPhone SE, iPhone 13, iPhone 15
  Pro Max, Pixel 7, Galaxy S22).
- Build: PASS.
- CEO physical-device verification: PENDING (iPhone — bottom content
  visible across all 8 cards both flows; action bar above safe-area;
  Variant 2 copy renders all three branches; no fabricated counter;
  deep-link `/challenge/<id>` shows three buttons; ResultsPage
  unchanged).

**Patch-count note (FE Lead spawn brief §7 row 5):** `ResultsStory.jsx`
shows 11 patches in last 30 days (above the "3+ HALT" threshold).
Surfaced for retrospective: most patches are unrelated (X5 SwipeJourney
integration, X6 Currency wiring, A1/A2/A3 phases, fusion image fix).
CEO-signed v2 gate report explicitly authorised this work; no /crew
redesign route invoked. Recommend QA Lead triage entry for next
SESSION_PROTOCOL retro.

**Out of scope (separate tickets):**
- IA-02 + IA-03 (RareStat percentile / rarity copy) — escalated to next
  sprint.
- IA-04 (LandingPage decorative "78%" illustration) — backlog.
- IA-05 (`ScienceExplainer: SocialProof` component-name mismatch) —
  backlog.
- B-work: apex share rewiring, peek-of-next-card, 8 → 5 reorder,
  DuoUpgrade / ChemistryLabel / SocialProof refactor away from
  `position: absolute` — separate sprint.

**Rollback:**
`VITE_USE_SHARED_JOURNEY=false` reverts the entire hotfix — both
visual and integrity changes live inside the
`if (USE_SHARED_JOURNEY)` branch. `ResultsStory.legacy.jsx` is
verified not to contain `BASELINE = 2847`.

**FMEA updates (post-merge):**
- New rows FM-X5-06 (chrome-measurement fallback), FM-X5-07
  (CSS variable cleanup), FM-X5-08 (Card 5 fake counter — RPN 729,
  FIXED by this hotfix), FM-X5-09 (extraAction prop seam),
  FM-X5-10 (ChallengePage deep-link forward primitive — DO NOT delete
  guard), FM-X5-11 (ResultsPage benign-by-inheritance audit anchor).
- Note added to FM-X5-04 — underlying height calc now derives from
  measured CSS variable.

**Specs:**
- `Agent_1/crew/output/SPEC_A_HOTFIX_VISUAL_FIX_MOBILE_UX_2026_04_25.md`
- `Agent_1/crew/output/SPEC_A_HOTFIX_VISUAL_FIX_MOBILE_UX_ADDENDUM_2026_04_25.md`
- `Agent_1/crew/output/SPEC_A_HOTFIX_INTEGRITY_FIX_PSYCHOLOGY_2026_04_25.md`
- `Agent_1/crew/output/SPEC_A_HOTFIX_COPYWRITER_VARIANT_OPTIONS_2026_04_25.md`
- `Agent_1/crew/output/GATE_REPORT_A_HOTFIX_v2_2026_04_25.md`

**Discovery reports:**
- `Agent_1/crew/output/DISCOVERY_REPORT_FAMILIMATCH_RESULTS_MOBILE_UX_2026_04_25.md`
- `Agent_1/crew/output/DISCOVERY_REPORT_FAMILIMATCH_RESULTS_PSYCHOLOGY_2026_04_25.md`

**Status:** CLOSED (pending CEO physical-device verification + push)

---

### 2026-04-22 — P1 hotfix: OnboardingScreen overlay no longer intercepts upload taps

InPrivate / fresh-session users saw upload tiles on /solo but taps did
nothing — OnboardingScreen's fixed inset-0 z-50 overlay was absorbing
pointer events. 6 parallel investigation agents confirmed via Playwright
repro that `onClick` never fired. This was pre-existing but masked by
localStorage state from returning users.

Root cause: SoloPage.jsx rendered <OnboardingScreen> whenever
`!userName` (sessionStorage empty). The overlay uses the same dark
gradient as the page beneath, so users perceived the upload tiles but
every tap hit the transparent-looking overlay form instead.

Fix (SoloPage.jsx only, OnboardingScreen left in place unused):
- Removed OnboardingScreen import + <AnimatePresence> render block.
- Removed `showOnboarding` state.
- Added inline "Your name" input next to the Photo A tile, mirroring
  the existing "Their name" pattern for Photo B. Uses MatchContext's
  `setUserName` — same persistence semantics as before.
- `userName` is already fallback-guarded at every use site
  (`userName || 'You'`, `userName || 'Photo A'`) — removal is safe.

Tests: 106 pass. Build pass. New bundle: index-DI-X8f2D.js.

---

### 2026-04-22 — P1 hotfix: defer /detect until BIPA consent granted

Silent upload failure for first-time users. d6 UX has consent-after-upload
but shared pipeline was calling /detect on file select → 403 auth_required
→ pipe.status='error' → no preview, no onPhotoReady, nothing happens.

Fix (PhotoUpload.jsx only, no shared package change):
- processFile branches on consent.bipaConsented. Pre-consent: legacy
  FileReader → preview + onPhotoReady (no /detect call). Post-consent:
  full pipe.submit() pipeline.
- zero_faces auto-snip useEffect guards on consent too (belt+braces).

Tests: 106+ pass. Build pass.

---

### 2026-04-22 — Sprint E7 Wave 2 — bump shared pin to rc.2 (P1 follow-up)

Bumped `@famililook/shared` pin `0.10.0-rc.1` → `0.10.0-rc.2` after
P1 production failure on familimatch.com today. Root cause was in shared
(field name mismatch + render loop), not in the d6 wrapper. Wrapper
unchanged.

Flag defaults UNCHANGED: `.env.production=false` (legacy path runs in prod
by default). CEO flips Vercel dashboard env var to `true` + redeploy to
test rc.2 in production when ready.

Validation:
- shared@0.10.0-rc.2 installed, `lib/upload/useFaceValidation.js` contains `formData.append('file'`
- d6 unit tests: 106/106 passing
- d6 build: OK
- d6 E2E: 14/14 passing
- No source code changes in d6 (pin-only bump)

---

### 2026-04-22 — Sprint E7 Wave 2: wire shared upload pipeline rc.1

Bumped `@famililook/shared` pin `^0.9.9` → `0.10.0-rc.1` (exact pre-release pin;
caret on pre-release does NOT span minors in npm).

`src/components/PhotoUpload.jsx` refactored as strangler-fig wrapper. Flag
`VITE_USE_SHARED_UPLOAD_PIPELINE=false` in prod on first deploy (safe no-op);
toggle to `true` in Vercel after CEO verification. Dev/staging default true.

Shared branch uses `useUploadPipeline` + `FacePickerModal` + `FaceSnipModal`
from `@famililook/shared/upload`. Per CEO Option C: per-participant upload
only. WebSocket room logic, MatchContext, multiplayer room flow UNTOUCHED.

Local AppErrorBus fork still passed as `errorBus` prop (unchanged).
Legacy implementation preserved behind flag for 72h soak strangler-fig.

Parent contract `onPhotoReady(dataUrl: string)` preserved in both branches —
shared branch converts processed File → dataUrl via `fileToDataUrl` before
emit so SoloPage/RoomPage/ChallengePage consumers do NOT change.

Tests: 106/106 unit, 14/14 E2E pass. Build pass.

---

### 2026-04-21 — Sprint E5b: wire shared ErrorToast (0.9.9)

Replaced local ErrorToast import in App.jsx with @famililook/shared/components/ErrorToast.
Passes `bus={localBus}` prop because d6's AppErrorBus is a local fork (not a shared re-export like d2).
Without the prop, shared ErrorToast would subscribe to the shared bus instance while d6's report()
calls land on the local instance — silent zero-toast regression. Prop is the contract boundary
until a future sprint migrates d6's AppErrorBus to a shared re-export.

Legacy src/components/ui/ErrorToast.jsx remains on disk (strangler-fig, cleanup in later sprint).
Tests: 106/106 unit + 14/14 E2E. Build pass.

---

### 2026-04-21 — P1 fix: bump @famililook/shared pin to ^0.9.8

Issue: Vercel build failed — "Missing ./utils/portalTransition specifier in @famililook/shared".
Root cause: package.json pinned ^0.9.0, lockfile stuck at 0.9.0. New subpath exports (portalTransition, createAnalytics, useFocusTrap) were added in shared@0.9.7.
Fix: Bumped @famililook/shared pin 0.9.0 → 0.9.8, regenerated package-lock.json.
Note: src/utils/portalTransition.js was deleted locally (migrated to shared).
Tests: npm run test:run pass (106/106), npm run build pass.

---

## 2026-04-18 — Sprint X Phase X5: Swipe Journey System Integration (CR-X5-D6)

**Risk Tier:** P1 (replaces core results presentation — feature-flagged rollback)
**Approved by:** CEO (ResultsStory.jsx at 5 patches — this IS the redesign per governance)
**Executed by:** FE Lead agent (Platform Architect audit complete)

| Date | Repo | Type | Description | Ref | Tier | Status |
|------|------|------|-------------|-----|------|--------|
| 2026-04-18 | desktop6 | Code | Created ResultsStory.legacy.jsx — renamed copy of original 449-line file for rollback | CR-X5-D6-01 | P1 | CLOSED |
| 2026-04-18 | desktop6 | Code | Rewrote ResultsStory.jsx as feature-flag wrapper — VITE_USE_SHARED_JOURNEY=true renders SwipeJourney with 8-card componentMap, false renders legacy via React.lazy | CR-X5-D6-02 | P1 | CLOSED |
| 2026-04-18 | desktop6 | Code | Created 8 componentMap entries: CompatibilityScore, ChemistryLabel, FeatureBreakdown, SharedFeatures, ScienceExplainer, RareStat, ShareCardSlide, DuoUpgrade | CR-X5-D6-03 | P1 | CLOSED |
| 2026-04-18 | desktop6 | Config | Added `vi.mock('@famililook/shared/journey')` to setupTests.js — Node ESM .jsx compat | CR-X5-D6-04 | P2 | CLOSED |

**Feature flag:** `VITE_USE_SHARED_JOURNEY` — set in Vercel env vars. `true` = shared journey, `false`/absent = legacy 5-slide component.
**Rollback:** Set flag to `false` in Vercel, redeploy. No code changes needed.
**Legacy cleanup:** ResultsStory.legacy.jsx deleted only after 2-week stability period with zero regressions. QA Lead tracks window.
**Consumers:** SoloPage, ResultsPage, ChallengePage — zero changes required (all import ResultsStory which now auto-switches).
**New cards (3):** ChemistryLabel (identity statement card), ScienceExplainer (128-dim embeddings + 60/40 formula), RareStat (rarity thresholds + StatHighlight from shared), DuoUpgrade (Plus upsell placeholder).
**UPL decisions applied:** ScienceExplainer before RareStat (UPL-1), pattern.celebration on verdict (UPL-2), upsell after share (UPL-3).
**Tests:** 51/51 unit PASS. Quality floor held.
**Patch count note:** ResultsStory.jsx now at 5 patches in 30 days. This is the REDESIGN — future edits modify componentMap entries individually, not the monolithic file.

---

## 2026-04-18 — Sprint X Consumer Integration: X2 Photo Quality + X4 CelebrationBurst (CR-X2-X4-D6)

**Risk Tier:** P1 (shared package consumer integration)
**Approved by:** CEO (X4 ResultsStory: CEO waiver granted — patch count 4, complexity reduction not symptom patch)
**Executed by:** FE Lead agent

| Date | Repo | Type | Description | Ref | Tier | Status |
|------|------|------|-------------|-----|------|--------|
| 2026-04-18 | desktop6 | Code | X2: Wired `usePhotoQuality` + `PhotoQualityRing` into PhotoUpload.jsx with null adapter (canvas-only checks: blur, lighting, resolution, compression) | CR-X2-D6-01 | P1 | CLOSED |
| 2026-04-18 | desktop6 | Code | X2: Added `file` state to retain File object for quality analysis | CR-X2-D6-02 | P2 | CLOSED |
| 2026-04-18 | desktop6 | Code | X4: Replaced 12 lines of inline canvas-confetti in ResultsStory.jsx PercentageSlide with `<CelebrationBurst>` from shared | CR-X4-D6-01 | P1 | CLOSED |
| 2026-04-18 | desktop6 | Config | Added `vi.mock('@famililook/shared/photo')` + `vi.mock('@famililook/shared/rewards')` to setupTests.js — Node ESM .jsx compat | CR-X2-D6-03 | P2 | CLOSED |

**X2 behaviour:** PhotoUpload now shows green ring on excellent quality (score 80+), text-only suggestion for amber/red. Never blocks upload. Null adapter: face checks skipped, canvas checks still run.
**X4 behaviour:** CelebrationBurst fires 3-tier confetti (40/80/150 particles at 70/80/90%) with chemistry-specific palettes + haptic feedback. Replaces hardcoded 2-tier inline confetti (40/80 at 75/90%).
**X4 governance:** ResultsStory.jsx at 4 patches in 30 days. CEO waiver granted 2026-04-18 — CelebrationBurst swap is complexity reduction (removes 12 lines, adds 1 shared component), not a symptom patch.
**Tests:** 51/51 unit PASS. Quality floor held.
**Deferred:** ProgressReveal (SoloPage + RoomPage) — requires analysis flow refactoring, deferred to dedicated sprint.

---

## 2026-04-18 — X6 Currency: Replace hardcoded £3.99 with useCurrency (CR-X6-CURRENCY-D6)

**Risk Tier:** P2 (locale-aware formatting, no structural change)
**Approved by:** CEO
**Executed by:** FE Lead agent

| Date | Repo | Type | Description | Ref | Tier | Status |
|------|------|------|-------------|-----|------|--------|
| 2026-04-18 | desktop6 | Code | Added `import { useCurrency } from '@famililook/shared/locale'` to LandingPage.jsx | CR-X6-D6-01 | P2 | CLOSED |
| 2026-04-18 | desktop6 | Code | Added `const { format } = useCurrency()` hook call in LandingPage component | CR-X6-D6-02 | P2 | CLOSED |
| 2026-04-18 | desktop6 | Code | Replaced hardcoded `£3.99` with `{format(3.99)}` in upgrade modal (line 492) | CR-X6-D6-03 | P2 | CLOSED |

**Behaviour change:** Upgrade modal price now auto-detects user locale. UK users see £3.99, US users see $3.99, EU users see 3,99 €, CA users see CA$3.99. Detection priority: AppStorage override > navigator.language > USD fallback.
**Tests:** 51/51 unit PASS. Quality floor held.
**Cross-repo impact:** None. Consuming shared package, no changes to shared package.

### X6 Currency — desktop2 CurrencyContext swap: DEFERRED
**Rationale:** Shared `useCurrency` provides locale-aware formatting only. Desktop2's `CurrencyContext` provides live rate conversion from GBP pence via backend `/currency/rates` endpoint, supports 8 countries, and has 7 consumers. Migration requires extending the shared locale module to support rate conversion — a separate design task, not a consumer integration. Deferred to a future sprint.

---

## 2026-04-18 — Fix 413 upload failure — compress photos before upload (CR-UPLOAD-D6)

### CR-UPLOAD-D6 — Wire @famililook/shared/upload into matchClient.js
**Description:** Desktop6 was sending raw phone photos (3-8MB each) to the backend, causing 413 Request Entity Too Large. Root cause: desktop2 has `compressPhoto.js` (resizes to 1200px, JPEG 0.8) but desktop6 never had it. Fix: extracted compression to `@famililook/shared@0.5.0/upload` and wired into `matchClient.js compareSolo()`. Photos now compressed before upload (5MB→~200KB). Added explicit 413 error message ("Your photos are too large") instead of generic "Failed to fetch".
**Files changed:** `package.json`, `package-lock.json`, `src/api/matchClient.js`
**Cross-repo:** `@famililook/shared@0.5.0` published with new `upload` module (compressPhoto, validateFile, photoConvert — 32 tests). Available to all consumers.
**Tests:** 51/51 unit PASS, 14/14 E2E PASS
**Risk Tier:** P1 (production upload failure)
**Status:** COMPLETE

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
