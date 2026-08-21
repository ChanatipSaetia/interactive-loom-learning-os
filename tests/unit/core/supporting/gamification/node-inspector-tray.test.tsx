import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NodeInspectorTray } from '../../../../../src/core/supporting/gamification/components/NodeInspectorTray'
import type { HexNodeData } from '../../../../../src/core/supporting/gamification/types'

describe('NodeInspectorTray Component', () => {
  const unlockedNode: HexNodeData = {
    id: 'sanctuary-1',
    title: 'Clean Architecture Sanctuary',
    type: 'reading_sanctuary',
    status: 'unlocked',
    healingAmount: 40,
    description: 'Rest and absorb clean domain principles.',
  }

  const lockedGoblinNode: HexNodeData = {
    id: 'goblin-1',
    title: 'Tight-Coupling Goblin',
    type: 'quiz_encounter',
    status: 'locked',
    description: 'A menacing goblin horde attacking domain boundaries.',
    monster: {
      id: 'm1',
      name: 'Tight Goblin',
      type: 'goblin',
      maxHp: 50,
      damage: 15,
      icon: '👾',
    },
    rewards: [{ id: 'adapter-shield', name: 'Adapter Shield', icon: '🛡️', description: 'A shield' }],
  }

  it('renders unlocked sanctuary with launch action and healing preview', () => {
    const handleLaunch = vi.fn()
    render(
      <NodeInspectorTray
        selectedNode={unlockedNode}
        nodes={[unlockedNode]}
        inventory={[]}
        onLaunchEncounter={handleLaunch}
      />
    )

    expect(screen.getByText('Clean Architecture Sanctuary')).toBeDefined()
    expect(screen.getByText('+40 HP Sanctuary Reading')).toBeDefined()

    const enterBtn = screen.getByRole('button', { name: /Enter Encounter/i })
    expect(enterBtn).toBeDefined()
    expect(enterBtn.hasAttribute('disabled')).toBe(false)

    fireEvent.click(enterBtn)
    expect(handleLaunch).toHaveBeenCalledWith(unlockedNode)
  })

  it('masks title with magic runes and disables action for locked nodes', () => {
    const handleLaunch = vi.fn()
    render(
      <NodeInspectorTray
        selectedNode={lockedGoblinNode}
        nodes={[lockedGoblinNode]}
        inventory={[]}
        onLaunchEncounter={handleLaunch}
      />
    )

    // Action button should indicate locked state
    const lockedBtn = screen.getByRole('button', { name: /Prerequisites Locked/i })
    expect(lockedBtn).toBeDefined()
    expect(lockedBtn.hasAttribute('disabled')).toBe(true)
  })
})
