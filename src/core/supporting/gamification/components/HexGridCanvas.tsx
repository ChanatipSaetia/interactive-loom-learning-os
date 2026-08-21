import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Castle, Landmark, Swords, Sparkles, Hammer, Flame, CloudFog, Plus, Minus, RotateCcw, Move } from 'lucide-react'
import { HexNodeData } from '../types'
import { computeHexGridCoordinates, getAutoFlowConnections, isKeyItemLocationRevealed } from '../layout'

interface HexGridCanvasProps {
  nodes: HexNodeData[]
  selectedNodeId: string | null
  onSelectNode: (node: HexNodeData) => void
}

const HEX_RADIUS = 40
const HEX_GAP_SCALE = 1.32 // Increased spacing factor for clear gaps between hex tiles

// Convert axial coordinates (q, r) to canvas (x, y) offset from center (440, 290)
function axialToPixel(q: number, r: number, originX = 440, originY = 290) {
  const x = originX + HEX_RADIUS * 1.5 * HEX_GAP_SCALE * q
  const y = originY + HEX_RADIUS * Math.sqrt(3) * HEX_GAP_SCALE * (r + q / 2)
  return { x, y }
}

// Generate SVG polygon points for a flat-topped hexagon
function getHexPolygonPoints(cx: number, cy: number, radius: number): string {
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i)
    const x = cx + radius * Math.cos(angleRad)
    const y = cy + radius * Math.sin(angleRad)
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return points.join(' ')
}

