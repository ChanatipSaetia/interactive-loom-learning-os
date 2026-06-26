import { motion, useInView, useReducedMotion } from "motion/react";
import { type ReactNode, type RefObject, useRef } from "react";

import { EASE_OUT } from "../../lib/ease";
import { cn } from "../../lib/utils";

export interface ScrollRevealProps {
  children: ReactNode;
  y?: number;
  blur?: number;
  duration?: number;
  delay?: number;
  once?: boolean;
  amount?: "some" | "all" | number;
  root?: RefObject<Element | null>;
  className?: string;
  as?: "div" | "tr" | "section";
}

export function ScrollReveal({
  children,
  y = 16,
  blur = 8,
  duration = 0.6,
  delay = 0,
  once = true,
  amount = 0.3,
  root,
  className,
  as: Component = "div",
}: ScrollRevealProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { root, once, amount });

  const hidden = reduce
    ? { opacity: 0 }
    : { opacity: 0, y, filter: `blur(${blur}px)` };
  const shown = reduce
    ? { opacity: 1 }
    : { opacity: 1, y: 0, filter: "blur(0px)" };

  const MotionComponent = motion[Component];
  // The ref type cannot be statically narrowed across the "div" | "tr" | "section"
  // union without a full discriminated union — safe to cast here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const motionRef = ref as unknown as any;

  return (
    <MotionComponent
      ref={motionRef}
      initial={hidden}
      animate={inView ? shown : hidden}
      transition={{ duration, ease: EASE_OUT, delay }}
      className={cn(className)}
    >
      {children}
    </MotionComponent>
  );
}
