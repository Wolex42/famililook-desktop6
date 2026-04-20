/**
 * ResultsStory — Regression test suite (SwipeJourney).
 *
 * This file exists because the SwipeJourney integration has had 4 attempted
 * fixes, each introducing a regression. These tests lock down the exact
 * contract so future edits break tests BEFORE they break production.
 *
 * Coverage:
 *   1. All 8 componentMap entries render without crashing
 *   2. StatHighlight receives { reward: { type, label, value, rarity } }
 *   3. No nested AnimatePresence conflict (SoloPage results phase)
 *   4. SwipeJourney receives the height prop from ResultsStory
 *   5. JourneyCard renders with dark background (no white)
 *   6. Dense content cards (proof type) use flex-start, not center
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Environment ──
vi.stubEnv('VITE_USE_SHARED_JOURNEY', 'true');

// ── Track SwipeJourney props for assertion ──
let capturedSwipeJourneyProps = null;

// ── Track StatHighlight props for assertion ──
let capturedStatHighlightProps = null;

// ── Track JourneyCard props for assertion ──
let capturedJourneyCardProps = [];

// ── Mock framer-motion ──
vi.mock('framer-motion', () => {
  const filterMotionProps = ({ children, initial, animate, exit, transition, whileHover, whileTap,
    variants, layout, layoutId, onAnimationComplete, ...rest }) => ({ children, rest });
  return {
    motion: {
      div: (props) => { const { children, rest } = filterMotionProps(props); return <div {...rest}>{children}</div>; },
      button: (props) => { const { children, rest } = filterMotionProps(props); return <button {...rest}>{children}</button>; },
      h2: (props) => { const { children, rest } = filterMotionProps(props); return <h2 {...rest}>{children}</h2>; },
      p: (props) => { const { children, rest } = filterMotionProps(props); return <p {...rest}>{children}</p>; },
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

// ── Mock lucide-react ──
vi.mock('lucide-react', () => ({
  Home: (props) => <span data-testid="icon-home" />,
  RotateCcw: (props) => <span data-testid="icon-rotate" />,
  Check: (props) => <span data-testid="icon-check" />,
  X: (props) => <span data-testid="icon-x" />,
  Users: (props) => <span data-testid="icon-users" />,
  Sparkles: (props) => <span data-testid="icon-sparkles" />,
  FlaskConical: (props) => <span data-testid="icon-flask" />,
  ArrowLeft: (props) => <span data-testid="icon-arrow-left" />,
  Zap: (props) => <span data-testid="icon-zap" />,
  Camera: (props) => <span data-testid="icon-camera" />,
  Lock: (props) => <span data-testid="icon-lock" />,
  ChevronUp: (props) => <span data-testid="icon-chevron-up" />,
}));

// ── Mock @famililook/shared/icons ──
vi.mock('@famililook/shared/icons', () => ({
  SharpIcon: ({ children }) => <span data-testid="sharp-icon">{children}</span>,
  featureIconMap: {
    eyes: () => <span data-testid="fi-eyes" />,
    eyebrows: () => <span data-testid="fi-eyebrows" />,
    smile: () => <span data-testid="fi-smile" />,
    nose: () => <span data-testid="fi-nose" />,
    face_shape: () => <span data-testid="fi-face_shape" />,
    skin: () => <span data-testid="fi-skin" />,
    hair: () => <span data-testid="fi-hair" />,
    ears: () => <span data-testid="fi-ears" />,
  },
}));

// ── Mock @famililook/shared/rewards — capture StatHighlight props ──
vi.mock('@famililook/shared/rewards', () => ({
  CelebrationBurst: ({ children, ...props }) => <div data-testid="celebration-burst">{children}</div>,
  MicroReward: ({ children }) => children,
  StatHighlight: (props) => {
    capturedStatHighlightProps = props;
    return <div data-testid="stat-highlight" data-props={JSON.stringify(props)} />;
  },
  ProgressReveal: ({ children }) => children,
  useVariableReward: () => ({ reward: null }),
}));

// ── Mock @famililook/shared/journey — capture SwipeJourney props + render components ──
vi.mock('@famililook/shared/journey', () => ({
  SwipeJourney: (props) => {
    capturedSwipeJourneyProps = props;
    // Render ALL componentMap entries so we can test each one
    const { cards, componentMap, cardProps } = props;
    return (
      <div data-testid="swipe-journey">
        {cards.map((card) => {
          const Comp = componentMap[card.component];
          if (!Comp) return <div key={card.id} data-testid={`missing-${card.id}`} />;
          return (
            <div key={card.id} data-testid={`card-${card.id}`} data-card-type={card.type}>
              <Comp {...(card.props || {})} {...(cardProps || {})} />
            </div>
          );
        })}
      </div>
    );
  },
  JourneyCard: (props) => {
    capturedJourneyCardProps.push(props);
    return <div data-testid={`journey-card-${props.type}`}>{props.children}</div>;
  },
  useJourneyProgress: () => ({
    currentIndex: 0, completed: false,
    goTo: () => {}, goForward: () => {}, goBack: () => {},
  }),
  familimatchJourney: [
    { id: 'score', type: 'reveal', component: 'CompatibilityScore', props: {} },
    { id: 'label', type: 'verdict', component: 'ChemistryLabel', props: {} },
    { id: 'features', type: 'proof', component: 'FeatureBreakdown', props: {} },
    { id: 'shared', type: 'contrast', component: 'SharedFeatures', props: {} },
    { id: 'science', type: 'deepdive', component: 'ScienceExplainer', props: {} },
    { id: 'rare', type: 'deepdive', component: 'RareStat', props: {} },
    { id: 'share', type: 'share', component: 'ShareCard', props: {} },
    { id: 'upgrade', type: 'upsell', component: 'DuoUpgrade', props: {} },
  ],
  famililookJourney: [],
}));

// ── Import AFTER mocks ──
import ResultsStory from '../../src/components/ResultsStory.jsx';

// ── Mock data (compare_faces.v1 contract) ──
const MOCK_RESULTS = {
  ok: true,
  percentage: 73,
  chemistry_label: 'Complementary Pair',
  chemistry_color: '#3B82F6',
  embedding_similarity: 0.78,
  feature_similarity: 0.625,
  feature_comparisons: [
    { feature: 'eyes', label_a: 'Round', label_b: 'Almond', match: false },
    { feature: 'eyebrows', label_a: 'Arched', label_b: 'Arched', match: true },
    { feature: 'smile', label_a: 'Wide', label_b: 'Wide', match: true },
    { feature: 'nose', label_a: 'Straight', label_b: 'Button', match: false },
    { feature: 'face_shape', label_a: 'Oval', label_b: 'Round', match: false },
    { feature: 'skin', label_a: 'Fair', label_b: 'Fair', match: true },
    { feature: 'hair', label_a: 'Dark', label_b: 'Dark', match: true },
    { feature: 'ears', label_a: 'Detached', label_b: 'Attached', match: false },
  ],
  shared_features: ['eyebrows', 'smile', 'skin', 'hair'],
  calibrated_a: {},
  calibrated_b: {},
  name_a: 'Alice',
  name_b: 'Bob',
  fusion_image: null,
};

const MOCK_ON_RESET = vi.fn();

function renderStory(props = {}) {
  return render(
    <MemoryRouter>
      <ResultsStory
        results={MOCK_RESULTS}
        nameA="Alice"
        onReset={MOCK_ON_RESET}
        {...props}
      />
    </MemoryRouter>
  );
}

// ════════════════════════════════════════════════════════════════
// 1. All 8 componentMap entries render without crashing
// ════════════════════════════════════════════════════════════════
describe('Regression: All 8 componentMap entries render without crash', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedSwipeJourneyProps = null;
    capturedStatHighlightProps = null;
    capturedJourneyCardProps = [];
  });

  it('renders all 8 cards via SwipeJourney mock', () => {
    renderStory();
    expect(screen.getByTestId('swipe-journey')).toBeInTheDocument();

    const expectedCards = [
      'card-score', 'card-label', 'card-features', 'card-shared',
      'card-science', 'card-rare', 'card-share', 'card-upgrade',
    ];
    expectedCards.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });
  });

  it('CompatibilityScore renders percentage and names', () => {
    renderStory();
    // The animated number starts at 0, but the component should render
    expect(screen.getByTestId('card-score')).toBeInTheDocument();
    // "Alice & Bob" appears in CompatibilityScore (and possibly others since all 8 render)
    const scoreCard = screen.getByTestId('card-score');
    expect(scoreCard.textContent).toContain('Alice');
    expect(scoreCard.textContent).toContain('Bob');
  });

  it('ChemistryLabel renders the chemistry label text', () => {
    renderStory();
    expect(screen.getByText('Complementary Pair')).toBeInTheDocument();
    expect(screen.getByText('Different in all the right ways.')).toBeInTheDocument();
  });

  it('FeatureBreakdown renders all 8 feature rows', () => {
    renderStory();
    const featuresCard = screen.getByTestId('card-features');
    expect(featuresCard.textContent).toContain('Feature Breakdown');
    // Each feature name should appear (face_shape becomes "face shape")
    ['eyes', 'eyebrows', 'smile', 'nose', 'face shape', 'skin', 'hair', 'ears'].forEach((f) => {
      expect(featuresCard.textContent).toContain(f);
    });
  });

  it('SharedFeatures renders matched features', () => {
    renderStory();
    const sharedCard = screen.getByTestId('card-shared');
    expect(sharedCard.textContent).toContain('What Connects You');
    // Shared features listed with "Same X: label" format
    expect(sharedCard.textContent).toContain('These are the features that connect you');
  });

  it('SharedFeatures handles zero shared features without crash', () => {
    const zeroShared = {
      ...MOCK_RESULTS,
      feature_comparisons: MOCK_RESULTS.feature_comparisons.map(fc => ({ ...fc, match: false })),
      shared_features: [],
    };
    renderStory({ results: zeroShared });
    expect(screen.getByText(/complement each other/)).toBeInTheDocument();
  });

  it('SocialProof renders live counter and rarity teaser', () => {
    renderStory();
    expect(screen.getByText('comparisons today')).toBeInTheDocument();
    expect(screen.getByText('Your match is rarer than you think.')).toBeInTheDocument();
  });

  it('RareStat renders match count and rarity stat', () => {
    renderStory();
    const rareCard = screen.getByTestId('card-rare');
    expect(rareCard.textContent).toContain('How Rare Is This?');
    expect(rareCard.textContent).toContain('4 of 8');
  });

  it('ShareCardSlide renders fusion unavailable when no image', () => {
    renderStory();
    expect(screen.getByText('Challenge Your Friends')).toBeInTheDocument();
    expect(screen.getByText('Fusion unavailable')).toBeInTheDocument();
  });

  it('ShareCardSlide renders fusion image when provided', () => {
    const withFusion = {
      ...MOCK_RESULTS,
      fusion_image: 'data:image/png;base64,iVBORw0KGg==',
    };
    renderStory({ results: withFusion });
    const img = screen.getByAltText('Face fusion');
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('data:image/png;base64');
  });

  it('ShareCardSlide prepends data: prefix to raw base64', () => {
    const rawB64 = {
      ...MOCK_RESULTS,
      fusion_image: 'iVBORw0KGgoAAAANSUhEUg==',
    };
    renderStory({ results: rawB64 });
    const img = screen.getByAltText('Face fusion');
    expect(img.src).toMatch(/^data:image\/png;base64,/);
  });

  it('DuoUpgrade renders upsell content', () => {
    renderStory();
    expect(screen.getByText('See their face when the score drops.')).toBeInTheDocument();
    expect(screen.getByText('Get Plus')).toBeInTheDocument();
  });

  it('FeatureBreakdown handles undefined feature_comparisons', () => {
    const noFeatures = { ...MOCK_RESULTS, feature_comparisons: undefined };
    const { container } = renderStory({ results: noFeatures });
    expect(container).toBeTruthy();
  });

  it('All 8 mythic-level results render without crash', () => {
    const mythic = {
      ...MOCK_RESULTS,
      percentage: 97,
      chemistry_label: 'Feature Twins',
      chemistry_color: '#FFD700',
      feature_comparisons: MOCK_RESULTS.feature_comparisons.map(fc => ({ ...fc, match: true })),
      shared_features: ['eyes', 'eyebrows', 'smile', 'nose', 'face_shape', 'skin', 'hair', 'ears'],
    };
    const { container } = renderStory({ results: mythic });
    expect(container).toBeTruthy();
    const labelCard = screen.getByTestId('card-label');
    expect(labelCard.textContent).toContain('Feature Twins');
    const rareCard = screen.getByTestId('card-rare');
    expect(rareCard.textContent).toContain('8 of 8');
  });
});

// ════════════════════════════════════════════════════════════════
// 2. StatHighlight receives correct props shape
// ════════════════════════════════════════════════════════════════
describe('Regression: StatHighlight receives { reward } object prop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedStatHighlightProps = null;
  });

  it('StatHighlight is called with reward object containing type, label, value, rarity', () => {
    renderStory();
    expect(capturedStatHighlightProps).not.toBeNull();

    // Must be { reward: { type, label, value, rarity }, productId }
    const { reward, productId } = capturedStatHighlightProps;
    expect(reward).toBeDefined();
    expect(typeof reward).toBe('object');
    expect(reward.type).toBe('stat');
    expect(reward.label).toMatch(/\/8 features match/);
    expect(typeof reward.value).toBe('number');
    expect(reward.rarity).toBeDefined();
    expect(productId).toBe('familimatch');
  });

  it('StatHighlight is NOT called with flat props (type, label, value directly)', () => {
    renderStory();
    // If someone passes flat props instead of { reward: {...} },
    // capturedStatHighlightProps.reward would be undefined
    expect(capturedStatHighlightProps.reward).toBeDefined();
    expect(capturedStatHighlightProps.type).toBeUndefined(); // type is INSIDE reward, not at top level
    expect(capturedStatHighlightProps.label).toBeUndefined();
    expect(capturedStatHighlightProps.value).toBeUndefined();
    expect(capturedStatHighlightProps.rarity).toBeUndefined();
  });

  it('rarity is "rare" for 4/8 matching features', () => {
    renderStory(); // MOCK_RESULTS has 4 matching features
    expect(capturedStatHighlightProps.reward.rarity).toBe('rare');
  });

  it('rarity is "mythic" for 7+ matching features', () => {
    const mythic = {
      ...MOCK_RESULTS,
      feature_comparisons: MOCK_RESULTS.feature_comparisons.map(fc => ({ ...fc, match: true })),
    };
    renderStory({ results: mythic });
    expect(capturedStatHighlightProps.reward.rarity).toBe('mythic');
  });

  it('rarity is "common" for 0-2 matching features', () => {
    const low = {
      ...MOCK_RESULTS,
      feature_comparisons: MOCK_RESULTS.feature_comparisons.map((fc, i) => ({ ...fc, match: i < 2 })),
    };
    renderStory({ results: low });
    expect(capturedStatHighlightProps.reward.rarity).toBe('common');
  });

  it('rarity is "uncommon" for 3 matching features', () => {
    const three = {
      ...MOCK_RESULTS,
      feature_comparisons: MOCK_RESULTS.feature_comparisons.map((fc, i) => ({ ...fc, match: i < 3 })),
    };
    renderStory({ results: three });
    expect(capturedStatHighlightProps.reward.rarity).toBe('uncommon');
  });

  it('rarity is "epic" for 5 matching features', () => {
    const five = {
      ...MOCK_RESULTS,
      feature_comparisons: MOCK_RESULTS.feature_comparisons.map((fc, i) => ({ ...fc, match: i < 5 })),
    };
    renderStory({ results: five });
    expect(capturedStatHighlightProps.reward.rarity).toBe('epic');
  });

  it('rarity is "legendary" for 6 matching features', () => {
    const six = {
      ...MOCK_RESULTS,
      feature_comparisons: MOCK_RESULTS.feature_comparisons.map((fc, i) => ({ ...fc, match: i < 6 })),
    };
    renderStory({ results: six });
    expect(capturedStatHighlightProps.reward.rarity).toBe('legendary');
  });
});

// ════════════════════════════════════════════════════════════════
// 3. No nested AnimatePresence conflict (SoloPage)
// ════════════════════════════════════════════════════════════════
describe('Regression: SoloPage results phase is NOT inside AnimatePresence', () => {
  // We can't easily render SoloPage (too many dependencies), but we can
  // read the source and structurally verify the results block is outside
  // AnimatePresence. This is a source-level regression test.

  it('SoloPage source has results phase outside AnimatePresence', async () => {
    // Read the actual source file and verify the structure
    const fs = await import('node:fs');
    const path = await import('node:path');
    const soloSource = fs.readFileSync(
      path.resolve('src/pages/SoloPage.jsx'), 'utf-8'
    );

    // Find the closing </AnimatePresence> tag
    const animatePresenceCloses = [...soloSource.matchAll(/<\/AnimatePresence>/g)];
    expect(animatePresenceCloses.length).toBeGreaterThan(0);

    // Find where ResultsStory is rendered
    const resultsStoryMatch = soloSource.match(/<ResultsStory/);
    expect(resultsStoryMatch).not.toBeNull();

    // The ResultsStory should appear AFTER the last </AnimatePresence>
    const lastAPClose = soloSource.lastIndexOf('</AnimatePresence>');
    const resultsStoryPos = soloSource.indexOf('<ResultsStory');
    expect(resultsStoryPos).toBeGreaterThan(lastAPClose);
  });

  it('SoloPage results block does NOT have AnimatePresence parent wrapping it', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const soloSource = fs.readFileSync(
      path.resolve('src/pages/SoloPage.jsx'), 'utf-8'
    );

    // Extract the block around ResultsStory — 5 lines before it
    const lines = soloSource.split('\n');
    const resultsLineIndex = lines.findIndex(l => l.includes('<ResultsStory'));
    expect(resultsLineIndex).toBeGreaterThan(-1);

    // The 10 lines before ResultsStory should NOT contain <AnimatePresence
    // without a matching </AnimatePresence> before ResultsStory
    const contextBefore = lines.slice(Math.max(0, resultsLineIndex - 10), resultsLineIndex).join('\n');

    // Count unclosed AnimatePresence tags in the context window
    const opens = (contextBefore.match(/<AnimatePresence/g) || []).length;
    const closes = (contextBefore.match(/<\/AnimatePresence>/g) || []).length;

    // There should be no unclosed AnimatePresence wrapping ResultsStory
    expect(opens).toBeLessThanOrEqual(closes);
  });
});

// ════════════════════════════════════════════════════════════════
// 4. SwipeJourney height prop is passed
// ════════════════════════════════════════════════════════════════
describe('Regression: ResultsStory passes height to SwipeJourney', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedSwipeJourneyProps = null;
  });

  it('SwipeJourney receives a height prop', () => {
    renderStory();
    expect(capturedSwipeJourneyProps).not.toBeNull();
    expect(capturedSwipeJourneyProps.height).toBeDefined();
    expect(typeof capturedSwipeJourneyProps.height).toBe('string');
  });

  it('height prop contains a CSS value (not empty)', () => {
    renderStory();
    expect(capturedSwipeJourneyProps.height.length).toBeGreaterThan(0);
    // Should be a calc() or vh/dvh value
    expect(capturedSwipeJourneyProps.height).toMatch(/calc|vh|dvh|px/);
  });

  it('SwipeJourney receives productId="familimatch"', () => {
    renderStory();
    expect(capturedSwipeJourneyProps.productId).toBe('familimatch');
  });

  it('SwipeJourney receives componentMap with all 8 entries', () => {
    renderStory();
    const map = capturedSwipeJourneyProps.componentMap;
    expect(Object.keys(map)).toHaveLength(8);
    const expectedKeys = [
      'CompatibilityScore', 'ChemistryLabel', 'FeatureBreakdown',
      'SharedFeatures', 'ScienceExplainer', 'RareStat', 'ShareCard', 'DuoUpgrade',
    ];
    expectedKeys.forEach((key) => {
      expect(map[key]).toBeDefined();
      expect(typeof map[key]).toBe('function');
    });
  });

  it('SwipeJourney receives cardProps with results, displayA, displayB, onReset', () => {
    renderStory();
    const cp = capturedSwipeJourneyProps.cardProps;
    expect(cp.results).toBeDefined();
    expect(cp.results.percentage).toBe(73);
    expect(cp.displayA).toBe('Alice');
    expect(cp.displayB).toBe('Bob');
    expect(typeof cp.onReset).toBe('function');
  });
});

// ════════════════════════════════════════════════════════════════
// 5. JourneyCard renders with dark background
// ════════════════════════════════════════════════════════════════
describe('Regression: JourneyCard dark backgrounds (source verification)', () => {
  // The real JourneyCard is mocked, so we verify at the source level
  // that ALL card types use dark backgrounds and NONE use white.

  it('JourneyCard CARD_STYLES all use dark backgrounds from base palette', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    // Read JourneyCard source
    const cardSource = fs.readFileSync(
      path.resolve('../famililook-shared/src/journey/JourneyCard.jsx'), 'utf-8'
    );

    // No white background references
    expect(cardSource).not.toMatch(/bg:\s*['"]#fff/i);
    expect(cardSource).not.toMatch(/bg:\s*['"]#ffffff/i);
    expect(cardSource).not.toMatch(/bg:\s*['"]white/i);
    expect(cardSource).not.toMatch(/background:\s*['"]#fff/i);
    expect(cardSource).not.toMatch(/background:\s*['"]white/i);
    expect(cardSource).not.toMatch(/backgroundColor:\s*['"]#fff/i);
    expect(cardSource).not.toMatch(/backgroundColor:\s*['"]white/i);

    // Should reference base.bgMain or base.bgCard (dark colors)
    expect(cardSource).toMatch(/base\.bgMain/);
    expect(cardSource).toMatch(/base\.bgCard/);
  });

  it('base.bgMain and base.bgCard are dark colors', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const colorsSource = fs.readFileSync(
      path.resolve('../famililook-shared/src/theme/colors.js'), 'utf-8'
    );

    // bgMain should be a dark hex (low RGB values)
    const bgMainMatch = colorsSource.match(/bgMain:\s*'(#[0-9A-Fa-f]{6})'/);
    expect(bgMainMatch).not.toBeNull();
    const bgMain = bgMainMatch[1];
    // Parse hex and verify it's dark (R+G+B < 200)
    const r1 = parseInt(bgMain.slice(1, 3), 16);
    const g1 = parseInt(bgMain.slice(3, 5), 16);
    const b1 = parseInt(bgMain.slice(5, 7), 16);
    expect(r1 + g1 + b1).toBeLessThan(200);

    // bgCard should also be dark
    const bgCardMatch = colorsSource.match(/bgCard:\s*'(#[0-9A-Fa-f]{6})'/);
    expect(bgCardMatch).not.toBeNull();
    const bgCard = bgCardMatch[1];
    const r2 = parseInt(bgCard.slice(1, 3), 16);
    const g2 = parseInt(bgCard.slice(3, 5), 16);
    const b2 = parseInt(bgCard.slice(5, 7), 16);
    expect(r2 + g2 + b2).toBeLessThan(200);
  });

  it('ResultsStory wrapper uses dark backgroundColor (#0A0A0F)', () => {
    const { container } = renderStory();
    const wrapper = container.firstChild;
    expect(wrapper.style.backgroundColor).toBe('rgb(10, 10, 15)');
  });
});

// ════════════════════════════════════════════════════════════════
// 6. Dense content cards (proof type) use flex-start
// ════════════════════════════════════════════════════════════════
describe('Regression: Dense content cards use flex-start alignment', () => {
  it('JourneyCard source uses flex-start for proof and contrast types', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const cardSource = fs.readFileSync(
      path.resolve('../famililook-shared/src/journey/JourneyCard.jsx'), 'utf-8'
    );

    // Must have isDenseContent check for proof/contrast
    expect(cardSource).toMatch(/isDenseContent/);
    expect(cardSource).toMatch(/type\s*===\s*'proof'/);
    expect(cardSource).toMatch(/type\s*===\s*'contrast'/);

    // Must use flex-start for dense content, not center
    expect(cardSource).toMatch(/justifyContent:\s*isDenseContent\s*\?\s*'flex-start'/);
  });

  it('JourneyCard uses overflowY auto for dense content cards', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const cardSource = fs.readFileSync(
      path.resolve('../famililook-shared/src/journey/JourneyCard.jsx'), 'utf-8'
    );

    // Dense content cards must allow scrolling
    expect(cardSource).toMatch(/overflowY:\s*isDenseContent\s*\?\s*'auto'/);
  });

  it('FeatureBreakdown is assigned to "proof" type in journey config', () => {
    // The familimatchJourney config (from our mock matching real config)
    // must assign FeatureBreakdown to type "proof"
    renderStory();
    const cards = capturedSwipeJourneyProps.cards;
    const featureCard = cards.find(c => c.component === 'FeatureBreakdown');
    expect(featureCard).toBeDefined();
    expect(featureCard.type).toBe('proof');
  });

  it('SharedFeatures is assigned to "contrast" type in journey config', () => {
    renderStory();
    const cards = capturedSwipeJourneyProps.cards;
    const sharedCard = cards.find(c => c.component === 'SharedFeatures');
    expect(sharedCard).toBeDefined();
    expect(sharedCard.type).toBe('contrast');
  });
});

// ════════════════════════════════════════════════════════════════
// Extra: Guard against prop shape regressions
// ════════════════════════════════════════════════════════════════
describe('Regression: Component prop shapes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedSwipeJourneyProps = null;
    capturedStatHighlightProps = null;
  });

  it('displayA defaults to results.name_a when nameA not provided', () => {
    renderStory({ nameA: undefined });
    expect(capturedSwipeJourneyProps.cardProps.displayA).toBe('Alice');
  });

  it('displayB comes from results.name_b', () => {
    renderStory();
    expect(capturedSwipeJourneyProps.cardProps.displayB).toBe('Bob');
  });

  it('displayA falls back to "Person A" when both nameA and name_a are missing', () => {
    const noNames = { ...MOCK_RESULTS, name_a: undefined };
    renderStory({ results: noNames, nameA: undefined });
    expect(capturedSwipeJourneyProps.cardProps.displayA).toBe('Person A');
  });

  it('displayB falls back to "Person B" when name_b is missing', () => {
    const noNameB = { ...MOCK_RESULTS, name_b: undefined };
    renderStory({ results: noNameB });
    expect(capturedSwipeJourneyProps.cardProps.displayB).toBe('Person B');
  });

  it('onReset is passed through to cardProps', () => {
    renderStory();
    expect(capturedSwipeJourneyProps.cardProps.onReset).toBe(MOCK_ON_RESET);
  });

  it('returns null when results is null', () => {
    const { container } = render(
      <MemoryRouter>
        <ResultsStory results={null} nameA="Alice" onReset={MOCK_ON_RESET} />
      </MemoryRouter>
    );
    expect(container.innerHTML).toBe('');
  });

  it('returns null when results is undefined', () => {
    const { container } = render(
      <MemoryRouter>
        <ResultsStory results={undefined} nameA="Alice" onReset={MOCK_ON_RESET} />
      </MemoryRouter>
    );
    expect(container.innerHTML).toBe('');
  });
});
