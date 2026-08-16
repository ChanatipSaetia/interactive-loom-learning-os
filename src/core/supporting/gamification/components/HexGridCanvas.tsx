import React, { useMemo } from 'react'
import { Castle, Landmark, Swords, Sparkles, Hammer, Flame, CloudFog } from 'lucide-react'
import { HexNodeData } from '../types'
import { computeHexGridCoordinates, getAutoFlowConnections } from '../layout'

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

  // Dynamically compute axial coordinates for nodes based on 4.2 Node Type Hierarchy
  const computedCoordsMap = useMemo(() => {
    return computeHexGridCoordinates(nodes)
  }, [nodes])

  // Automatically compute 4.2 flow connections between hexes
  const autoConnections = useMemo(() => {
    return getAutoFlowConnections(nodes)
  }, [nodes])

  const getNodeCoord = (node: HexNodeData) => {
    return node.coordinates || computedCoordsMap.get(node.id) || { q: 0, r: 0 }
  }

  return (
    <div className="relative w-full h-[580px] bg-[#232634] rounded-2xl border border-[#414559] overflow-hidden shadow-2xl flex items-center justify-center select-none">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#8caaee_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* SVG Canvas for Connections and Hexes */}
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
            <stop offset="100%" stopColor="#303446" />
          </linearGradient>
          <linearGradient id="grad-tradeoff" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e5c890" />
            <stop offset="100%" stopColor="#303446" />
          </linearGradient>
          <linearGradient id="grad-boss" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ea999c" />
            <stop offset="100%" stopColor="#e78284" />
          </linearGradient>

          {/* Fog of War Shroud Gradient for Locked Hexes */}
          <linearGradient id="grad-fog" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#414559" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#51576d" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#232634" stopOpacity="0.95" />
          </linearGradient>

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

        {/* Draw Hexagon Nodes */}
        {nodes.map((node) => {
          const nodeCoord = getNodeCoord(node)
          const { x, y } = axialToPixel(nodeCoord.q, nodeCoord.r)
          const isSelected = selectedNodeId === node.id
          const isCleared = node.status === 'cleared'
          const isLocked = node.status === 'locked'
          const isBoss = node.type === 'boss_lair'
          const isThreatened = node.status === 'threatened'
          const hasItemReward = node.rewards && node.rewards.length > 0 && !isLocked

          // Check if this node is a prerequisite parent to the selected node in 4.2 flow
          const isPrereqParent = autoConnections.some(
            (c) => c.toId === selectedNode?.id && c.fromId === node.id
          )
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
            fillGrad = 'url(#grad-tradeoff)'
            strokeColor = '#e5c890'
          } else if (isBoss) {
            fillGrad = 'url(#grad-boss)'
            strokeColor = '#ea999c'
          }

          if (isLocked && !isBoss) {
            fillGrad = 'url(#grad-locked)'
            strokeColor = '#51576d'
          } else if (isLocked && isBoss) {
            fillGrad = 'url(#grad-boss-locked)'
            strokeColor = '#e78284'
          }

          return (
            <g
              key={node.id}
              onClick={() => onSelectNode(node)}
              style={{
                transformOrigin: `${x}px ${y}px`,
              }}
              className={`cursor-pointer transition-transform duration-200 ${
                isSelected ? 'scale-110' : isConnectedDependency ? 'scale-105' : 'scale-100'
              }`}
            >
              {/* Outer Selection / Glow Ring */}
              {isSelected && (
                <polygon
                  points={getHexPolygonPoints(x, y, HEX_RADIUS + 6)}
                  fill="none"
                  stroke="#ef9f76"
                  strokeWidth="3"
                  filter="url(#glow-selected)"
                  className="animate-pulse"
                />
              )}

              {/* Connected Dependency Node Blinking Outer Ring */}
              {isConnectedDependency && !isSelected && (
                <polygon
                  points={getHexPolygonPoints(x, y, HEX_RADIUS + 5)}
                  fill="none"
                  stroke="#e5c890"
                  strokeWidth="2.5"
                  filter="url(#glow-selected)"
                  className="animate-pulse"
                />
              )}

              {/* Cleared Neon Outer Ring Glow */}
              {isCleared && !isSelected && !isConnectedDependency && (
                <polygon
                  points={getHexPolygonPoints(x, y, HEX_RADIUS + 3)}
                  fill="none"
                  stroke="#a6d189"
                  strokeWidth="2"
                  filter="url(#glow-cleared)"
                  opacity="0.8"
                />
              )}

              {/* Main Flat-Topped Hex Tile Polygon */}
              <polygon
                points={getHexPolygonPoints(x, y, HEX_RADIUS)}
                fill={fillGrad}
                stroke={isSelected ? '#ef9f76' : isConnectedDependency ? '#e5c890' : strokeColor}
                strokeWidth={isSelected ? 3 : isConnectedDependency ? 2.5 : 2}
                className="transition-all duration-200"
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

              {/* Key Item Reward Mini Badge Indicator */}
              {hasItemReward && (
                <g transform={`translate(${x - 14}, ${y + 10})`}>
                  <rect
                    width="28"
                    height="14"
                    rx="7"
                    fill="#303446"
                    stroke="#8caaee"
                    strokeWidth="1"
                  />
                  <text
                    x="14"
                    y="10.5"
                    textAnchor="middle"
                    fontSize="9"
                    fill="#8caaee"
                    fontWeight="bold"
                  >
                    {node.rewards![0].icon}
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
      </svg>

      {/* Map Control Overlay Legend */}
      <div className="absolute bottom-3 left-3 bg-[#303446]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-[#414559] flex items-center gap-3 text-xs text-[#c6d0f5]">
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#8caaee]" /> Capital</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#a6d189]" /> Sanctuary</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#e78284]" /> Monster</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#ca9ee6]" /> Reflection</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#e5c890]" /> Workshop</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#ea999c]" /> Boss</div>
        <div className="flex items-center gap-1 border-l border-[#51576d] pl-3"><span className="w-2.5 h-2.5 rounded-full bg-[#51576d]" /> Locked (Grayed)</div>
      </div>
    </div>
  )
}
