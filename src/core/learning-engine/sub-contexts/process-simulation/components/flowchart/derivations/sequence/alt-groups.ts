import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewGroup } from '../../types';
import type { RawStep } from './types';

export interface AltGroupRegistry {
  /** Called for each relation as it is appended to the ordered sequence, with its seqIndex. */
  register(rel: FlowchartRelation, seqIdx: number): void;
  /** After all relations are registered, resolve Y bounds and mutate yOffset on relations. */
  resolve(
    orderedRelations: FlowchartRelation[],
    msgStartY: number,
    msgSpacing: number
  ): FlowchartViewGroup[];
}

interface BranchGroupDraft {
  id: string;
  title: string;
  /** Set of message labels that belong to this branch option */
  labelSet: Set<string>;
  /** Sequence indices of matching relations, filled during register() */
  matchingSeqIndices: number[];
}

/**
 * Builds an AltGroupRegistry from rawSteps (or graph fallback).
 * During BFS, call registry.register(rel, seqIdx) for each emitted relation.
 * After BFS, call registry.resolve() to get final seqGroups with Y/H set.
 */
export function buildAltGroupRegistry(
  schema: UnifiedFlowchartSchema,
  getCollapsedId: (id: string) => string
): AltGroupRegistry {
  const drafts: BranchGroupDraft[] = [];

  const rawSteps: RawStep[] = (schema as UnifiedFlowchartSchema & { rawSteps?: RawStep[] }).rawSteps ?? [];

  if (rawSteps.length > 0) {
    rawSteps.forEach(step => {
      if (step.type !== 'branch' || !step.branches) return;
      step.branches.forEach(b => {
        const polId = getCollapsedId(b.id || b.policy || 'branch');
        const title = b.label || b.policy || b.command || b.title || 'option';
        const labelSet = new Set<string>();
        if (b.command) labelSet.add(b.command);
        b.resultEvents?.forEach(evt => { if (evt.title) labelSet.add(evt.title); });

        if (labelSet.size > 0) {
          drafts.push({ id: `seq_group_${polId}`, title: `alt: ${title}`, labelSet, matchingSeqIndices: [] });
        }
      });
    });
  }
  // Note: graph-scan fallback omitted — rawSteps is the canonical source per AGENTS.md

  return {
    register(rel: FlowchartRelation, seqIdx: number) {
      if (!rel.label) return;
      for (const draft of drafts) {
        if (draft.labelSet.has(rel.label)) {
          draft.matchingSeqIndices.push(seqIdx);
        }
      }
    },

    resolve(
      orderedRelations: FlowchartRelation[],
      msgStartY: number,
      msgSpacing: number
    ): FlowchartViewGroup[] {
      // Collect valid drafts (those with at least one matched relation)
      const activeDrafts = drafts.filter(d => d.matchingSeqIndices.length > 0);

      // Sort by first occurrence
      activeDrafts.sort((a, b) => a.matchingSeqIndices[0] - b.matchingSeqIndices[0]);

      // Cumulative Y offset: each alt group adds 24px to everything from its first relation onwards
      const yOffsets = new Array<number>(orderedRelations.length).fill(0);
      activeDrafts.forEach(draft => {
        const startIdx = draft.matchingSeqIndices[0];
        for (let i = startIdx; i < orderedRelations.length; i++) {
          yOffsets[i] += 24;
        }
      });

      // Write yOffset onto relations
      orderedRelations.forEach((rel, idx) => {
        rel.yOffset = yOffsets[idx];
      });

      // Build seqGroups with computed Y and H
      return activeDrafts.map(draft => {
        const minIdx = Math.min(...draft.matchingSeqIndices);
        const maxIdx = Math.max(...draft.matchingSeqIndices);

        const minRelY = msgStartY + minIdx * msgSpacing + yOffsets[minIdx];
        const maxRelY = msgStartY + maxIdx * msgSpacing + yOffsets[maxIdx];

        // Collect participant IDs from matched relations
        const participantIds = new Set<string>();
        draft.matchingSeqIndices.forEach(i => {
          participantIds.add(orderedRelations[i].from);
          participantIds.add(orderedRelations[i].to);
        });

        return {
          id: draft.id,
          title: draft.title,
          nodeIds: Array.from(participantIds),
          y: minRelY - 40,
          h: (maxRelY - minRelY) + 56,
          seqIndexMin: minIdx,
          seqIndexMax: maxIdx,
          color: 'color-mix(in srgb, var(--ctp-mauve) 5%, transparent)',
          borderColor: 'var(--ctp-mauve)',
        };
      });
    },
  };
}
