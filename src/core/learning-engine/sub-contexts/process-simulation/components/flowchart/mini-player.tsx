import { Play, Pause, SkipForward, SkipBack, RotateCcw, ChevronUp } from 'lucide-react';
import { Button } from '../../../../../ui-system/motion/button';
import { usePlaybackSoundHandlers, type PlaybackControlsProps } from './playback-controls';

/** Above this many steps the dots get too small to hit, so only the counter shows. */
const MAX_DOTS = 12;

interface MiniPlayerProps extends PlaybackControlsProps {
  onSelectStep: (stepIndex: number) => void;
  onExpand: () => void;
}

/** Collapsed journey dock: prev / play-pause / next, progress dots and an expand toggle. */
export function MiniPlayer(props: MiniPlayerProps) {
  const { currentJourney, currentStep, isPlaying, onSelectStep, onExpand } = props;
  const { onPrevClick, onNextClick, onPlayClick, onPauseClick } = usePlaybackSoundHandlers(props);

  const stepCount = currentJourney.steps.length;
  const atEnd = currentStep >= stepCount - 1;
  const showDots = stepCount <= MAX_DOTS;

  const onToggleClick = () => {
    if (isPlaying) {
      onPauseClick();
    } else if (atEnd) {
      // Replay: rewind to the first step, then keep playing from there
      onSelectStep(0);
      onPlayClick();
    } else {
      onPlayClick();
    }
  };

  const toggleLabel = isPlaying ? 'Pause' : atEnd ? 'Replay' : 'Play';

  return (
    <div className="flowchart-mini-player" data-testid="flowchart-mini-player">
      <Button
        size="icon"
        variant="ghost"
        className="flowchart-btn"
        disabled={currentStep <= 0}
        onClick={onPrevClick}
        data-testid="flowchart-mini-prev"
        aria-label="Previous"
        title="Previous"
      >
        <SkipBack size={16} className="flowchart-btn-icon" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="flowchart-btn flowchart-mini-toggle"
        onClick={onToggleClick}
        data-testid="flowchart-mini-toggle"
        aria-label={toggleLabel}
        title={toggleLabel}
      >
        {isPlaying ? <Pause size={16} /> : atEnd ? <RotateCcw size={16} /> : <Play size={16} />}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="flowchart-btn"
        disabled={atEnd}
        onClick={onNextClick}
        data-testid="flowchart-mini-next"
        aria-label="Next"
        title="Next"
      >
        <SkipForward size={16} className="flowchart-btn-icon" />
      </Button>

      <span className="flowchart-progress" data-testid="flowchart-mini-progress" aria-live="polite">
        {currentStep === -1 ? 0 : currentStep + 1} / {stepCount}
      </span>

      {showDots && (
        <div className="flowchart-mini-dots" role="group" aria-label="Steps">
          {currentJourney.steps.map((step, idx) => {
            const state = idx === currentStep ? 'current' : idx < currentStep ? 'done' : 'todo';
            return (
              <button
                key={idx}
                type="button"
                className="flowchart-mini-dot"
                data-state={state}
                data-testid={`flowchart-mini-dot-${idx}`}
                onClick={() => onSelectStep(idx)}
                aria-label={`Step ${idx + 1}: ${step.title}`}
                aria-current={state === 'current' ? 'step' : undefined}
                title={`${idx + 1}. ${step.title}`}
              />
            );
          })}
        </div>
      )}

      <span className="flowchart-mini-divider" aria-hidden="true" />
      <Button
        size="icon"
        variant="ghost"
        className="flowchart-btn"
        onClick={onExpand}
        data-testid="flowchart-dock-expand"
        aria-label="Expand journey panel"
        title="Expand journey panel"
        aria-expanded={false}
      >
        <ChevronUp size={16} />
      </Button>
    </div>
  );
}
