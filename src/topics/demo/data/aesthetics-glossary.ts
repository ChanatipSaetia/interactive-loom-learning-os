import { WordTerm } from '../../../types';

export const VOCABULARY_TERMS: WordTerm[] = [
  {
    id: 'hierarchy',
    word: 'Visual Hierarchy',
    pronunciation: 'vizh-oo-uhl hahy-er-ahr-kee',
    category: 'hierarchy',
    shortDefinition: 'Arranging UI elements in order of visual importance using scale, contrast, and weight.',
    detailedDefinition: 'Visual hierarchy guides the user\'s eyes through an interface. Instead of specifying hardcoded fonts, instruct the AI to analyze element importance first and ask clarification questions to align on size scaling, weight contrast, and visual density.',
    whyItMatters: 'If you instruct an AI vaguely, it defaults to a uniform, boring structure. Prompting the AI to think about hierarchy and ask for clarification forces it to design with distinct focal points rather than generic, monotonous text blocks.'
  },
  {
    id: 'whitespace',
    word: 'Negative Space (Whitespace)',
    pronunciation: 'neg-uh-tiv speys',
    category: 'layout',
    shortDefinition: 'The empty breathing room surrounding and between UI components that groups elements and enhances legibility.',
    detailedDefinition: 'Negative space is an active design tool that organizes content without physical borders. Ask the AI to plan a spacing hierarchy (margins, padding, gaps) first, and ask back about the desired layout density.',
    whyItMatters: 'AIs tend to default to conservative, tight spacing to save room. Asking the AI to analyze spacing and ask for your layout preferences prevents cluttered, claustrophobic designs and achieves clean, breathing breathing room.'
  },
  {
    id: 'contrast',
    word: 'Color Contrast Ratio',
    pronunciation: 'kuhl-er kon-trast rey-shee-oh',
    category: 'accessibility',
    shortDefinition: 'The difference in light intensity between text/foreground elements and their background, ensuring maximum accessibility.',
    detailedDefinition: 'Accessible web design requires a contrast ratio of at least 4.5:1. Ask the AI to evaluate color contrast mathematically and query you on strict accessibility compliance versus specific brand tint options.',
    whyItMatters: 'AIs often pair light gray text on light backgrounds to attempt a "minimalist" look, violating readability standards. Instructing the AI to check contrast metrics first and ask for alignment ensures beautiful, readable, WCAG-friendly palettes.'
  },
  {
    id: 'affordance',
    word: 'Interactive Affordance',
    pronunciation: 'in-ter-ak-tiv uh-fawr-duhns',
    category: 'interaction',
    shortDefinition: 'Visual signifiers that communicate how an element behaves and how users should interact with it.',
    detailedDefinition: 'Interactive affordance makes buttons and inputs look clickable. Direct the AI to outline its planned interactive states (hover, focus, click transitions) first, and ask you to choose the tactile intensity of the feedback.',
    whyItMatters: 'Without prompting, AIs often render static, flat buttons that don\'t react to a cursor. Asking the AI to explain states and ask for alignment ensures buttons have clear interactive weight and satisfying feedback.'
  },
  {
    id: 'consistency',
    word: 'Aesthetic Consistency',
    pronunciation: 'es-thet-ik kuhn-sis-tuhn-see',
    category: 'layout',
    shortDefinition: 'Using standardized, repeating design variables (typography, spacing, borders) to create a unified design system.',
    detailedDefinition: 'Aesthetic consistency prevents visual chaos. Instruct the AI to design a mini design system (consistent corner radiuses, border weights, gap increments) and align with you on a styling motif.',
    whyItMatters: 'Without a consistency constraint, an AI might mix random styles (like highly rounded cards with sharp buttons). Declaring a unified motif and asking for confirmation makes the output feel extremely cohesive.'
  },
  {
    id: 'fluidity',
    word: 'Responsive Fluidity',
    pronunciation: 'ri-spon-siv floo-id-i-tee',
    category: 'layout',
    shortDefinition: 'Designing layouts that fluidly adapt, scale, and reorganize across all screens and window dimensions.',
    detailedDefinition: 'Responsive fluidity adapts layouts to any viewport. Ask the AI to plan grid or flex structures first and query you on the breakpoint behavior and max-width layout thresholds.',
    whyItMatters: 'If you specify static pixel dimensions, the AI compiles hardcoded CSS that breaks on mobile. Ordering the AI to analyze responsive reflow and ask for parameters guarantees a mobile-optimized, fluid layout.'
  },
  {
    id: 'typography',
    word: 'Intentional Typography Pairings',
    pronunciation: 'in-ten-shuh-nuhl tahy-pog-ruh-fee',
    category: 'typography',
    shortDefinition: 'Using contrasting but complementary font families for titles and body text to convey a specific aesthetic mood.',
    detailedDefinition: 'Type pairing combines an expressive, stylistic display face for headers with a neutral, highly readable font for body elements. Direct the AI to suggest pairing combinations and ask which one fits your brand.',
    whyItMatters: 'Without explicit directives, AIs fall back to generic system font stacks. Asking the AI to propose pairings and align on a visual mood adds immediate character and professional, editorial weight.'
  },
  {
    id: 'animations',
    word: 'Purposeful Micro-interactions',
    pronunciation: 'pur-puhs-fuhl mahy-kroh-in-ter-ak-shuhnz',
    category: 'interaction',
    shortDefinition: 'Subtle, organic UI transitions and animations that guide attention and confirm state changes.',
    detailedDefinition: 'Micro-interactions use quick, physical transitions to smooth out state changes. Direct the AI to outline its animation durations and transition curves first, and ask for your preference on animation playfulness.',
    whyItMatters: 'When visual states change instantly, the transition feels robotic and jarring. Specifying physics curves and asking for alignment ensures high-end, responsive micro-animations.'
  }
];
