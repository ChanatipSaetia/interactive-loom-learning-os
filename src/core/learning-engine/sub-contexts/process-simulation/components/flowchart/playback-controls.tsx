import { Play, Pause, SkipForward, SkipBack, RotateCcw, Square } from 'lucide-react';
import { Button } from '../../../../../ui-system/motion/button';
import type { FlowchartJourney } from './types';
import { useSound } from '../../../../../ui-system/sensory/SoundContext';

export interface PlaybackControlsProps {
  currentJourney: FlowchartJourney;
  currentStep: number;
  isPlaying: boolean;
  handlePlay: () => void;
  handlePause: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleReset: () => void;
}

/** Playback handlers wrapped with their sound cues, shared by the full and mini players. */
export function usePlaybackSoundHandlers({
  currentJourney,
  currentStep,
  isPlaying,
  handlePlay,
  handlePause,
  handleNext,
  handlePrev,
  handleReset
}: PlaybackControlsProps) {
  const { playSound } = useSound();

  const atEnd = currentStep >= currentJourney.steps.length - 1;

  const onPrevClick = () => {
    playSound('stepPrev');
    handlePrev();
  };

  const onNextClick = () => {
    if (currentStep >= currentJourney.steps.length - 2) {
      playSound('complete');
    } else {
      playSound('stepNext');
    }
    handleNext();
  };

  // One button for play, pause and replay (play at the last step starts over)
  const onToggleClick = () => {
    playSound('click');
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const onResetClick = () => {
    playSound('click');
    handleReset();
  };

  const toggleLabel = isPlaying ? 'Pause' : atEnd ? 'Replay' : 'Play';
  const ToggleIcon = isPlaying ? Pause : atEnd ? RotateCcw : Play;

  return { atEnd, toggleLabel, ToggleIcon, onPrevClick, onNextClick, onToggleClick, onResetClick };
}

export function PlaybackControls(props: PlaybackControlsProps) {
  const { currentJourney, currentStep } = props;
  const { atEnd, toggleLabel, ToggleIcon, onPrevClick, onNextClick, onToggleClick, onResetClick } = usePlaybackSoundHandlers(props);

  return (
    <div className="flowchart-playback animate-fade-in" data-testid="flowchart-playback">
      <Button
        size="icon"
        variant="ghost"
        className="flowchart-btn"
        disabled={currentStep <= 0}
        onClick={onPrevClick}
        data-testid="flowchart-btn-prev"
        aria-label="Previous"
        title="Previous (←)"
      >
        <SkipBack size={16} className="flowchart-btn-icon" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="flowchart-btn flowchart-btn-toggle"
        onClick={onToggleClick}
        data-testid="flowchart-btn-toggle"
        aria-label={toggleLabel}
        title={`${toggleLabel} (Space)`}
      >
        <ToggleIcon size={16} className="flowchart-btn-icon" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="flowchart-btn"
        disabled={atEnd}
        onClick={onNextClick}
        data-testid="flowchart-btn-next"
        aria-label="Next"
        title="Next (→)"
      >
        <SkipForward size={16} className="flowchart-btn-icon" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="flowchart-btn"
        disabled={currentStep < 0}
        onClick={onResetClick}
        data-testid="flowchart-btn-reset"
        aria-label="Stop"
        title="Stop and show the overview (Home)"
      >
        <Square size={14} className="flowchart-btn-icon" />
      </Button>
      <span className="flowchart-progress" data-testid="flowchart-progress" aria-live="polite">
        {currentStep === -1 ? 0 : currentStep + 1} / {currentJourney.steps.length}
      </span>
    </div>
  );
}
