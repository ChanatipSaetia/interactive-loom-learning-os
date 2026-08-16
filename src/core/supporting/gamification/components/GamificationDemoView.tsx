import React, { useState, useMemo } from 'react'
import { HexGridCanvas } from './HexGridCanvas'
import {
  GlobalCharacterState,
  TopicCampaignState,
  HexNodeData,
} from '../types'
import { computeHexGridCoordinates, getAutoFlowConnections } from '../layout'
import { Button, Card, Badge, Modal } from '../../../ui-system'
import {
  IntroSection,
  TextSection,
  QuizSection,
  ReflectionSequenceSection,
  TradeoffSandboxSection,
} from '../../../learning-engine/sub-contexts'
import type { OKFQuizQuestion } from '../../../learning-engine/composition/okf/types'

// ─── Magic Rune Encryption Helper ───
const RUNE_CHAR_MAP: Record<string, string> = {
  a: 'ᚨ', b: 'ᛒ', c: 'ᚲ', d: 'ᛞ', e: 'ᛖ', f: 'ᚠ', g: 'ᚷ', h: 'ᚺ',
  i: 'ᛁ', j: 'ᛃ', k: 'ᚲ', l: 'ᛚ', m: 'ᛗ', n: 'ᚾ', o: 'ᛟ', p: 'ᛈ',
  q: 'ᚴ', r: 'ᛱ', s: 'ᛊ', t: 'ᛏ', u: 'ᚢ', v: 'ᚡ', w: 'ᚹ', x: 'ᚷ',
  y: 'ᛦ', z: 'ᛉ', ' ': ' ',
}

export function encryptToMagicRunes(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((char) => RUNE_CHAR_MAP[char] || '᚛')
    .join('')
}


// ─── Real Section Datasets for Hex Nodes ───

const CAPITAL_INTRO_DATA = {
  title: 'Capital Overview — Hexagonal Architecture & Ports',
  subtitle: 'Tabletop Campaign & Architecture Realm Overview',
  what: {
    summary:
      'Welcome to the Hexagonal Architecture Campaign map! Protect cities from dependency monsters, decrypt reflection magic, evaluate metric trade-offs, and collect the Adapter Shield and Port Blade to defeat the Monolithic Complexity Dragon.',
  },
  why: {
    summary:
      'Mastering ports and adapters prevents core domain lock-in to external frameworks, ensuring high testability and architectural longevity.',
  },
  roadmap: [
    { title: 'Read Sanctuary', type: 'reading_sanctuary', description: 'Absorb domain entity principles to recover HP.' },
    { title: 'Fight Monster', type: 'quiz_encounter', description: 'Defeat the Dependency Goblin in quiz battle.' },
    { title: 'Forge Trade-offs', type: 'tradeoff_workshop', description: 'Tune metric sliders to gain temporary Armor stat buffs.' },
    { title: 'Defeat Dragon Boss', type: 'boss_lair', description: 'Unleash your collected items to save the architecture realm!' },
  ],
}

const SANCTUARY_TEXT_DATA = {
  title: 'Domain Logic Sanctuary (Sanctuary Reading)',
  heading: 'Core Domain Entity Invariants',
  paragraphs: [
    'In **Hexagonal Architecture (Ports and Adapters)**, the core business domain logic remains completely isolated from external frameworks, databases, and network protocol adapters.',
    'Domain entities enforce business rules and invariants internally. Outbound operations (such as saving orders to a database) are expressed as **Port interfaces** defined *inside* the core layer.',
    'External infrastructure classes (e.g. Postgres repository adapters) implement these port interfaces on the outside boundary, ensuring the core logic has **zero backward dependencies** on framework code.',
  ],
}

const QUIZ_GOBLIN_QUESTIONS: OKFQuizQuestion[] = [
  {
    id: 'q1',
    question: 'In Hexagonal Architecture, where should outbound port interfaces be defined?',
    hint: 'Think about who owns the contract: the domain logic or the external database framework?',
    choices: [
      {
        id: 'c1',
        text: 'Inside the Core Domain package alongside business entities.',
        correct: true,
        explanation: 'Correct! Defining port interfaces inside the core domain ensures the core owns the contract, keeping infrastructure decoupled.',
      },
      {
        id: 'c2',
        text: 'Inside the Postgres database driver package.',
        correct: false,
        explanation: 'Incorrect. Putting interfaces in the database package forces the core domain to depend on external frameworks.',
      },
      {
        id: 'c3',
        text: 'Directly inside global UI React components.',
        correct: false,
        explanation: 'Incorrect. UI components belong to the primary/driving adapter layer, not port definitions.',
      },
    ],
  },
  {
    id: 'q2',
    question: 'What is the main role of a Driving (Primary) Adapter?',
    hint: 'Driving adapters trigger execution into the core domain application service.',
    choices: [
      {
        id: 'c1',
        text: 'Translates user HTTP/REST or CLI inputs into core application commands.',
        correct: true,
        explanation: 'Correct! Driving adapters (REST controllers, CLI commands) convert external triggers into core domain calls.',
      },
      {
        id: 'c2',
        text: 'Manages SQL transaction logs and connection pools.',
        correct: false,
        explanation: 'Incorrect. SQL connection management is handled by driven (secondary) persistence adapters.',
      },
    ],
  },
]

const REFLECTION_SEQUENCE_DATA = {
  title: 'Decryption Sequence (Reflection Magic)',
  prompt: 'Arrange the Hexagonal Port lifecycle steps in the correct order to decrypt monster magic:',
  items: [
    { id: 'item-1', text: '1. Define Port Interface inside Core Domain', icon: '📜' },
    { id: 'item-2', text: '2. Implement Secondary Database Adapter outside Core', icon: '🔌' },
    { id: 'item-3', text: '3. Inject Adapter into Core Application Service via DI', icon: '⚡' },
  ],
  solution: ['item-1', 'item-2', 'item-3'],
}

const TRADEOFF_SCENARIOS_DATA = [

  {
    id: 'scenario-1',
    title: 'Database Persistence vs In-Memory Performance',
    description: 'Select your persistence strategy to tune character stat metrics for the campaign.',
    metrics: [
      { id: 'armor_buff', label: 'Armor Defense Buff', baseValue: 10, min: 0, max: 20, direction: 'higher' },
      { id: 'evasion_buff', label: 'Evasion Speed Buff', baseValue: 15, min: 0, max: 25, direction: 'higher' },
    ],
    steps: [
      {
        id: 'step-1',
        title: 'Storage Adapter Choice',
        description: 'Select secondary persistence adapter implementation:',
        choices: [
          {
            id: 'postgres',
            label: 'PostgreSQL Relational Adapter',
            description: 'Provides ACID compliance and high durability at the cost of slight latency.',
            metrics: { armor_buff: 20, evasion_buff: 5 },
            pros: [{ title: 'High Armor', description: 'Strong transactional guarantees protect against wrong answer damage.' }],
            cons: [{ title: 'Lower Evasion', description: 'Slightly slower execution speed.' }],
          },
          {
            id: 'redis',
            label: 'Redis In-Memory Cache Adapter',
            description: 'Ultra-fast response time with ephemeral storage.',
            metrics: { armor_buff: 5, evasion_buff: 25 },
            pros: [{ title: 'High Evasion', description: 'Fast execution speed enables quick choice retries.' }],
            cons: [{ title: 'Lower Armor', description: 'Less durability under sustained attack.' }],
          },
        ],
      },
    ],
  },
]


