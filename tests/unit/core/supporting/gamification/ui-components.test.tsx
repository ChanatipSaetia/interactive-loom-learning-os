import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { EncounterDrawer } from '../../../../../src/core/supporting/gamification/components/EncounterDrawer'
import { CombatStageHeader } from '../../../../../src/core/supporting/gamification/components/CombatStageHeader'
import { SanctuaryTickMonitor } from '../../../../../src/core/supporting/gamification/components/SanctuaryTickMonitor'
import { RunicCountdownRing } from '../../../../../src/core/supporting/gamification/components/RunicCountdownRing'
import { TradeoffStatPreviewBar } from '../../../../../src/core/supporting/gamification/components/TradeoffStatPreviewBar'
import { BossBattleArena } from '../../../../../src/core/supporting/gamification/components/BossBattleArena'
import { HexGridCanvas } from '../../../../../src/core/supporting/gamification/components/HexGridCanvas'
import type { HexNodeData, MonsterData, CharacterAttributes } from '../../../../../src/core/supporting/gamification/types'

describe('Gamification Real UI Components', () => {
  const mockNode: HexNodeData = {
    id: 'quiz-1',
    title: 'Quiz Battle Node',
    type: 'quiz_encounter',
    status: 'unlocked',
    description: 'Encounter node',
  }

  const mockMonster: MonsterData = {
    id: 'm1',
    name: 'Goblin Boss',
    type: 'goblin',
    maxHp: 100,
    currentHp: 80,
    damage: 20,
    icon: '👹',
  }

  const mockAttributes: CharacterAttributes = {
    armor: 15,
    evasion: 20,
    intelligence: 10,
  }

  it('renders EncounterDrawer with children and controls', () => {
    const handleClose = vi.fn()
    render(
      <EncounterDrawer node={mockNode} isOpen={true} onClose={handleClose}>
        <div>Drawer Content Inside</div>
      </EncounterDrawer>
    )

    expect(screen.getByText('Quiz Battle Node')).toBeDefined()
    expect(screen.getByText('Drawer Content Inside')).toBeDefined()

    const closeBtn = screen.getByTitle('Close Encounter')
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalled()
  })

  it('renders CombatStageHeader and handles item triggers', () => {
    const handleUseItem = vi.fn()
    render(
      <CombatStageHeader
        monster={mockMonster}
        playerAttributes={mockAttributes}
        playerHp={85}
        maxPlayerHp={100}
        inventory={[{ id: 'port-blade', name: 'Port Blade', icon: '⚔️', description: '' }]}
        onUseItem={handleUseItem}
        combatLogMessage="Combat active!"
      />
    )

    expect(screen.getByText('Goblin Boss')).toBeDefined()
    expect(screen.getByText('Architect Champion')).toBeDefined()
    expect(screen.getByText('Combat active!')).toBeDefined()

    const itemBtn = screen.getByRole('button', { name: /Port Blade/i })
    fireEvent.click(itemBtn)
    expect(handleUseItem).toHaveBeenCalledWith('port-blade')
  })

  it('renders TradeoffStatPreviewBar and triggers forge', () => {
    const handleForge = vi.fn()
    render(
      <TradeoffStatPreviewBar
        metrics={[
          { id: 'consistency', label: 'Consistency', value: 80 },
          { id: 'latency', label: 'Latency', value: 30 },
        ]}
        onForgeArtifact={handleForge}
      />
    )

    expect(screen.getByText('Synthesized Weapon Artifact')).toBeDefined()
    const forgeBtn = screen.getByRole('button', { name: /Forge & Equip Artifact/i })
    fireEvent.click(forgeBtn)
    expect(handleForge).toHaveBeenCalled()
  })

  it('renders RunicCountdownRing and tracks solution state', () => {
    render(<RunicCountdownRing isSolved={true} onTimeout={vi.fn()} />)
    expect(screen.getByText('Runic Cipher Decrypted!')).toBeDefined()
  })

  it('renders SanctuaryTickMonitor and calculates decay potency and global pulse limits', () => {
    const handleTick = vi.fn()
    const { rerender } = render(
      <SanctuaryTickMonitor
        visitCount={2}
        pulsesUsed={1}
        maxTicks={5}
        onTickHeal={handleTick}
      />
    )

    expect(screen.getByText('Active Reading Sanctuary')).toBeDefined()
    expect(screen.getByText(/50% Potency/i)).toBeDefined()
    expect(screen.getByText(/1\/5 Global Pulses/i)).toBeDefined()

    // Test depleted state
    rerender(
      <SanctuaryTickMonitor
        visitCount={2}
        pulsesUsed={5}
        maxTicks={5}
        onTickHeal={handleTick}
      />
    )
    expect(screen.getByText(/Depleted \(5\/5\)/i)).toBeDefined()
  })

  it('triggers onTickHeal exactly once per 10s active reading and respects max pulses', () => {
    vi.useFakeTimers()
    const handleTick = vi.fn()
    const { rerender } = render(
      <SanctuaryTickMonitor
        visitCount={1}
        pulsesUsed={0}
        maxTicks={2}
        onTickHeal={handleTick}
      />
    )

    // Advance 9 seconds - no tick yet
    act(() => {
      vi.advanceTimersByTime(9000)
    })
    expect(handleTick).not.toHaveBeenCalled()

    // Advance 1 second (total 10s) - tick 1 fires with 10 HP
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(handleTick).toHaveBeenCalledTimes(1)
    expect(handleTick).toHaveBeenCalledWith(10)

    // Simulate parent updating pulsesUsed to 1
    rerender(
      <SanctuaryTickMonitor
        visitCount={1}
        pulsesUsed={1}
        maxTicks={2}
        onTickHeal={handleTick}
      />
    )

    // Advance 10 more seconds (total 20s) - tick 2 fires
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(handleTick).toHaveBeenCalledTimes(2)

    // Simulate parent updating pulsesUsed to 2 (max reached)
    rerender(
      <SanctuaryTickMonitor
        visitCount={1}
        pulsesUsed={2}
        maxTicks={2}
        onTickHeal={handleTick}
      />
    )

    // Advance 10 more seconds - should not fire again
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(handleTick).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  it('pauses pulse countdown when character HP is full and resumes when damaged', () => {
    vi.useFakeTimers()
    const handleTick = vi.fn()
    const { rerender } = render(
      <SanctuaryTickMonitor
        visitCount={1}
        pulsesUsed={0}
        maxTicks={5}
        characterHp={100}
        maxCharacterHp={100}
        onTickHeal={handleTick}
      />
    )

    expect(screen.getByText('Full HP (Paused)')).toBeDefined()
    expect(screen.getByText(/Character health is full/i)).toBeDefined()

    // Advance 30 seconds - should not tick because HP is full
    act(() => {
      vi.advanceTimersByTime(30000)
    })
    expect(handleTick).not.toHaveBeenCalled()

    // Character takes damage (HP drops to 60/100)
    rerender(
      <SanctuaryTickMonitor
        visitCount={1}
        pulsesUsed={0}
        maxTicks={5}
        characterHp={60}
        maxCharacterHp={100}
        onTickHeal={handleTick}
      />
    )

    // Advance 10 seconds - pulse should now trigger
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(handleTick).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('renders BossBattleArena and handles item combos', () => {
    const handleVictory = vi.fn()
    render(
      <BossBattleArena
        monster={mockMonster}
        playerAttributes={mockAttributes}
        playerHp={100}
        maxPlayerHp={100}
        inventory={[]}
        onVictory={handleVictory}
        onTakeDamage={vi.fn()}
      />
    )

    expect(screen.getByText(/Monolithic Titan rises/i)).toBeDefined()
    const bladeBtn = screen.getByRole('button', { name: /Strike with Port Blade/i })
    fireEvent.click(bladeBtn)
    expect(screen.getByText(/Unleashed Port Blade! Slashed Goblin Boss for 40 true damage!/i)).toBeDefined()
  })

  it('renders BossBattleArena with dynamic campaign key items and achieves victory', () => {
    const handleVictory = vi.fn()
    const handleTakeDamage = vi.fn()
    const customBoss = {
      id: 'colossus',
      name: 'Zero-Division Colossus',
      type: 'boss' as const,
      maxHp: 80,
      currentHp: 80,
      damage: 30,
      icon: '🐲',
    }
    const inventory = [
      {
        id: 'plus-shield',
        name: 'Aegis of Addition',
        icon: '🛡️',
        description: 'Blocks next attack',
      },
      {
        id: 'product-blade',
        name: 'Blade of Products',
        icon: '⚔️',
        description: 'Slices numbers with 40 damage',
      },
    ]

    render(
      <BossBattleArena
        monster={customBoss}
        playerAttributes={{ armor: 5, evasion: 10, intelligence: 10 }}
        playerHp={100}
        maxPlayerHp={100}
        inventory={inventory}
        onVictory={handleVictory}
        onTakeDamage={handleTakeDamage}
      />
    )

    expect(screen.getByText('Zero-Division Colossus')).toBeDefined()
    const deployShieldBtn = screen.getByRole('button', { name: /Deploy Aegis of Addition/i })
    const strikeBladeBtn = screen.getByRole('button', { name: /Strike with Blade of Products/i })

    // Use shield
    fireEvent.click(deployShieldBtn)
    expect(screen.getByText(/Activated Aegis of Addition! Nullifies the next incoming attack/i)).toBeDefined()

    // Strike with blade (shield absorbs counterattack)
    fireEvent.click(strikeBladeBtn)
    expect(screen.getByText(/Shield completely blocked Zero-Division Colossus's counterattack!/i)).toBeDefined()
    expect(handleTakeDamage).not.toHaveBeenCalled()

    // Strike again to defeat boss (80 HP - 40 - 40 = 0 HP)
    fireEvent.click(strikeBladeBtn)
    expect(handleVictory).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hexagonal-mastery-crown' })
    )
    expect(screen.getByText(/Campaign Victory Achieved!/i)).toBeDefined()
  })

  it('renders HexGridCanvas with pan/zoom controls and legend', () => {
    const handleSelect = vi.fn()
    render(
      <HexGridCanvas
        nodes={[mockNode]}
        selectedNodeId={null}
        onSelectNode={handleSelect}
      />
    )

    expect(screen.getByTitle('Zoom In')).toBeDefined()
    expect(screen.getByTitle('Zoom Out')).toBeDefined()
    expect(screen.getByTitle('Reset Pan & Zoom')).toBeDefined()
    expect(screen.getByText('Capital')).toBeDefined()
    expect(screen.getByText('Sanctuary')).toBeDefined()
    expect(screen.getByText('Locked (Fog)')).toBeDefined()
  })
})

