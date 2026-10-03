import { forwardRef, type CSSProperties } from 'react';
import { GitBranch, ArrowRight } from 'lucide-react';
import { useTypewriter } from '../../../../../ui-system/motion/use-typewriter';

export interface StepCaptionData {
  /** Changes per step; restarts the typing animation. */
  id: string;
  index: number;
  total: number;
  title: string;
  text: string;
  /** Set when this step takes one option of a fork. */
  branch?: {
    label: string;
    alternatives: Array<{ label: string; journeyId?: string; journeyLabel?: string; stepIndex?: number }>;
  };
}

interface StepCaptionProps {
  caption: StepCaptionData;
  style: CSSProperties;
  /** Under or beside the focused nodes, or pinned to the canvas top when there is nothing to anchor to. */
  placement: 'below' | 'right' | 'pinned';
  /** Jump to another journey at the step where it takes a different option. */
  onSwitchPath?: (journeyId: string, stepIndex: number) => void;
}

/**
 * Narration for the current journey step, floating next to the focused nodes.
 * The full text is laid out from the start (untyped characters are transparent)
 * so the box keeps its final size: the camera reserves room for it and nothing
 * jumps while it types.
 */
export const StepCaption = forwardRef<HTMLDivElement, StepCaptionProps>(function StepCaption(
  { caption, style, placement, onSwitchPath },
  ref
) {
  const { shown, done, skip } = useTypewriter(caption.text);

  return (
    <div
      ref={ref}
      className="flowchart-step-caption"
      data-placement={placement}
      data-typing={!done}
      data-testid="flowchart-step-caption"
      style={style}
      onClick={skip}
      title={done ? undefined : 'Click to show the full text'}
    >
      <div className="flowchart-step-caption-header">
        <span className="flowchart-step-caption-index">
          Step {caption.index + 1} / {caption.total}
        </span>
        <span className="flowchart-step-caption-title">{caption.title}</span>
        {caption.branch && (
          <span
            className="flowchart-step-caption-branch"
            data-testid="flowchart-step-caption-branch"
            title={`The flow forks here; this journey takes "${caption.branch.label}"`}
          >
            <GitBranch size={11} aria-hidden="true" />
            {caption.branch.label}
          </span>
        )}
      </div>
      {/* Read once in full by screen readers; the typed copy is visual only */}
      <p className="sr-only" aria-live="polite">{caption.text}</p>
      <p className="flowchart-step-caption-text" aria-hidden="true" data-testid="flowchart-step-caption-text">
        <span>{caption.text.slice(0, shown)}</span>
        {!done && <span className="flowchart-step-caption-caret" />}
        <span className="flowchart-step-caption-pending">{caption.text.slice(shown)}</span>
      </p>
      {caption.branch && caption.branch.alternatives.length > 0 && (
        <div className="flowchart-step-caption-alts" data-testid="flowchart-step-caption-alts">
          <span className="flowchart-step-caption-alts-label">Other path</span>
          {caption.branch.alternatives.map(alt => {
            const target = alt.journeyId !== undefined && alt.stepIndex !== undefined && onSwitchPath
              ? { journeyId: alt.journeyId, stepIndex: alt.stepIndex }
              : null;
            return target ? (
              <button
                key={alt.label}
                type="button"
                className="flowchart-step-caption-alt"
                data-testid="flowchart-step-caption-alt"
                title={`Show this step in "${alt.journeyLabel ?? alt.journeyId}"`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSwitchPath!(target.journeyId, target.stepIndex);
                }}
              >
                {alt.label}
                <ArrowRight size={11} aria-hidden="true" />
              </button>
            ) : (
              // No journey walks this option yet
              <span key={alt.label} className="flowchart-step-caption-alt" data-disabled="true">
                {alt.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
});
