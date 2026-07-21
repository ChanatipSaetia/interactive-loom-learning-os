import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import { Button } from '../../components/motion/button';
import type { FlowchartJourney } from './types';

interface PlaybackControlsProps {
  currentJourney: FlowchartJourney;
  currentStep: number;
  isPlaying: boolean;
  handlePlay: () => void;
  handlePause: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleReset: () => void;
}

export function PlaybackControls({
  currentJourney,
  currentStep,
  isPlaying,
  handlePlay,
  handlePause,
  handleNext,
  handlePrev,
  handleReset
}: PlaybackControlsProps) {
  return (
    <div className="flowchart-playback animate-fade-in" data-testid="flowchart-playback">
      <Button
        size="icon"
        variant="ghost"
        className="flowchart-btn"
        disabled={currentStep <= 0}
        onClick={handlePrev}
        data-testid="flowchart-btn-prev"
        aria-label="Previous"
      >
        <SkipBack size={16} className="flowchart-btn-icon" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="flowchart-btn"
        disabled={isPlaying || currentStep >= currentJourney.steps.length - 1}
        onClick={handlePlay}
        data-testid="flowchart-btn-play"
        aria-label="Play"
      >
        <Play size={16} className="flowchart-btn-icon" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="flowchart-btn"
        disabled={!isPlaying}
        onClick={handlePause}
        data-testid="flowchart-btn-pause"
        aria-label="Pause"
      >
        <Pause size={16} className="flowchart-btn-icon" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="flowchart-btn"
        disabled={currentStep >= currentJourney.steps.length - 1}
        onClick={handleNext}
        data-testid="flowchart-btn-next"
        aria-label="Next"
      >
        <SkipForward size={16} className="flowchart-btn-icon" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="flowchart-btn"
        disabled={currentStep <= 0}
        onClick={handleReset}
        data-testid="flowchart-btn-reset"
        aria-label="Reset"
      >
        <RotateCcw size={16} className="flowchart-btn-icon" />
      </Button>
      <span className="flowchart-progress" data-testid="flowchart-progress">
        {currentStep === -1 ? 0 : currentStep + 1} / {currentJourney.steps.length}
      </span>
    </div>
  );
}