export const HexGridCanvas: React.FC<HexGridCanvasProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
}) => {
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  // Pan and Zoom state
  const [zoom, setZoom] = useState<number>(1.0)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const touchDistRef = useRef<number | null>(null)

  // Dynamically compute axial coordinates for nodes based on 4.2 Node Type Hierarchy
  const computedCoordsMap = useMemo(() => {
    return computeHexGridCoordinates(nodes)
  }, [nodes])

  // Automatically compute 4.2 flow connections between hexes
  const autoConnections = useMemo(() => {
    return getAutoFlowConnections(nodes)
  }, [nodes])

  const getNodeCoord = (node: HexNodeData) => {
    return computedCoordsMap.get(node.id) || node.coordinates || { q: 0, r: 0 }
  }

  // Smooth center camera on selected node
  const centerOnNode = (node: HexNodeData) => {
    const coord = getNodeCoord(node)
    const { x, y } = axialToPixel(coord.q, coord.r)
    // Target offset to center (x, y) at canvas center (440, 290)
    const targetPanX = (440 - x) * zoom
    const targetPanY = (290 - y) * zoom
    setPan({ x: targetPanX, y: targetPanY })
  }

  const handleNodeClick = (node: HexNodeData, e: React.MouseEvent) => {
    e.stopPropagation()
    centerOnNode(node)
    onSelectNode(node)
  }

  const isCapitalCleared = useMemo(
    () => nodes.find((n) => n.type === 'capital')?.status === 'cleared',
    [nodes]
  )

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(2.0, +(prev + 0.15).toFixed(2)))
  const handleZoomOut = () => setZoom((prev) => Math.max(0.05, +(prev - 0.15).toFixed(2)))
  const handleResetPanZoom = () => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
  }

  const containerRef = useRef<HTMLDivElement>(null)

  // Native non-passive wheel listener to strictly prevent page scroll during canvas zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Scale wheel deltaY with max limit of 2.0 (200%) and min limit of 0.05
      const zoomStep = -e.deltaY * 0.0015
      setZoom((prev) => Math.min(2.0, Math.max(0.05, +(prev + zoomStep).toFixed(3))))
    }

    el.addEventListener('wheel', handleNativeWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleNativeWheel)
    }
  }, [])

  // Pointer drag panning (Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Initiate pan drag on background canvas or svg element
    const targetTag = (e.target as HTMLElement).tagName.toLowerCase()
    if (targetTag === 'svg' || targetTag === 'div' || targetTag === 'rect') {
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    })
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  // Mobile Pinch-to-Zoom Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      touchDistRef.current = Math.hypot(dx, dy)
    } else if (e.touches.length === 1) {
      setIsDragging(true)
      dragStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const factor = dist / touchDistRef.current
      setZoom((prev) => Math.min(2.0, Math.max(0.05, +(prev * factor).toFixed(3))))
      touchDistRef.current = dist
    } else if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    touchDistRef.current = null
  }

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      data-lenis-prevent-wheel
      data-lenis-prevent-touch
      className={`relative w-full h-[580px] bg-[#232634] rounded-2xl border border-[#414559] overflow-hidden shadow-2xl flex items-center justify-center select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#8caaee_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* SVG Canvas for Hexes & Map Render */}
      <svg className="w-full h-full relative z-10" viewBox="0 0 880 560">
        <defs>
          {/* Neon Glow Filters */}
          <filter id="glow-cleared" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-selected" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <linearGradient id="grad-capital" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8caaee" />
            <stop offset="100%" stopColor="#303446" />
          </linearGradient>
          <linearGradient id="grad-sanctuary" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a6d189" />
            <stop offset="100%" stopColor="#232634" />
          </linearGradient>
          <linearGradient id="grad-quiz" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e78284" />
            <stop offset="100%" stopColor="#303446" />
          </linearGradient>
          <linearGradient id="grad-reflection" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ca9ee6" />
            <stop offset="100%" stopColor="#232634" />
          </linearGradient>
          <linearGradient id="grad-workshop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e5c890" />
            <stop offset="100%" stopColor="#303446" />
          </linearGradient>

          {/* Menacing Crimson Gradient for Boss Lair */}
          <linearGradient id="grad-boss" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ea999c" />
            <stop offset="100%" stopColor="#e78284" />
          </linearGradient>

          {/* Fog of War Radial Dark Shroud */}
          <radialGradient id="grad-fog" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#414559" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#181825" stopOpacity="0.98" />
          </radialGradient>

          {/* Menacing Crimson Gradient for Locked Boss Lair */}
          <linearGradient id="grad-boss-locked" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e78284" />
            <stop offset="100%" stopColor="#303446" />
          </linearGradient>

          {/* Solid Grayed-Out Gradient for Locked Standard Hexes */}
          <linearGradient id="grad-locked" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#414559" />
            <stop offset="100%" stopColor="#232634" />
          </linearGradient>
        </defs>

        {/* Pan and Zoom Group Container */}
        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{ transformOrigin: '440px 290px' }}
        >
          {/* Draw Hexagon Nodes */}
          {nodes.map((node) => {
            const nodeCoord = getNodeCoord(node)
            const { x, y } = axialToPixel(nodeCoord.q, nodeCoord.r)
            const isSelected = selectedNodeId === node.id
            const isCleared = node.status === 'cleared'
            const isLocked = node.status === 'locked'
            const isBoss = node.type === 'boss_lair'
            const isThreatened = node.status === 'threatened'
            const hasItemReward = isKeyItemLocationRevealed(nodes, node)

            // Check if this node is a prerequisite parent to the selected node in 4.2 flow (Boss does not show prerequisite nodes)
            const isPrereqParent =
              selectedNode?.type !== 'boss_lair' &&
              autoConnections.some((c) => c.toId === selectedNode?.id && c.fromId === node.id)
            const isConnectedDependency = isPrereqParent

            let fillGrad = 'url(#grad-capital)'
            let strokeColor = '#8caaee'

            if (node.type === 'reading_sanctuary') {
              fillGrad = 'url(#grad-sanctuary)'
              strokeColor = '#a6d189'
            } else if (node.type === 'quiz_encounter') {
              fillGrad = 'url(#grad-quiz)'
              strokeColor = '#e78284'
            } else if (node.type === 'reflection_decryption') {
              fillGrad = 'url(#grad-reflection)'
              strokeColor = '#ca9ee6'
            } else if (node.type === 'tradeoff_workshop') {
              fillGrad = 'url(#grad-workshop)'
              strokeColor = '#e5c890'
            } else if (node.type === 'boss_lair') {
              fillGrad = 'url(#grad-boss)'
              strokeColor = '#ea999c'
            }

            // Locked styling (Grayed out solid look except Boss which remains menacingly visible)
            if (isLocked && !isBoss) {
              fillGrad = 'url(#grad-locked)'
              strokeColor = '#51576d'
            } else if (isLocked && isBoss) {
              fillGrad = 'url(#grad-boss-locked)'
              strokeColor = '#e78284'
            }

            if (isSelected) strokeColor = '#ef9f76'
            else if (isConnectedDependency) strokeColor = '#ca9ee6'

            return (
              <g
                key={node.id}
                onClick={(e) => handleNodeClick(node, e)}
                className="cursor-pointer transition-all duration-300 group"
              >
                {/* Outer Border Glow Ring for Selected / Connected Prerequisite Parent Nodes */}
                {(isSelected || isConnectedDependency) && (
                  <polygon
                    points={getHexPolygonPoints(x, y, HEX_RADIUS + 5)}
                    fill="none"
                    stroke={isSelected ? '#ef9f76' : '#ca9ee6'}
                    strokeWidth={isSelected ? '3.5' : '2.5'}
                    strokeDasharray={isConnectedDependency && !isSelected ? '4,4' : undefined}
                    filter="url(#glow-selected)"
                    className={isConnectedDependency ? 'animate-pulse' : ''}
                  />
                )}

                {/* Base Flat-Topped Hexagon Tile */}
                <polygon
                  points={getHexPolygonPoints(x, y, HEX_RADIUS)}
                  fill={fillGrad}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? '3' : '2'}
                  filter={isCleared ? 'url(#glow-cleared)' : undefined}
                  className="transition-all duration-300 group-hover:stroke-[#ef9f76]"
                />

                {/* Inner Hex Polygon Highlight Ring */}
                <polygon
                  points={getHexPolygonPoints(x, y, HEX_RADIUS - 6)}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="0.8"
                  opacity="0.4"
                />

                {/* Fog of War Shroud for Locked Challenges & Workshops (Except Boss Lair) */}
                {isLocked && !isBoss && (
                  <g className="pointer-events-none select-none">
                    <polygon
                      points={getHexPolygonPoints(x, y, HEX_RADIUS)}
                      fill="url(#grad-fog)"
                      opacity="0.85"
                    />
                    <g transform={`translate(${x - 12}, ${y - 12})`}>
                      <CloudFog size={24} color="#a5adce" strokeWidth={2.2} className="animate-pulse" />
                    </g>
                  </g>
                )}

                {/* Hex Center Node Type SVG Icon (Always Visible for Boss, or when Unlocked/Cleared) */}
                {(!isLocked || isBoss) && (
                  <g
                    transform={`translate(${x - (isBoss ? 14 : 12)}, ${
                      y - (isBoss ? 14 : 12) - (hasItemReward || isThreatened ? 6 : 0)
                    })`}
                    className="pointer-events-none select-none"
                  >
                    {node.type === 'capital' && (
                      <Castle size={24} color={isSelected ? '#ef9f76' : '#8caaee'} strokeWidth={2.2} />
                    )}
                    {node.type === 'reading_sanctuary' && (
                      <Landmark size={24} color={isSelected ? '#ef9f76' : '#a6d189'} strokeWidth={2.2} />
                    )}
                    {node.type === 'quiz_encounter' && (
                      <Swords size={24} color={isSelected ? '#ef9f76' : '#e78284'} strokeWidth={2.2} />
                    )}
                    {node.type === 'reflection_decryption' && (
                      <Sparkles size={24} color={isSelected ? '#ef9f76' : '#ca9ee6'} strokeWidth={2.2} />
                    )}
                    {node.type === 'tradeoff_workshop' && (
                      <Hammer size={24} color={isSelected ? '#ef9f76' : '#e5c890'} strokeWidth={2.2} />
                    )}
                    {node.type === 'boss_lair' && (
                      <Flame size={28} color={isSelected ? '#ef9f76' : '#ea999c'} strokeWidth={2.5} />
                    )}
                  </g>
                )}

                {/* Key Item Location Beacon (Revealed after finishing the main Capital city) */}
                {isCapitalCleared && node.rewards && node.rewards.length > 0 && (
                  <g transform={`translate(${x - 14}, ${y + 14})`} className="pointer-events-none select-none">
                    <rect
                      width="28"
                      height="18"
                      rx="9"
                      fill="#1e1e2e"
                      stroke="#e5c890"
                      strokeWidth="1.5"
                      filter="url(#glow-selected)"
                    />
                    <text
                      x="14"
                      y="12.5"
                      textAnchor="middle"
                      fontSize="11"
                      fill="#e5c890"
                      fontWeight="bold"
                    >
                      {node.rewards[0].icon}
                    </text>
                  </g>
                )}

                {/* Threatened Chaos Warning Icon Indicator */}
                {isThreatened && !hasItemReward && (
                  <text
                    x={x + 16}
                    y={y - 16}
                    fontSize="14"
                    className="animate-bounce pointer-events-none select-none"
                  >
                    ⚠️
                  </text>
                )}

                {/* Cleared Checkmark Badge */}
                {isCleared && (
                  <text
                    x={x + 18}
                    y={y - 18}
                    fontSize="13"
                    className="pointer-events-none select-none font-bold text-[#a6d189]"
                  >
                    ✓
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Mobile-Friendly Zoom & Pan Controls Overlay */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-[#303446]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#414559] shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-8 h-8 rounded-lg bg-[#232634] hover:bg-[#414559] active:scale-95 text-[#c6d0f5] flex items-center justify-center transition-all border border-[#51576d]"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-8 h-8 rounded-lg bg-[#232634] hover:bg-[#414559] active:scale-95 text-[#c6d0f5] flex items-center justify-center transition-all border border-[#51576d]"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={handleResetPanZoom}
          title="Reset Pan & Zoom"
          className="px-2.5 h-8 rounded-lg bg-[#232634] hover:bg-[#414559] active:scale-95 text-[#8caaee] font-mono text-xs font-semibold flex items-center gap-1 transition-all border border-[#51576d]"
        >
          <RotateCcw size={13} />
          <span>{Math.round(zoom * 100)}%</span>
        </button>
      </div>

      {/* Map Pan Drag Hint */}
      <div className="absolute top-3 left-3 z-20 hidden sm:flex items-center gap-1.5 bg-[#303446]/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[#414559] text-[11px] text-[#a5adce] pointer-events-none">
        <Move size={12} className="text-[#8caaee]" />
        <span>Drag canvas to pan • Pinch / Wheel to zoom</span>
      </div>

      {/* Map Control Overlay Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-[#303446]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-[#414559] flex items-center gap-3 text-xs text-[#c6d0f5] max-w-[92vw] overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[#8caaee]" /> Capital</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[#a6d189]" /> Sanctuary</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[#e78284]" /> Monster</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[#ca9ee6]" /> Reflection</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[#e5c890]" /> Workshop</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-[#ea999c]" /> Boss</div>
        <div className="flex items-center gap-1 shrink-0 border-l border-[#51576d] pl-3"><span className="w-2.5 h-2.5 rounded-full bg-[#51576d]" /> Locked (Grayed)</div>
      </div>
    </div>
  )
}
