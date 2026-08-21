import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EncounterDrawer } from '../../../../../src/core/supporting/gamification/components/EncounterDrawer'
import { CombatStageHeader } from '../../../../../src/core/supporting/gamification/components/CombatStageHeader'
import { SanctuaryTickMonitor } from '../../../../../src/core/supporting/gamification/components/SanctuaryTickMonitor'
import { RunicCountdownRing } from '../../../../../src/core/supporting/gamification/components/RunicCountdownRing'
import { TradeoffStatPreviewBar } from '../../../../../src/core/supporting/gamification/components/TradeoffStatPreviewBar'
import { BossBattleArena } from '../../../../../src/core/supporting/gamification/components/BossBattleArena'
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
})
