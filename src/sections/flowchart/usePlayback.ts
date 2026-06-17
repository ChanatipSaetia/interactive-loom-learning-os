import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { animate } from 'animejs';
import type {
  FlowchartJourney,
  UnifiedFlowchartSchema
} from './types';

interface UsePlaybackOptions {
  schema: UnifiedFlowchartSchema;
  activeViewKey: string;
  nodeMap: Record<string, { x: number; y: number }>;
  onNodeFocus: (nodeIds: string[]) => void;
}

interface UsePlaybackReturn {
  currentJourneyId: string;
  setCurrentJourneyId: (id: string) => void;
  currentJourney: FlowchartJourney | undefined;
  currentStep: number;
  isPlaying: boolean;
  activeNodeIds: string[] | null;
  highlightedNodeId: string | null;
  prevHighlightedNodeId: string | null;
  particleRef: React.MutableRefObject<SVGCircleElement | null>;
  handlePlay: () => void;
  handlePause: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleReset: () => void;
  resetAll: () => void;
}

export function usePlayback({ schema, activeViewKey, nodeMap, onNodeFocus }: UsePlaybackOptions): UsePlaybackReturn {
  const [currentJourneyId, setCurrentJourneyIdState] = useState('');
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTimerRef = useRef<number | null>(null);
  const particleRef = useRef<SVGCircleElement | null>(null);
  const animeInstanceRef = useRef<ReturnType<typeof animate> | null>(null);

  const onNodeFocusRef = useRef(onNodeFocus);
  useEffectSyncRef(onNodeFocus, onNodeFocusRef);

  // Initialize default journey when schema changes
  useEffect(() => {
    if (schema.journeys.length > 0) {
      setCurrentJourneyIdState(schema.journeys[0].id);
    } else {
      setCurrentJourneyIdState('');
    }
    setCurrentStep(-1);
    setIsPlaying(false);
  }, [schema]);

  const currentJourney = schema.journeys.find(j => j.id === currentJourneyId);

  const setCurrentJourneyId = useCallback((id: string) => {
    setCurrentJourneyIdState(id);
    setCurrentStep(-1);
    setIsPlaying(false);
  }, []);

  const currentStepData = currentJourney?.steps[currentStep];
  const highlightedNodeId = currentStepData?.nodeId || currentStepData?.nodeIds?.[0] || null;
  const prevStepData = currentStep > 0 ? currentJourney?.steps[currentStep - 1] : undefined;
  const prevHighlightedNodeId = prevStepData?.nodeId || prevStepData?.nodeIds?.[0] || null;

  // Active node IDs for highlighting
  const activeNodeIds = useMemo(() => {
    if (currentStep < 0 || !currentStepData) return null;
    const ids = currentStepData.nodeIds || (currentStepData.nodeId ? [currentStepData.nodeId] : []);
    if (ids.length === 0) return null;
    return ids;
  }, [currentStep, currentStepData]);

  // Playback timer loop
  useEffect(() => {
    if (isPlaying && currentJourney && currentStep < currentJourney.steps.length - 1) {
      playTimerRef.current = window.setTimeout(() => {
        setCurrentStep(s => s + 1);
      }, 2500);
    } else {
      setIsPlaying(false);
    }
    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, currentStep, currentJourney]);

  // Camera focus on step change
  useEffect(() => {
    if (activeNodeIds && activeNodeIds.length > 0) {
      onNodeFocusRef.current(activeNodeIds);
    }
  }, [currentStep, activeNodeIds]);

  // Particle animation between nodes
  useEffect(() => {
    if (currentStep === 0 || !prevHighlightedNodeId || !highlightedNodeId) return;
    const fromNode = nodeMap[prevHighlightedNodeId];
    const toNode = nodeMap[highlightedNodeId];
    if (!fromNode || !toNode) return;

    const hasRelation = schema.relations.some(
      r => r.views?.includes(activeViewKey) &&
      ((r.from === prevHighlightedNodeId && r.to === highlightedNodeId) ||
        (r.to === prevHighlightedNodeId && r.from === highlightedNodeId))
    );
    if (!hasRelation) return;

    if (animeInstanceRef.current) animeInstanceRef.current.pause();

    const startX = fromNode.x;
    const startY = fromNode.y;
    const endX = toNode.x;
    const endY = toNode.y;

    if (particleRef.current) {
      particleRef.current.setAttribute('cx', String(startX));
      particleRef.current.setAttribute('cy', String(startY));
      particleRef.current.setAttribute('opacity', '1');
      animeInstanceRef.current = animate(particleRef.current, {
        cx: [startX, endX],
        cy: [startY, endY],
        duration: 800,
        easing: 'easeInOutQuad',
        onComplete: () => {
          if (particleRef.current) particleRef.current.setAttribute('opacity', '0');
        }
      });
    }
  }, [currentStep, prevHighlightedNodeId, highlightedNodeId, activeViewKey, nodeMap, schema.relations]);

  // Stepper handlers
  const handlePlay = useCallback(() => {
    if (currentJourney) {
      setIsPlaying(true);
      if (currentStep === -1) {
        setCurrentStep(0);
      }
    }
  }, [currentJourney, currentStep]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleNext = useCallback(() => {
    if (currentJourney && currentStep < currentJourney.steps.length - 1) {
      setCurrentStep(s => s + 1);
    }
  }, [currentJourney, currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > -1) {
      setCurrentStep(s => s - 1);
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setCurrentStep(-1);
    setIsPlaying(false);
  }, []);

  const resetAll = useCallback(() => {
    setCurrentStep(-1);
    setIsPlaying(false);
  }, []);

  return {
    currentJourneyId,
    setCurrentJourneyId,
    currentJourney,
    currentStep,
    isPlaying,
    activeNodeIds,
    highlightedNodeId,
    prevHighlightedNodeId,
    particleRef,
    handlePlay,
    handlePause,
    handleNext,
    handlePrev,
    handleReset,
    resetAll
  };
}

function useEffectSyncRef<T>(value: T, ref: React.MutableRefObject<T>) {
  ref.current = value;
}