// ─── Initial Mock Hex Nodes (14 Cities with Unlock Dependencies) ───

const MOCK_NODES: HexNodeData[] = [
  // Ring 0: Center Capital (Intro)
  {
    id: 'capital-0',
    title: 'Architecture Capital',
    type: 'capital',
    status: 'cleared',
    description: 'The main stronghold of Hexagonal Ports & Adapters. Map revealed!',
    sectionData: CAPITAL_INTRO_DATA,
  },

  // Ring 1: Havens (Reading Sanctuaries) all connected directly to the main Capital city
  {
    id: 'sanctuary-1',
    title: 'Domain Entity Sanctuary',
    type: 'reading_sanctuary',
    status: 'unlocked',
    description: 'A peaceful haven containing core domain entity prose. Rest here to recover HP.',
    healingAmount: 30,
    sectionData: SANCTUARY_TEXT_DATA,
  },
  {
    id: 'sanctuary-2',
    title: 'Interface Temple',
    type: 'reading_sanctuary',
    status: 'unlocked',
    description: 'Sacred grounds of Interface Segregation. Rest to absorb domain rules.',
    healingAmount: 25,
    sectionData: SANCTUARY_TEXT_DATA,
  },
  {
    id: 'sanctuary-3',
    title: 'Value Object Citadel',
    type: 'reading_sanctuary',
    status: 'unlocked',
    description: 'Ancient citadel preserving Immutable Value Objects. Rest restores 35 HP.',
    healingAmount: 35,
    sectionData: SANCTUARY_TEXT_DATA,
  },
  {
    id: 'sanctuary-4',
    title: 'Event Storming Keep',
    type: 'reading_sanctuary',
    status: 'unlocked',
    description: 'Sanctuary of Domain Events and Policy Handlers.',
    healingAmount: 20,
    sectionData: SANCTUARY_TEXT_DATA,
  },
  {
    id: 'sanctuary-5',
    title: 'Bounded Context Sanctuary',
    type: 'reading_sanctuary',
    status: 'unlocked',
    description: 'Protects the ubiquitious language boundary between subdomains.',
    healingAmount: 30,
    sectionData: SANCTUARY_TEXT_DATA,
  },
  {
    id: 'sanctuary-6',
    title: 'Aggregate Boundary Monastery',
    type: 'reading_sanctuary',
    status: 'unlocked',
    description: 'Sacred monastery preserving transaction boundaries and aggregate root consistency.',
    healingAmount: 30,
    sectionData: SANCTUARY_TEXT_DATA,
  },
  {
    id: 'sanctuary-7',
    title: 'Clean Architecture Fortress',
    type: 'reading_sanctuary',
    status: 'unlocked',
    description: 'Impenetrable fortress enforcing strict dependency inversion rules.',
    healingAmount: 35,
    sectionData: SANCTUARY_TEXT_DATA,
  },

  // Trade-off Workshops mapped directly from Sanctuaries
  {
    id: 'tradeoff-craft-1',
    title: 'Metrics Forge',
    type: 'tradeoff_workshop',
    status: 'locked',
    description: 'Forge weapon metrics! Evaluate trade-offs to gain temporary campaign stat buffs.',
    buff: {
      stat: 'armor',
      value: 10,
      label: '+10 Temp Armor',
    },
  },
  {
    id: 'tradeoff-craft-2',
    title: 'Formula Crucible',
    type: 'tradeoff_workshop',
    status: 'locked',
    description: 'Experiment with system throughput formulas to craft +15 Evasion speed buffs.',
    buff: {
      stat: 'evasion',
      value: 15,
      label: '+15 Temp Evasion',
    },
  },
  {
    id: 'tradeoff-craft-3',
    title: 'Latency Crucible',
    type: 'tradeoff_workshop',
    status: 'locked',
    description: 'Tune caching and network latency metrics to boost Intelligence stat.',
    buff: {
      stat: 'intelligence',
      value: 12,
      label: '+12 Temp Intelligence',
    },
  },

  // Monster Challenges branching from Sanctuaries
  {
    id: 'quiz-goblin-1',
    title: 'Dependency Goblin',
    type: 'quiz_encounter',
    status: 'locked',
    description: 'A wild monster attacking city boundaries! Answer architectural quizzes to deal damage.',
    monster: {
      id: 'goblin-1',
      name: 'Dependency Goblin',
      type: 'Tightly Coupled Monster',
      maxHp: 100,
      currentHp: 100,
      damage: 25,
      icon: '👹',
    },
    rewards: [
      {
        id: 'adapter-shield',
        name: 'Adapter Shield',
        icon: '🛡️',
        description: 'Decouples domain logic from database adapters.',
      },
    ],
  },
  {
    id: 'quiz-orc-1',
    title: 'Tightly Coupled Orc',
    type: 'quiz_encounter',
    status: 'locked',
    description: 'An aggressive Orc raiding western outposts. Answer quizzes to defeat him.',
    monster: {
      id: 'orc-1',
      name: 'Coupling Orc Marauder',
      type: 'Spaghetti Code Orc',
      maxHp: 120,
      currentHp: 120,
      damage: 30,
      icon: '🧌',
    },
    rewards: [
      {
        id: 'inversion-ring',
        name: 'Inversion Ring',
        icon: '💍',
        description: 'Grants passive Dependency Inversion aura.',
      },
    ],
  },
  {
    id: 'quiz-wyrm-1',
    title: 'Complexity Wyrm',
    type: 'quiz_encounter',
    status: 'locked',
    description: 'A terrifying wyrm nesting in nested conditional branches!',
    monster: {
      id: 'wyrm-1',
      name: 'Cyclomatic Complexity Wyrm',
      type: 'Nested If-Else Dragonling',
      maxHp: 160,
      currentHp: 160,
      damage: 35,
      icon: '🐉',
    },
    rewards: [
      {
        id: 'complexity-key',
        name: 'Refactoring Key',
        icon: '🔑',
        description: 'Unlocks advanced refactoring paths.',
      },
    ],
  },
  {
    id: 'reflection-puzzle-1',
    title: 'Decryption Vault',
    type: 'reflection_decryption',
    status: 'locked',
    description: 'Decipher monster magic through guided reflection order before time runs out.',
    rewards: [
      {
        id: 'port-blade',
        name: 'Port Blade',
        icon: '⚔️',
        description: 'Enforces strict hexagonal port contracts.',
      },
    ],
  },
  {
    id: 'quiz-hydra-1',
    title: 'Spaghetti Hydra',
    type: 'quiz_encounter',
    status: 'locked',
    description: 'A multi-headed beast born from God Classes and monolithic anti-patterns!',
    monster: {
      id: 'hydra-1',
      name: 'God Class Hydra',
      type: 'Monolithic Anti-Pattern Monster',
      maxHp: 200,
      currentHp: 200,
      damage: 40,
      icon: '🐙',
    },
    rewards: [
      {
        id: 'clean-elixir',
        name: 'Clean Code Elixir',
        icon: '🧪',
        description: 'Restores character to full health instantly.',
      },
    ],
  },
  {
    id: 'quiz-behemoth-1',
    title: 'Mutation Behemoth',
    type: 'quiz_encounter',
    status: 'locked',
    description: 'A towering behemoth mutating unmanaged global state variables!',
    monster: {
      id: 'behemoth-1',
      name: 'State Mutation Behemoth',
      type: 'Side Effect Beast',
      maxHp: 220,
      currentHp: 220,
      damage: 42,
      icon: '🦣',
    },
    rewards: [
      {
        id: 'immutability-charm',
        name: 'Immutability Charm',
        icon: '🧿',
        description: 'Shields character against illegal state mutations.',
      },
    ],
  },

  // Final Boss Lair
  {
    id: 'boss-dragon',
    title: 'Complexity Dragon',
    type: 'boss_lair',
    status: 'locked',
    description: 'The final boss of Hexagonal Architecture! Requires both Adapter Shield and Port Blade to unlock.',
    requiredItems: ['adapter-shield', 'port-blade'],
    monster: {
      id: 'dragon-boss',
      name: 'Monolithic Complexity Dragon',
      type: 'Final Architecture Boss',
      maxHp: 250,
      currentHp: 250,
      damage: 45,
      icon: '🐲',
    },
  },
]



