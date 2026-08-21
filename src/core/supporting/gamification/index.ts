export { GamificationDemoView } from './components/GamificationDemoView'
export { HexGridCanvas } from './components/HexGridCanvas'
export {
  computeHexGridCoordinates,
  getAutoFlowConnections,
  isCapitalVisited,
  isKeyItemLocationRevealed,
  getRevealedKeyItemNodes,
} from './layout'
export {
  encryptToMagicRunes,
  canUnlockBoss,
  evaluateNodeUnlocks,
  calculateSanctuaryHealing,
  resolveCombatTurn,
  calculateLevelProgress,
} from './game-rules'
export type { CombatTurnResult, LevelProgressResult } from './game-rules'
export type {
  HexNodeType,
  HexGridCoordinate,
  ItemReward,
  MonsterData,
  HexNodeData,
  CharacterAttributes,
  GlobalCharacterState,
  TopicCampaignState,
} from './types'
