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

  it('masks title with magic runes, shows foggy icon, hides rewards/specs, and disables action for locked nodes', () => {
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

    // Foggy icon should be displayed instead of monster icon
    expect(screen.getByText('🌫️')).toBeDefined()
    expect(screen.queryByText('👾')).toBeNull()

    // Monster preview and item reward should NOT be shown
    expect(screen.queryByText('Tight Goblin')).toBeNull()
    expect(screen.queryByText(/Reward:/i)).toBeNull()
    expect(screen.queryByText(/Adapter Shield/i)).toBeNull()
  })

  it('renders unlocked reflection node with Volatile Arcane Bomb hazard preview', () => {
    const reflectionNode: HexNodeData = {
      id: 'reflection-1',
      title: 'Decryption Altar',
      type: 'reflection_decryption',
      status: 'unlocked',
      description: 'Ancient cryptographic matrix.',
    }

    render(
      <NodeInspectorTray
        selectedNode={reflectionNode}
        nodes={[reflectionNode]}
        inventory={[]}
        onLaunchEncounter={vi.fn()}
      />
    )

    expect(screen.getByText('Decryption Altar')).toBeDefined()
    expect(screen.getByText('Volatile Arcane Bomb')).toBeDefined()
    expect(screen.getByText(/on Fail\/Timeout/i)).toBeDefined()
  })

  it('renders Citadel Intelligence key item quest ledger when capital node is cleared', () => {
    const capitalNode: HexNodeData = {
      id: 'capital',
      title: 'Citadel Hub',
      type: 'capital',
      status: 'cleared',
      description: 'Capital citadel.',
    }
    const goblinNode: HexNodeData = {
      id: 'goblin',
      title: 'Goblin Fortress',
      type: 'quiz_encounter',
      status: 'unlocked',
      description: 'Goblin fort.',
      rewards: [{ id: 'item-shield', name: 'Shield of Wisdom', icon: '🛡️', description: 'A shield' }],
    }
    const bossNode: HexNodeData = {
      id: 'boss',
      title: 'Dragon Lair',
      type: 'boss_lair',
      status: 'locked',
      description: 'The dragon.',
      requiredItems: ['item-shield'],
    }

    render(
      <NodeInspectorTray
        selectedNode={capitalNode}
        nodes={[capitalNode, goblinNode, bossNode]}
        inventory={[]}
        onLaunchEncounter={vi.fn()}
      />
    )

    expect(screen.getByText(/Citadel Intelligence: Boss Key Item Quests/i)).toBeDefined()
    expect(screen.getByText('Shield of Wisdom')).toBeDefined()
    expect(screen.getByText(/Guarded at Goblin Fortress/i)).toBeDefined()
    expect(screen.getByText('0/1 Collected')).toBeDefined()
  })

  it('renders Dragon Lair prerequisite seals checklist on boss node', () => {
    const bossNode: HexNodeData = {
      id: 'boss',
      title: 'Dragon Lair',
      type: 'boss_lair',
      status: 'locked',
      description: 'The dragon.',
      requiredItems: ['item-shield'],
    }
    const rewardItem = { id: 'item-shield', name: 'Shield of Wisdom', icon: '🛡️', description: 'A shield' }

    render(
      <NodeInspectorTray
        selectedNode={bossNode}
        nodes={[bossNode]}
        inventory={[rewardItem]}
        onLaunchEncounter={vi.fn()}
      />
    )

    expect(screen.getByText(/Dragon Lair Prerequisite Seals/i)).toBeDefined()
    expect(screen.getByText('Shield of Wisdom')).toBeDefined()
    expect(screen.getByText('1/1 Keys Held')).toBeDefined()
  })
})