export const GamificationDemoView: React.FC = () => {
  // Global Character State
  const [globalChar, setGlobalChar] = useState<GlobalCharacterState>({
    level: 5,
    exp: 180,
    nextLevelExp: 300,
    unallocatedPoints: 2,
    attributes: {
      armor: 15,
      evasion: 20,
      intelligence: 10,
    },
    unlockedBadges: [
      {
        id: 'first-clear',
        title: 'Domain Pioneer',
        icon: '🏅',
        description: 'Cleared your first topic map without defeat.',
        unlockedAt: '2026-08-15',
      },
      {
        id: 'flawless',
        title: 'Flawless Defender',
        icon: '⭐',
        description: 'Saved all cities without taking damage.',
        unlockedAt: '2026-08-14',
      },
    ],
  })

  // Topic Campaign State
  const [campaign, setCampaign] = useState<TopicCampaignState>({
    topicId: 'hexagonal-architecture',
    topicTitle: 'Hexagonal Architecture & DDD Ports',
    characterHp: 85,
    maxCharacterHp: 100,
    turnCount: 2,
    chaosLevel: 25, // Initial 25% System Chaos
    maxChaosLevel: 100,
    decayThreatLevel: 5,
    inventory: [],
    clearedNodeIds: ['capital-0'],
    activeBuffs: [],
  })

  const [nodes, setNodes] = useState<HexNodeData[]>(MOCK_NODES)
  const [selectedNode, setSelectedNode] = useState<HexNodeData | null>(MOCK_NODES[0])

  const computedCoords = useMemo(() => computeHexGridCoordinates(nodes), [nodes])

  // Active Section Modal
  const [activeSectionModal, setActiveSectionModal] = useState<HexNodeData | null>(null)

  // Launch Section Handler (Increases System Chaos by +15 on section entry)
  const handleLaunchSection = (node: HexNodeData) => {
    setCampaign((prev) => {
      const nextChaos = Math.min(prev.maxChaosLevel, prev.chaosLevel + 15)
      return {
        ...prev,
        chaosLevel: nextChaos,
      }
    })
    setCombatLog((prev) => [
      `🌀 System Chaos increased to ${Math.min(100, campaign.chaosLevel + 15)}% (+15 Chaos from section entry). Healing decay active!`,
      ...prev,
    ])
    setActiveSectionModal(node)
  }

  const [activeBadgesModal, setActiveBadgesModal] = useState<boolean>(false)
  const [combatLog, setCombatLog] = useState<string[]>([])

  // Allocate Attribute Point
  const handleAllocateStat = (stat: 'armor' | 'evasion' | 'intelligence') => {
    if (globalChar.unallocatedPoints <= 0) return
    setGlobalChar((prev) => ({
      ...prev,
      unallocatedPoints: prev.unallocatedPoints - 1,
      attributes: {
        ...prev.attributes,
        [stat]: prev.attributes[stat] + 5,
      },
    }))
  }

  // Quiz Combat Result Execution
  const handleQuizAnswerCombat = (isCorrect: boolean) => {
    if (!selectedNode || !selectedNode.monster) return
    const monster = selectedNode.monster

    if (isCorrect) {
      const updatedHp = Math.max(0, monster.currentHp - 50)
      const isDead = updatedHp === 0

      setNodes((prevNodes) => {
        const updated = prevNodes.map((n) => {
          if (n.id === selectedNode.id && n.monster) {
            return {
              ...n,
              status: isDead ? ('cleared' as const) : ('unlocked' as const),
              monster: { ...n.monster, currentHp: updatedHp },
            }
          }
          return n
        })

        if (!isDead) return updated

        const autoConns = getAutoFlowConnections(updated)
        return updated.map((n) => {
          if (n.status === 'locked') {
            const parentConns = autoConns.filter((c) => c.toId === n.id)
            if (
              parentConns.length > 0 &&
              parentConns.every((c) => updated.find((p) => p.id === c.fromId)?.status === 'cleared')
            ) {
              return { ...n, status: 'unlocked' as const }
            }
          }
          return n
        })
      })

      setCombatLog((prev) => [
        `💥 CRITICAL HIT! You dealt 50 damage to ${monster.name}.`,
        ...(isDead ? [`🎉 VICTORY! Defeated ${monster.name}! Claimed Adapter Shield 🛡️.`] : []),
        ...prev,
      ])

      if (isDead) {
        const reward = selectedNode.rewards?.[0]
        if (reward) {
          setCampaign((c) => ({
            ...c,
            inventory: [...c.inventory, reward],
            clearedNodeIds: [...c.clearedNodeIds, selectedNode.id],
          }))
        }
        setGlobalChar((g) => ({ ...g, exp: Math.min(g.nextLevelExp, g.exp + 60) }))
      }
    } else {
      const dodgeRoll = Math.random() * 100
      const didDodge = dodgeRoll < globalChar.attributes.evasion

      if (didDodge) {
        setCombatLog((prev) => [
          `⚡ EVASION TRIGGERED! You dodged ${monster.name}'s attack completely!`,
          ...prev,
        ])
      } else {
        const rawDamage = monster.damage
        const armorReduction = (globalChar.attributes.armor / 100) * rawDamage
        const finalDamage = Math.max(5, Math.round(rawDamage - armorReduction))

        setCampaign((c) => ({
          ...c,
          characterHp: Math.max(0, c.characterHp - finalDamage),
        }))

        setCombatLog((prev) => [
          `💔 WRONG ANSWER! ${monster.name} hit you for ${finalDamage} damage (Armor absorbed ${Math.round(
            armorReduction
          )}).`,
          ...prev,
        ])
      }
    }
  }

  // Simulate Section Pass / Complete
  const handlePassSection = (targetNode: HexNodeData) => {
    // 1. Mark node as cleared & unlock downstream nodes based on 4.2 flow connections
    setNodes((prevNodes) => {
      const updated = prevNodes.map((n) => {
        if (n.id === targetNode.id) {
          return { ...n, status: 'cleared' as const }
        }
        return n
      })

      const autoConns = getAutoFlowConnections(updated)
      return updated.map((n) => {
        if (n.status === 'locked') {
          const parentConns = autoConns.filter((c) => c.toId === n.id)
          if (
            parentConns.length > 0 &&
            parentConns.every((c) => updated.find((p) => p.id === c.fromId)?.status === 'cleared')
          ) {
            return { ...n, status: 'unlocked' as const }
          }
        }
        return n
      })
    })

    // 2. Collect Item Rewards if any
    if (targetNode.rewards && targetNode.rewards.length > 0) {
      const reward = targetNode.rewards[0]
      setCampaign((prev) => {
        if (prev.inventory.some((i) => i.id === reward.id)) return prev
        return {
          ...prev,
          inventory: [...prev.inventory, reward],
          clearedNodeIds: Array.from(new Set([...prev.clearedNodeIds, targetNode.id])),
        }
      })
      setCombatLog((prev) => [`🎁 COLLECTED ITEM REWARD: ${reward.name} ${reward.icon}!`, ...prev])
    }

    // 3. Award XP & Log success
    setGlobalChar((prev) => ({
      ...prev,
      exp: Math.min(prev.nextLevelExp, prev.exp + 50),
    }))

    setCombatLog((prev) => [
      `🎉 SECTION PASSED: "${targetNode.title}" Completed! +50 XP Gained!`,
      ...prev,
    ])

    // 4. Close modal
    setActiveSectionModal(null)
  }

  // Simulate Section Fail / Defeat
  const handleFailSection = (targetNode: HexNodeData) => {
    const damage = 25
    setCampaign((prev) => ({
      ...prev,
      characterHp: Math.max(0, prev.characterHp - damage),
    }))
    setCombatLog((prev) => [
      `❌ SECTION FAILED: "${targetNode.title}" Failed! Character took ${damage} damage!`,
      ...prev,
    ])
  }


  // Healing Sanctuary Action with Chaos Healing Decay
  const handleRestSanctuary = () => {
    const baseHeal = 30
    const decayRatio = (campaign.chaosLevel / 100) * 0.5
    const effectiveHeal = Math.max(10, Math.round(baseHeal * (1 - decayRatio)))
    const cleansedChaos = 25

    setCampaign((c) => ({
      ...c,
      characterHp: Math.min(c.maxCharacterHp, c.characterHp + effectiveHeal),
      chaosLevel: Math.max(0, c.chaosLevel - cleansedChaos),
    }))

    setCombatLog((prev) => [
      `🏛️ Sanctuary Rested! Restored +${effectiveHeal} HP (Healing decayed from ${baseHeal} HP due to ${campaign.chaosLevel}% Chaos). Cleansed -${cleansedChaos}% Chaos!`,
      ...prev,
    ])
  }


  // Trade-off Crafting Buff Action
  const handleCraftBuff = () => {
    if (!selectedNode || !selectedNode.buff) return
    const buff = selectedNode.buff
    setCampaign((c) => ({
      ...c,
      activeBuffs: [...c.activeBuffs, { stat: buff.stat, value: buff.value, source: selectedNode.title }],
    }))
    setGlobalChar((g) => ({
      ...g,
      attributes: {
        ...g.attributes,
        [buff.stat]: g.attributes[buff.stat] + buff.value,
      },
    }))
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNode.id ? { ...n, status: 'cleared' } : n))
    )
    setActiveSectionModal(null)
  }

  // Check Boss Unlock Criteria
  const hasBossItems =
    campaign.inventory.some((i) => i.id === 'adapter-shield') &&
    campaign.inventory.some((i) => i.id === 'port-blade')

  return (
    <div className="min-h-screen bg-[#1e1e2e] text-[#c6d0f5] p-6 flex flex-col gap-6 font-sans">
      {/* ─── Top Global Character Profile Header ─── */}
      <header className="bg-[#303446]/80 backdrop-blur-xl border border-[#414559] rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Character Title & Level */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8caaee] to-[#ca9ee6] flex items-center justify-center text-2xl shadow-lg border border-[#8caaee]/40">
            🧙‍♂️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#b5bfe2]">Architecture Champion</h1>
              <Badge variant="secondary" className="bg-[#8caaee]/20 text-[#8caaee] border-[#8caaee]/40">
                Level {globalChar.level}
              </Badge>
            </div>
            {/* EXP Bar */}
            <div className="w-48 bg-[#232634] h-2.5 rounded-full overflow-hidden mt-2 border border-[#414559]">
              <div
                className="bg-gradient-to-r from-[#8caaee] to-[#a6d189] h-full transition-all duration-500"
                style={{ width: `${(globalChar.exp / globalChar.nextLevelExp) * 100}%` }}
              />
            </div>
            <span className="text-xs text-[#a5adce] mt-1 block">
              {globalChar.exp} / {globalChar.nextLevelExp} EXP
            </span>
          </div>
        </div>

        {/* Global Character Stats & Allocation */}
        <div className="flex items-center gap-6 bg-[#232634] px-5 py-3 rounded-xl border border-[#414559]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <div>
              <span className="text-xs text-[#a5adce] block">Armor</span>
              <span className="text-sm font-bold text-[#e5c890]">{globalChar.attributes.armor}%</span>
            </div>
            {globalChar.unallocatedPoints > 0 && (
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-[#a6d189]" onClick={() => handleAllocateStat('armor')}>
                +
              </Button>
            )}
          </div>

          <div className="w-px h-8 bg-[#414559]" />

          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <div>
              <span className="text-xs text-[#a5adce] block">Evasion</span>
              <span className="text-sm font-bold text-[#8caaee]">{globalChar.attributes.evasion}%</span>
            </div>
            {globalChar.unallocatedPoints > 0 && (
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-[#a6d189]" onClick={() => handleAllocateStat('evasion')}>
                +
              </Button>
            )}
          </div>

          <div className="w-px h-8 bg-[#414559]" />

          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <div>
              <span className="text-xs text-[#a5adce] block">Intelligence</span>
              <span className="text-sm font-bold text-[#ca9ee6]">{globalChar.attributes.intelligence}%</span>
            </div>
            {globalChar.unallocatedPoints > 0 && (
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-[#a6d189]" onClick={() => handleAllocateStat('intelligence')}>
                +
              </Button>
            )}
          </div>

          {globalChar.unallocatedPoints > 0 && (
            <Badge variant="success" className="animate-pulse ml-2">
              {globalChar.unallocatedPoints} Stat Pts!
            </Badge>
          )}
        </div>

        {/* Badges Button */}
        <Button variant="ghost" onClick={() => setActiveBadgesModal(true)} className="border border-[#414559] hover:bg-[#414559]/50">
          🏆 Badges ({globalChar.unlockedBadges.length})
        </Button>
      </header>

      {/* ─── Topic Campaign HUD Bar ─── */}
      <div className="bg-[#292c3c] border border-[#414559] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗺️</span>
          <div>
            <h2 className="text-sm font-bold text-[#b5bfe2]">{campaign.topicTitle}</h2>
            <span className="text-xs text-[#a5adce]">Topic Campaign Active</span>
          </div>
        </div>

        {/* Character HP Gauge */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <span className="text-lg">❤️</span>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1 font-semibold">
              <span>HP</span>
              <span className={campaign.characterHp < 30 ? 'text-[#e78284]' : 'text-[#a6d189]'}>
                {campaign.characterHp} / {campaign.maxCharacterHp}
              </span>
            </div>
            <div className="w-full bg-[#1e1e2e] h-3 rounded-full overflow-hidden border border-[#414559]">
              <div
                className={`h-full transition-all duration-300 ${
                  campaign.characterHp < 30 ? 'bg-[#e78284]' : 'bg-gradient-to-r from-[#a6d189] to-[#8caaee]'
                }`}
                style={{ width: `${(campaign.characterHp / campaign.maxCharacterHp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* System Chaos / Healing Decay Gauge */}
        <div className="flex items-center gap-3 min-w-[220px]">
          <span className="text-lg">🌀</span>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1 font-semibold">
              <span>System Chaos</span>
              <span className={campaign.chaosLevel > 60 ? 'text-[#e78284]' : 'text-[#ca9ee6]'}>
                {campaign.chaosLevel}% (-{Math.round((campaign.chaosLevel / 100) * 50)}% Heal)
              </span>
            </div>
            <div className="w-full bg-[#1e1e2e] h-3 rounded-full overflow-hidden border border-[#414559]">
              <div
                className={`h-full transition-all duration-300 ${
                  campaign.chaosLevel > 70
                    ? 'bg-[#e78284]'
                    : campaign.chaosLevel > 35
                    ? 'bg-[#e5c890]'
                    : 'bg-[#a6d189]'
                }`}
                style={{ width: `${(campaign.chaosLevel / campaign.maxChaosLevel) * 100}%` }}
              />
            </div>
          </div>
        </div>


        {/* Inventory Tray */}
        <div className="flex items-center gap-2 bg-[#1e1e2e] px-4 py-2 rounded-xl border border-[#414559]">
          <span className="text-xs text-[#a5adce] mr-2">Key Items:</span>
          {campaign.inventory.length === 0 ? (
            <span className="text-xs text-[#737994] italic">Empty</span>
          ) : (
            campaign.inventory.map((item) => (
              <Badge key={item.id} variant="secondary" className="bg-[#8caaee]/20 text-[#8caaee] border-[#8caaee]/40 flex items-center gap-1">
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Badge>
            ))
          )}
        </div>

        {/* Boss Prep Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#a5adce]">Boss Unlock:</span>
          <Badge variant={hasBossItems ? 'success' : 'warning'}>
            {hasBossItems ? '🔓 READY' : '🔒 1/2 Items'}
          </Badge>
        </div>
      </div>

      {/* ─── Main Content Grid: Map Canvas + Inspector Panel ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tabletop Hex Map Canvas */}
        <div className="lg:col-span-2">
          <HexGridCanvas
            nodes={nodes}
            selectedNodeId={selectedNode?.id || null}
            onSelectNode={setSelectedNode}
          />
        </div>

        {/* Right Col: Selected Node Inspector Panel */}
        <Card className="bg-[#303446]/80 backdrop-blur-xl border border-[#414559] rounded-2xl flex flex-col justify-between p-5">
          {selectedNode ? (
            <div className="flex flex-col gap-4">
              {/* Node Title & Status Header */}
              <div className="flex items-center justify-between border-b border-[#414559] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {selectedNode.type === 'capital' && '🏰'}
                    {selectedNode.type === 'reading_sanctuary' && '🏛️'}
                    {selectedNode.type === 'quiz_encounter' && (selectedNode.status === 'locked' ? '🌫️' : '👹')}
                    {selectedNode.type === 'reflection_decryption' && (selectedNode.status === 'locked' ? '🌫️' : '🔮')}
                    {selectedNode.type === 'tradeoff_workshop' && (selectedNode.status === 'locked' ? '🌫️' : '⚒️')}
                    {selectedNode.type === 'boss_lair' && '🐲'}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-[#b5bfe2]">
                      {selectedNode.status === 'locked' && selectedNode.type !== 'boss_lair' ? (
                        <span className="font-mono tracking-widest text-[#ca9ee6] animate-pulse">
                          {encryptToMagicRunes(selectedNode.title)}
                        </span>
                      ) : (
                        selectedNode.title
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#a5adce]">
                      <span className="capitalize">{selectedNode.type.replace('_', ' ')}</span>
                      <span>•</span>
                      {(() => {
                        const coord = selectedNode.coordinates || computedCoords.get(selectedNode.id) || { q: 0, r: 0 }
                        return <span>({coord.q}, {coord.r})</span>
                      })()}
                    </div>
                  </div>
                </div>
                <Badge
                  variant={
                    selectedNode.status === 'cleared'
                      ? 'success'
                      : selectedNode.status === 'unlocked'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {selectedNode.status.toUpperCase()}
                </Badge>
              </div>

              {selectedNode.status === 'locked' ? (
                <>
                  {/* Fog of War Shroud Notice with Magic Encrypted Rune Text */}
                  <div className="bg-[#232634] p-4 rounded-xl border border-[#ca9ee6]/50 text-center space-y-2">
                    <span className="text-3xl block">🌫️</span>
                    <h4 className="text-sm font-bold text-[#ca9ee6] flex items-center justify-center gap-1.5 font-mono tracking-wider">
                      <span>🔮</span>
                      <span>ANCIENT MAGIC CIPHER ENCRYPTED</span>
                    </h4>
                    <div className="bg-[#1e1e2e] p-2.5 rounded-lg border border-[#ca9ee6]/30 font-mono text-xs text-[#ca9ee6] tracking-widest break-all select-none animate-pulse">
                      ᚛ {encryptToMagicRunes(selectedNode.description)} 
                    </div>
                    <p className="text-xs text-[#a5adce] leading-relaxed">
                      Title and content are encrypted by ancient fog magic. Clear prerequisite nodes to lift the cipher.
                    </p>
                  </div>

                  {/* 🔑 4.2 Flow Parent Prerequisites Checklist */}
                  {(() => {
                    const autoConns = getAutoFlowConnections(nodes)
                    const parentConns = autoConns.filter((c) => c.toId === selectedNode.id)
                    if (parentConns.length === 0) return null
                    return (
                      <div className="bg-[#232634] p-3 rounded-xl border border-[#e5c890]/40 space-y-1.5 text-xs">
                        <span className="font-bold text-[#e5c890] block flex items-center gap-1">
                          <span>🔑</span>
                          <span>Prerequisite Nodes to Clear</span>
                        </span>
                        {parentConns.map(({ fromId }) => {
                          const parent = nodes.find((n) => n.id === fromId)
                          const isParentCleared = parent?.status === 'cleared'
                          const parentTitle = isParentCleared || parent?.type === 'capital' || parent?.status !== 'locked'
                            ? (parent?.title || fromId)
                            : encryptToMagicRunes(parent?.title || fromId)
                          return (
                            <div key={fromId} className="flex items-center justify-between bg-[#1e1e2e] px-2.5 py-1.5 rounded-lg">
                              <span className={`font-medium ${isParentCleared ? 'text-[#c6d0f5]' : 'font-mono text-[#ca9ee6] tracking-wider'}`}>
                                {parentTitle}
                              </span>
                              <span className={isParentCleared ? 'text-[#a6d189] font-bold' : 'text-[#e78284] font-semibold'}>
                                {isParentCleared ? '✓ Cleared' : '❌ Uncleared'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}

                  {/* Key Item Reward Provided Preview */}
                  {selectedNode.rewards && selectedNode.rewards.length > 0 && (
                    <div className="bg-[#232634] p-3 rounded-xl border border-[#8caaee]/40 flex items-center gap-3">
                      <span className="text-2xl">{selectedNode.rewards[0].icon}</span>
                      <div>
                        <span className="text-xs text-[#a5adce] block">Key Item Reward Provided</span>
                        <span className="text-sm font-bold text-[#8caaee]">{selectedNode.rewards[0].name}</span>
                        <span className="text-xs text-[#737994] block">{selectedNode.rewards[0].description}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-[#a5adce] leading-relaxed">{selectedNode.description}</p>

                  {/* 🔑 4.2 Flow Parent Prerequisites Checklist */}
                  {(() => {
                    const autoConns = getAutoFlowConnections(nodes)
                    const parentConns = autoConns.filter((c) => c.toId === selectedNode.id)
                    if (parentConns.length === 0) return null
                    return (
                      <div className="bg-[#232634] p-3 rounded-xl border border-[#e5c890]/40 space-y-1.5 text-xs">
                        <span className="font-bold text-[#e5c890] block flex items-center gap-1">
                          <span>🔑</span>
                          <span>Prerequisite Nodes</span>
                        </span>
                        {parentConns.map(({ fromId }) => {
                          const parent = nodes.find((n) => n.id === fromId)
                          const isParentCleared = parent?.status === 'cleared'
                          return (
                            <div key={fromId} className="flex items-center justify-between bg-[#1e1e2e] px-2.5 py-1 rounded-lg">
                              <span className="text-[#c6d0f5] font-medium">{parent?.title || fromId}</span>
                              <span className={isParentCleared ? 'text-[#a6d189] font-bold' : 'text-[#e78284] font-semibold'}>
                                {isParentCleared ? '✓ Cleared' : '❌ Uncleared'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}

                  {/* Stat Buff Modifier Card */}
                  {selectedNode.buff && (
                    <div className="bg-[#232634] p-3 rounded-xl border border-[#ca9ee6]/40 flex items-center gap-3">
                      <span className="text-2xl">✨</span>
                      <div>
                        <span className="text-xs text-[#a5adce] block">Section Stat Buff</span>
                        <span className="text-sm font-bold text-[#ca9ee6]">
                          +{selectedNode.buff.value}% {selectedNode.buff.label} ({selectedNode.buff.stat})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Monster Info Card */}
                  {selectedNode.monster && (
                    <div className="bg-[#232634] p-3 rounded-xl border border-[#e78284]/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{selectedNode.monster.icon}</span>
                        <div>
                          <span className="text-sm font-bold text-[#e78284]">{selectedNode.monster.name}</span>
                          <span className="text-xs text-[#a5adce] block">Atk Damage: {selectedNode.monster.damage}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[#a5adce] block">Monster HP</span>
                        <span className="text-sm font-bold text-[#e78284]">
                          {selectedNode.monster.currentHp} / {selectedNode.monster.maxHp}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Item Reward Badge */}
                  {selectedNode.rewards && selectedNode.rewards.length > 0 && (
                    <div className="bg-[#232634] p-3 rounded-xl border border-[#8caaee]/30 flex items-center gap-3">
                      <span className="text-2xl">{selectedNode.rewards[0].icon}</span>
                      <div>
                        <span className="text-xs text-[#a5adce] block">Item Reward</span>
                        <span className="text-sm font-bold text-[#8caaee]">{selectedNode.rewards[0].name}</span>
                      </div>
                    </div>
                  )}

                  {/* Combat Log */}
                  {combatLog.length > 0 && (
                    <div className="bg-[#1e1e2e] p-3 rounded-xl border border-[#414559] max-h-32 overflow-y-auto text-xs space-y-1 font-mono">
                      <span className="text-[#a5adce] font-bold block mb-1">📜 Combat Log:</span>
                      {combatLog.slice(0, 4).map((log, i) => (
                        <div key={i} className="text-[#c6d0f5]">
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-[#737994]">Select a hex node on the map to inspect</div>
          )}

          {/* Action Button: Launches Section Modal */}
          {selectedNode && (
            <div className="mt-4 pt-3 border-t border-[#414559]">
              <Button
                disabled={selectedNode.status === 'locked'}
                className={`w-full font-bold ${
                  selectedNode.status === 'locked'
                    ? 'bg-[#414559] text-[#737994] cursor-not-allowed border border-[#51576d]'
                    : 'bg-[#8caaee] hover:bg-[#8caaee]/80 text-[#232634]'
                }`}
                onClick={() => handleLaunchSection(selectedNode)}
              >
                {selectedNode.status === 'locked'
                  ? 'Locked - Clear Prerequisites First'
                  : `🎮 Enter ${selectedNode.title} (Launch Section & +15 Chaos)`}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* ─── REAL SECTION MODAL (FULL SCREEN) ─── */}
      <Modal
        open={!!activeSectionModal}
        onClose={() => setActiveSectionModal(null)}
        maxWidth="full"
        title={activeSectionModal?.title}
      >
        {activeSectionModal && (
          <div className="p-6 bg-[#1e1e2e] text-[#c6d0f5] rounded-2xl border border-[#414559] space-y-6 min-h-[88vh] max-h-[92vh] overflow-y-auto w-full max-w-7xl mx-auto">

            {/* Modal Header Badge */}
            <div className="flex items-center justify-between border-b border-[#414559] pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {activeSectionModal.type === 'capital' && '🏰'}
                  {activeSectionModal.type === 'reading_sanctuary' && '🏛️'}
                  {activeSectionModal.type === 'quiz_encounter' && '👹'}
                  {activeSectionModal.type === 'reflection_decryption' && '🔮'}
                  {activeSectionModal.type === 'tradeoff_workshop' && '⚒️'}
                  {activeSectionModal.type === 'boss_lair' && '🐲'}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#b5bfe2]">{activeSectionModal.title}</h3>
                  <span className="text-xs text-[#a5adce] capitalize">{activeSectionModal.type.replace('_', ' ')} Section</span>
                </div>
              </div>
              <Badge variant="secondary" className="bg-[#8caaee]/20 text-[#8caaee]">
                Real OKF Section UI
              </Badge>
            </div>

            {/* ─── 1. Capital (IntroSection) ─── */}
            {activeSectionModal.type === 'capital' && (
              <div className="space-y-4">
                <IntroSection
                  title={CAPITAL_INTRO_DATA.title}
                  subtitle={CAPITAL_INTRO_DATA.subtitle}
                  what={CAPITAL_INTRO_DATA.what}
                  why={CAPITAL_INTRO_DATA.why}
                  roadmap={CAPITAL_INTRO_DATA.roadmap}
                />
              </div>
            )}

            {/* ─── 2. Reading Sanctuary (TextSection) ─── */}
            {activeSectionModal.type === 'reading_sanctuary' && (
              <div className="space-y-4">
                <TextSection
                  title={SANCTUARY_TEXT_DATA.title}
                  heading={SANCTUARY_TEXT_DATA.heading}
                  paragraphs={SANCTUARY_TEXT_DATA.paragraphs}
                />
                {activeSectionModal.status !== 'cleared' && (
                  <div className="pt-4 border-t border-[#414559] flex justify-end">
                    <Button className="bg-[#a6d189] hover:bg-[#a6d189]/80 text-[#232634] font-bold" onClick={handleRestSanctuary}>
                      🏛️ Absorb Domain Invariants & Recover HP (+30 HP)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ─── 3. Quiz Encounter (QuizSection) ─── */}
            {activeSectionModal.type === 'quiz_encounter' && (
              <div className="space-y-4">
                {activeSectionModal.monster && (
                  <div className="bg-[#232634] p-3 rounded-xl border border-[#e78284]/30 flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{activeSectionModal.monster.icon}</span>
                      <div>
                        <span className="text-sm font-bold text-[#e78284]">{activeSectionModal.monster.name}</span>
                        <span className="text-xs text-[#a5adce] block">Damage: {activeSectionModal.monster.damage}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#a5adce] block">Monster HP</span>
                      <span className="text-sm font-bold text-[#e78284]">
                        {activeSectionModal.monster.currentHp} / {activeSectionModal.monster.maxHp}
                      </span>
                    </div>
                  </div>
                )}

                {/* Real QuizSection Component */}
                <QuizSection title="Dependency Goblin Battle Quiz" questions={QUIZ_GOBLIN_QUESTIONS} />

                {/* Simulated Combat Execution Triggers */}
                <div className="pt-4 border-t border-[#414559] flex items-center justify-between">
                  <span className="text-xs text-[#a5adce]">Simulate Combat Response:</span>
                  <div className="flex gap-3">
                    <Button variant="ghost" className="border border-[#e78284] text-[#e78284] hover:bg-[#e78284]/20" onClick={() => handleQuizAnswerCombat(false)}>
                      💔 Simulate Wrong Answer (Take Damage)
                    </Button>
                    <Button className="bg-[#a6d189] hover:bg-[#a6d189]/80 text-[#232634] font-bold" onClick={() => handleQuizAnswerCombat(true)}>
                      💥 Simulate Correct Answer (Deal 50 Dmg)
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── 4. Reflection Decryption (ReflectionSequenceSection) ─── */}
            {activeSectionModal.type === 'reflection_decryption' && (
              <div className="space-y-4">
                <ReflectionSequenceSection
                  title={REFLECTION_SEQUENCE_DATA.title}
                  prompt={REFLECTION_SEQUENCE_DATA.prompt}
                  items={REFLECTION_SEQUENCE_DATA.items}
                  solution={REFLECTION_SEQUENCE_DATA.solution}
                />
              </div>
            )}

            {/* ─── 5. Tradeoff Workshop (TradeoffSandboxSection) ─── */}
            {activeSectionModal.type === 'tradeoff_workshop' && (
              <div className="space-y-4">
                <TradeoffSandboxSection
                  title="Storage Adapter Metrics Workshop"
                  scenarios={TRADEOFF_SCENARIOS_DATA as any}
                />
                {activeSectionModal.status !== 'cleared' && (
                  <div className="pt-4 border-t border-[#414559] flex justify-end">
                    <Button className="bg-[#e5c890] hover:bg-[#e5c890]/80 text-[#232634] font-bold" onClick={handleCraftBuff}>
                      ⚒️ Finalize Metrics & Craft Armor Buff (+10 Armor)
                    </Button>
                  </div>
                )}
              </div>
            )}



            {/* ─── 6. Boss Lair ─── */}
            {activeSectionModal.type === 'boss_lair' && (
              <div className="space-y-4 text-center py-6">
                <span className="text-6xl animate-bounce block">🐲</span>
                <h3 className="text-2xl font-bold text-[#ea999c]">Monolithic Complexity Dragon</h3>
                <p className="text-sm text-[#a5adce] max-w-md mx-auto">
                  The Dragon guards the final architecture realm! You must unleash both your Adapter Shield and Port Blade to save the realm.
                </p>

                <div className="flex justify-center gap-4 py-4">
                  <Badge variant="secondary" className="bg-[#8caaee]/20 text-[#8caaee] text-sm px-3 py-1">
                    🛡️ Adapter Shield: Equipped
                  </Badge>
                  <Badge variant="secondary" className="bg-[#ca9ee6]/20 text-[#ca9ee6] text-sm px-3 py-1">
                    ⚔️ Port Blade: Equipped
                  </Badge>
                </div>

                <Button className="bg-[#ea999c] hover:bg-[#ea999c]/80 text-[#232634] text-lg px-8 py-3 font-bold">
                  💥 Unleash Hexagonal Combo & Defeat Boss!
                </Button>
              </div>
            )}

            {/* Rule-Based Section Outcome Action Footer */}
            <div className="pt-4 border-t border-[#414559] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#a5adce]">
                <span className="font-semibold">Section Rule:</span>
                {activeSectionModal.type === 'capital' && <span>📖 Read & Absorb Capital Blueprint</span>}
                {activeSectionModal.type === 'reading_sanctuary' && <span>🏛️ Read & Recover Sanctuary Invariants</span>}
                {activeSectionModal.type === 'quiz_encounter' && <span>👹 Knowledge Check Combat (Pass / Fail)</span>}
                {activeSectionModal.type === 'reflection_decryption' && <span>🔮 Sequence Alignment Check</span>}
                {activeSectionModal.type === 'tradeoff_workshop' && <span>⚒️ Evaluate Trade-offs & Craft Buff</span>}
                {activeSectionModal.type === 'boss_lair' && <span>🐲 Boss Battle (Requires Key Items)</span>}
              </div>

              <div className="flex items-center gap-3">
                {/* Peaceful reading sections (capital, reading_sanctuary, tradeoff_workshop) only have completion */}
                {activeSectionModal.type === 'capital' && (
                  <Button
                    className="bg-[#8caaee] hover:bg-[#8caaee]/80 text-[#232634] font-bold text-xs px-4"
                    onClick={() => handlePassSection(activeSectionModal)}
                  >
                    📖 Complete Reading & Reveal Neighbor Hexes (+50 XP)
                  </Button>
                )}

                {activeSectionModal.type === 'reading_sanctuary' && (
                  <Button
                    className="bg-[#a6d189] hover:bg-[#a6d189]/80 text-[#232634] font-bold text-xs px-4"
                    onClick={() => {
                      handleRestSanctuary()
                      handlePassSection(activeSectionModal)
                    }}
                  >
                    🏛️ Complete Reading & Recover HP (+30 HP & +50 XP)
                  </Button>
                )}

                {activeSectionModal.type === 'tradeoff_workshop' && (
                  <Button
                    className="bg-[#e5c890] hover:bg-[#e5c890]/80 text-[#232634] font-bold text-xs px-4"
                    onClick={() => {
                      handleCraftBuff()
                      handlePassSection(activeSectionModal)
                    }}
                  >
                    ⚒️ Finalize Trade-offs & Craft Stat Buff (+10 Armor)
                  </Button>
                )}

                {/* Encounters & Battles (quiz_encounter, reflection_decryption, boss_lair) have both Pass & Fail */}
                {activeSectionModal.type === 'quiz_encounter' && (
                  <>
                    <Button
                      className="bg-[#e78284] hover:bg-[#e78284]/80 text-[#232634] font-bold text-xs px-4"
                      onClick={() => handleFailSection(activeSectionModal)}
                    >
                      💔 Wrong Quiz Answer / Fail Encounter (-25 HP)
                    </Button>
                    <Button
                      className="bg-[#a6d189] hover:bg-[#a6d189]/80 text-[#232634] font-bold text-xs px-4"
                      onClick={() => handlePassSection(activeSectionModal)}
                    >
                      💥 Pass Quiz & Defeat Monster (+50 XP & Reward)
                    </Button>
                  </>
                )}

                {activeSectionModal.type === 'reflection_decryption' && (
                  <>
                    <Button
                      className="bg-[#e78284] hover:bg-[#e78284]/80 text-[#232634] font-bold text-xs px-4"
                      onClick={() => handleFailSection(activeSectionModal)}
                    >
                      ⚡ Misaligned Sequence (-15 HP)
                    </Button>
                    <Button
                      className="bg-[#ca9ee6] hover:bg-[#ca9ee6]/80 text-[#232634] font-bold text-xs px-4"
                      onClick={() => handlePassSection(activeSectionModal)}
                    >
                      🔮 Decipher Sequence & Claim Port Blade ⚔️ (+50 XP)
                    </Button>
                  </>
                )}

                {activeSectionModal.type === 'boss_lair' && (
                  <>
                    <Button
                      className="bg-[#e78284] hover:bg-[#e78284]/80 text-[#232634] font-bold text-xs px-4"
                      onClick={() => handleFailSection(activeSectionModal)}
                    >
                      🔥 Dragon Fire Damage (-40 HP)
                    </Button>
                    <Button
                      className="bg-[#ea999c] hover:bg-[#ea999c]/80 text-[#232634] font-bold text-xs px-4"
                      onClick={() => handlePassSection(activeSectionModal)}
                    >
                      🐲 Defeat Monolithic Dragon & Save Realm (+100 XP)
                    </Button>
                  </>
                )}

                <Button variant="ghost" className="text-xs" onClick={() => setActiveSectionModal(null)}>
                  Close
                </Button>
              </div>
            </div>

          </div>
        )}
      </Modal>


      {/* ─── Badges Modal ─── */}
      <Modal open={activeBadgesModal} onClose={() => setActiveBadgesModal(false)} maxWidth="md" title="Achievements & Badges">
        <div className="p-2 text-[#c6d0f5]">
          <h3 className="text-lg font-bold text-[#b5bfe2] mb-4">🏆 Unlocked Achievements & Badges</h3>
          <div className="grid grid-cols-1 gap-3 mb-6">
            {globalChar.unlockedBadges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#232634] border border-[#8caaee]/30">
                <span className="text-3xl">{badge.icon}</span>
                <div>
                  <h4 className="text-sm font-bold text-[#8caaee]">{badge.title}</h4>
                  <p className="text-xs text-[#a5adce]">{badge.description}</p>
                  <span className="text-[10px] text-[#737994] block mt-1">Unlocked: {badge.unlockedAt}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setActiveBadgesModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
