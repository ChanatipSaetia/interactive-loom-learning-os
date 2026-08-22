import { Container, Graphics } from 'pixi.js'
import type { MutableRefObject } from 'react'
import { HexGridCoordinate } from '../types'
import { GamificationThemePalette } from '../theme-palette'
import { HEX_RADIUS, axialToPixel } from './hex-geometry'
import { drawWarrior } from './warrior-renderer'

export interface WalkTransitionOptions {
  mapContainer: Container | null
  coord: HexGridCoordinate
  palette: GamificationThemePalette
  isTransitioningRef: MutableRefObject<boolean>
  onComplete?: () => void
}

// Trigger human walking animation into hex from the left before opening encounter modal
export function triggerWalkTransition({
  mapContainer,
  coord,
  palette,
  isTransitioningRef,
  onComplete,
}: WalkTransitionOptions) {
  if (!mapContainer) {
    onComplete?.()
    return
  }

  if (isTransitioningRef.current) return
  isTransitioningRef.current = true

  const targetPos = axialToPixel(coord.q, coord.r, 0, 0)

  // Start 90px to the left of the hex node
  const startX = targetPos.x - 90
  const startY = targetPos.y

  // Container for human hero sprite
  const humanContainer = new Container()
  humanContainer.position.set(startX, startY)
  humanContainer.zIndex = 999

  // Ground dust particle effect container
  const dustContainer = new Container()
  humanContainer.addChild(dustContainer)

  // Body container for procedural stick-figure / RPG human explorer
  const humanGfx = new Graphics()
  humanContainer.addChild(humanGfx)

  // Walking indicator aura glow ring
  const arrivalAura = new Graphics()
  arrivalAura.circle(0, 0, HEX_RADIUS - 4).stroke({ width: 2, color: palette.blueNum, alpha: 0 })
  humanContainer.addChild(arrivalAura)

  mapContainer.addChild(humanContainer)

  const startTime = performance.now()
  const duration = 750 // 750ms walk duration

  // Draw procedural animated walking human frame
  const drawHuman = (_walkProgress: number, walkCycle: number) => {
    if (!humanGfx || humanGfx.destroyed) return
    const bob = Math.abs(Math.sin(walkCycle * 2)) * 2.5
    drawWarrior(humanGfx, {
      walkCycle,
      bob,
      cloakPhase: walkCycle,
      palette,
    })
  }

  const animateWalk = (currentTime: number) => {
    if (!mapContainer || mapContainer.destroyed || humanGfx.destroyed || humanContainer.destroyed) return
    const elapsed = currentTime - startTime
    const progress = Math.min(1, elapsed / duration)

    // Linear translation with slight ease-out at the end
    const easeProgress = 1 - Math.pow(1 - progress, 1.6)
    const currentX = startX + (targetPos.x - startX) * easeProgress
    const currentY = startY + (targetPos.y - startY) * easeProgress

    humanContainer.position.set(currentX, currentY)

    // Frequency of walk cycles
    const walkCycle = progress * Math.PI * 8
    drawHuman(progress, walkCycle)

    // Spawn subtle ground footsteps / dust puffs
    if (Math.sin(walkCycle) > 0.8 && Math.random() > 0.4) {
      const puff = new Graphics()
      puff.circle(0, 15, 2.5).fill({ color: 0x737994, alpha: 0.6 })
      dustContainer.addChild(puff)
      setTimeout(() => {
        if (!dustContainer.destroyed && dustContainer.children.includes(puff)) {
          dustContainer.removeChild(puff)
          puff.destroy()
        }
      }, 180)
    }

    // Arrival burst glow upon reaching center
    if (progress > 0.75) {
      const arrivalRatio = (progress - 0.75) / 0.25
      arrivalAura.alpha = Math.sin(arrivalRatio * Math.PI) * 0.9
      arrivalAura.scale.set(0.6 + arrivalRatio * 0.5)
    }

    if (progress < 1) {
      requestAnimationFrame(animateWalk)
    } else {
      // Complete walk into the center of the hex
      if (!mapContainer.destroyed) {
        mapContainer.removeChild(humanContainer)
      }
      humanContainer.destroy({ children: true })
      isTransitioningRef.current = false
      onComplete?.()
    }
  }

  requestAnimationFrame(animateWalk)
}
