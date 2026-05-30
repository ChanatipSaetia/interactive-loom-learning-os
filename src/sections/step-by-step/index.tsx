import { useRef, useState, useCallback, type ComponentType } from 'react'
import { SectionRegistry } from '../../core/registry'

export interface StepContent {
  title: string
  body: string
}

export interface StepByStepProps {
  title?: string
  steps: StepContent[]
}

function StepByStep({ title, steps }: StepByStepProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1
      if (next >= steps.length) return prev
      animateStepIn(contentRef.current)
      return next
    })
  }, [steps.length])

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev - 1
      if (next < 0) return prev
      animateStepIn(contentRef.current)
      return next
    })
  }, [])

  const step = steps[currentStep] || { title: '', body: '' }

  return (
    <div className="step-by-step" data-testid="step-by-step">
      {title && <h3 className="step-by-step-title">{title}</h3>}

      <div
        ref={contentRef}
        className="step-by-step-content"
        data-testid="step-content"
      >
        <h4 className="step-by-step-step-title" data-testid="step-title">
          {step.title}
        </h4>
        <p className="step-by-step-step-body" data-testid="step-body">
          {step.body}
        </p>
      </div>

      <div className="step-by-step-controls" data-testid="step-controls">
        <button
          className="step-by-step-btn"
          onClick={handlePrev}
          disabled={currentStep === 0}
          data-testid="step-prev"
          aria-label="Previous step"
        >
          Prev
        </button>

        <span
          className="step-by-step-progress"
          data-testid="step-progress"
        >
          {currentStep + 1} / {steps.length}
        </span>

        <button
          className="step-by-step-btn"
          onClick={handleNext}
          disabled={currentStep >= steps.length - 1}
          data-testid="step-next"
          aria-label="Next step"
        >
          Next
        </button>
      </div>
    </div>
  )
}

function animateStepIn(el: HTMLDivElement | null) {
  if (!el) return
  try {
    el.style.opacity = '0'
    el.style.transform = 'translateY(12px)'
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
      setTimeout(() => {
        el.style.transition = ''
      }, 350)
    })
  } catch {
    // no-op if browser doesn't support animations
  }
}

SectionRegistry.register('step-by-step', StepByStep as ComponentType<unknown>)

export default StepByStep
