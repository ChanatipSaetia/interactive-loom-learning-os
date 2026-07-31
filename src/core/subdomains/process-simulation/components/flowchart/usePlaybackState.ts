import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  FlowchartJourney,
  FlowchartStep,
  UnifiedFlowchartSchema
} from './types';

interface UsePlaybackStateOptions {
  schema: UnifiedFlowchartSchema;
}

interface UsePlaybackStateReturn {
  currentJourneyId: string;
  setCurrentJourneyId: (id: string) => void;
  currentJourney: FlowchartJourney | undefined;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isPlaying: boolean;
  activeNodeIds: string[] | null;
  highlightedNodeId: string | null;
  prevHighlightedNodeId: string | null;
  handlePlay: () => void;
  handlePause: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleReset: () => void;
  resetAll: () => void;
}

export function usePlaybackState({ schema }: UsePlaybackStateOptions): UsePlaybackStateReturn {
  const [currentJourneyId, setCurrentJourneyIdState] = useState(() => schema.journeys?.[0]?.id || '');
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTimerRef = useRef<number | null>(null);

  const currentJourney = useMemo(
    () => schema.journeys.find(j => j.id === currentJourneyId),
    [schema.journeys, currentJourneyId]
  );

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

  // Playback timer loop
  useEffect(() => {
    if (isPlaying && currentJourney && currentStep < currentJourney.steps.length - 1) {
      playTimerRef.current = window.setTimeout(() => {
        setCurrentStep(s => s + 1);
      }, 2500);
    } else if (isPlaying) {
      setIsPlaying(false);
    }
    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, currentStep, currentJourney]);

  const setCurrentJourneyId = useCallback((id: string) => {
    setCurrentJourneyIdState(id);
    setCurrentStep(-1);
    setIsPlaying(false);
  }, []);

  const currentStepData = currentJourney?.steps[currentStep] as FlowchartStep | undefined;
  const highlightedNodeId = currentStepData?.nodeIds?.[0] || null;
  const prevStepData = currentStep > 0 ? (currentJourney?.steps[currentStep - 1] as FlowchartStep | undefined) : undefined;
  const prevHighlightedNodeId = prevStepData?.nodeIds?.[0] || null;

  const activeNodeIds = useMemo(() => {
    if (currentStep < 0 || !currentStepData) return null;
    if (currentStepData.nodeIds.length === 0) return null;
    return currentStepData.nodeIds;
  }, [currentStep, currentStepData]);

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
    setCurrentStep,
    isPlaying,
    activeNodeIds,
    highlightedNodeId,
    prevHighlightedNodeId,
    handlePlay,
    handlePause,
    handleNext,
    handlePrev,
    handleReset,
    resetAll
  };
}
