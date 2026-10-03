import { SkipForward, SkipBack, ChevronUp, ArrowRight } from 'lucide-react';
import { Button } from '../../../../../ui-system/motion/button';
import { Dropdown } from '../../../../../ui-system/motion/dropdown';
import { usePlaybackSoundHandlers, type PlaybackControlsProps } from './playback-controls';
import type { FlowchartJourney } from './types';

/** Above this many steps the dots get too small to hit, so only the counter shows. */
const MAX_DOTS = 12;

interface MiniPlayerProps extends PlaybackControlsProps {
  onSelectStep: (stepIndex: number) => void;
  onExpand: () => void;
  /** Offered once the current journey has reached its last step. */
  nextJourney?: FlowchartJourney;
  onStartJourney?: (journeyId: string) => void;
  /** All journeys; with more than one the name becomes a picker. */
  journeys?: FlowchartJourney[];
  onSelectJourney?: (journeyId: string) => void;
}

/** Collapsed journey dock: journey name, prev / play-pause / next, progress dots and an expand toggle. */
export function MiniPlayer(props: MiniPlayerProps) {
  const { currentJourney, currentStep, onSelectStep, onExpand, nextJourney, onStartJourney, journeys = [], onSelectJourney } = props;
  const { atEnd, toggleLabel, ToggleIcon, onPrevClick, onNextClick, onToggleClick } = usePlaybackSoundHandlers(props);

  const stepCount = currentJourney.steps.length;
  const showDots = stepCount <= MAX_DOTS;
  const showNextJourney = atEnd && !props.isPlaying && nextJourney && onStartJourney;

  return (
    <div className="flowchart-mini-player" data-testid="flowchart-mini-player">
      {journeys.length > 1 && onSelectJourney ? (
        <div className="flowchart-mini-journey-picker" title={currentJourney.description}>
          <Dropdown
            value={currentJourney.id}
            onChange={onSelectJourney}
            options={journeys.map(j => ({ value: j.id, label: j.label }))}
            data-testid="flowchart-mini-journey-select"
            triggerTestId="flowchart-mini-journey-trigger"
            native={true}
            className="flowchart-journey-dropdown"
            triggerClassName="flowchart-journey-select"
            optionsClassName="flowchart-journey-options"
            optionClassName="flowchart-journey-option"
            optionActiveClassName="flowchart-journey-option-active"
          />
        </div>
      ) : (
        // Single journey: the name opens the full panel with the step cards
        <button
          type="button"
          className="flowchart-mini-journey"
          onClick={onExpand}
          data-testid="flowchart-mini-journey"
          title={currentJourney.description ? `${currentJourney.label}: ${currentJourney.description}` : currentJourney.label}
        >
          {currentJourney.label}
        </button>
      )}
      <span className="flowchart-mini-divider" aria-hidden="true" />
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
        <ToggleIcon size={16} />
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
            // Forks get a diamond dot so they stand out before you reach them
            const forkNote = step.branch ? ` (fork: ${step.branch.label})` : '';
            return (
              <button
                key={idx}
                type="button"
                className="flowchart-mini-dot"
                data-state={state}
                data-branch={step.branch ? 'true' : undefined}
                data-testid={`flowchart-mini-dot-${idx}`}
                onClick={() => onSelectStep(idx)}
                aria-label={`Step ${idx + 1}: ${step.title}${forkNote}`}
                aria-current={state === 'current' ? 'step' : undefined}
                title={`${idx + 1}. ${step.title}${forkNote}`}
              />
            );
          })}
        </div>
      )}

      {showNextJourney && (
        <Button
          size="icon"
          variant="ghost"
          className="flowchart-btn flowchart-mini-next-journey"
          onClick={() => onStartJourney(nextJourney.id)}
          data-testid="flowchart-mini-next-journey"
          aria-label={`Next journey: ${nextJourney.label}`}
          title={`Next journey: ${nextJourney.label}`}
        >
          <ArrowRight size={16} />
        </Button>
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
