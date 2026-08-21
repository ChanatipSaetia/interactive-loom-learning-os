export { GamificationCampaignView, GamificationCampaignView as GamificationDemoView } from './components/GamificationCampaignView'
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
  calculateSanctuaryTickHealing,
  synthesizeTradeoffArtifact,
  resolveTimedReflectionDecryption,
  resolveBossItemAction,
  resolveCombatTurn,
  calculateLevelProgress,
} from './game-rules'

export { useGamification } from './useGamification'

export type {
  HexCampaignSourcePort,
  CharacterStatePort,
  GamificationRuntimePort,
} from './ports'
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
