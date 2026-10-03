/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { describe, it, expect } from 'vitest'
// @ts-ignore
import * as fs from 'fs'
// @ts-ignore
import * as path from 'path'
import * as yaml from 'js-yaml'
import {
  canUnlockBoss,
  resolveBossItemAction,
} from '../../../../../src/core/supporting/gamification/game-rules'
import { validateHexCampaign } from '../../../../../src/core/learning-engine/validation/gateway'
import type { HexCampaignData } from '../../../../../src/core/generic/hex-map/schema'

describe('PixiJS Campaign Boss Lair & Key Item End-to-End Validation', () => {
  // @ts-ignore
  const cwd = typeof process !== 'undefined' && process.cwd ? process.cwd() : '.'
  const hexMapPath = path.resolve(cwd, 'public/hexmaps/pixijs.yaml')
  const rawYaml = fs.readFileSync(hexMapPath, 'utf-8')
  const campaign = yaml.load(rawYaml) as HexCampaignData
  const sections = fs
    .readdirSync(path.resolve(cwd, 'public/content/pixijs/sections'))
    .filter((f: string) => f.endsWith('.oui'))
    .map((f: string) => f.replace(/\.oui$/, ''))

  it('passes 3-Tier validation cleanly', () => {
    const valResult = validateHexCampaign(rawYaml, sections)
    expect(valResult.status).toBe('valid')
    expect(valResult.diagnostics).toHaveLength(0)
    expect(valResult.payload.nodes.length).toBeGreaterThanOrEqual(10)
  })

  it('contains all required items across campaign reward drops', () => {
    const bossNode = campaign.nodes.find((n) => n.type === 'boss_lair')
    expect(bossNode).toBeDefined()
    expect(bossNode?.requiredItems).toBeDefined()
    expect(bossNode!.requiredItems!.length).toBeGreaterThan(0)

    const allDroppedRewards = campaign.nodes
      .filter((n) => n.type !== 'boss_lair')
      .flatMap((n) => n.rewards || [])

    const droppedItemIds = new Set(allDroppedRewards.map((r) => r.id))

    // Every required item must exist in the campaign
    for (const reqId of bossNode!.requiredItems!) {
      expect(droppedItemIds.has(reqId)).toBe(true)
    }
  })

  it('unlocks the Boss Lair when all required items are in inventory', () => {
    const bossNode = campaign.nodes.find((n) => n.type === 'boss_lair')!
    const allDroppedRewards = campaign.nodes
      .filter((n) => n.type !== 'boss_lair')
      .flatMap((n) => n.rewards || [])

    // With empty inventory -> cannot unlock
    expect(canUnlockBoss([], bossNode)).toBe(false)

    // With partial inventory -> cannot unlock
    const partialInventory = allDroppedRewards.slice(0, 1)
    expect(canUnlockBoss(partialInventory, bossNode)).toBe(false)

    // With full required inventory -> unlocks!
    const fullRequiredInventory = allDroppedRewards.filter((r) =>
      bossNode.requiredItems!.includes(r.id)
    )
    expect(canUnlockBoss(fullRequiredInventory, bossNode)).toBe(true)
  })

  it('defeats the Framerate Stutter Dragon boss using key items and combat turns', () => {
    const bossNode = campaign.nodes.find((n) => n.type === 'boss_lair')!
    const bossMonster = { ...bossNode.monster! }
    expect(bossMonster.id).toBe('gpu-lag-dragon')
    expect(bossMonster.maxHp).toBe(280)

    const allDroppedRewards = campaign.nodes
      .filter((n) => n.type !== 'boss_lair')
      .flatMap((n) => n.rewards || [])

    const shieldItem = allDroppedRewards.find((r) => r.id === 'batch-shield')!
    const bladeItem = allDroppedRewards.find((r) => r.id === 'atlas-blade')!

    expect(shieldItem).toBeDefined()
    expect(bladeItem).toBeDefined()

    // 1. Activate Shield of Batching (nullifies next incoming boss attack)
    const shieldActionResult = resolveBossItemAction('batch-shield', bossMonster, shieldItem)
    expect(shieldActionResult.shieldActive).toBe(true)
    expect(shieldActionResult.message).toContain('Shield of Batching')

    // 2. Strike with Blade of Texture Atlases
    let currentHp = bossMonster.maxHp
    const bladeActionResult = resolveBossItemAction('atlas-blade', bossMonster, bladeItem)
    expect(bladeActionResult.bossDamage).toBe(40)
    expect(bladeActionResult.message).toContain('Blade of Texture Atlases')
    currentHp -= bladeActionResult.bossDamage
    expect(currentHp).toBe(240)

    // 3. Repeated attacks with key items reduce boss HP to 0
    let turns = 0
    while (currentHp > 0 && turns < 10) {
      turns++
      const attack = resolveBossItemAction('atlas-blade', bossMonster, bladeItem)
      currentHp -= attack.bossDamage
    }

    expect(currentHp).toBeLessThanOrEqual(0)
    expect(turns).toBe(6) // 240 / 40 = 6 turns
  })
})
