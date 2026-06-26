"use client";

import { motion, AnimatePresence, type Transition } from "motion/react";
import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

export interface ExpandableTabItem {
  id: string;
  label: React.ReactNode;
  icon: React.ReactNode;
  content?: React.ReactNode;
  testId?: string;
  /** If provided, clicking fires this callback instead of toggling content. */
  onClick?: () => void;
  /** Render a thin vertical separator before this tab. */
  separator?: boolean;
}

export interface ExpandableTabsProps {
  tabs: ExpandableTabItem[];
  activeTabId: string | null;
  onTabChange: (id: string | null) => void;
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
}

const TABS_TRANSITION: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
  mouse: 0.8, // standard spring values
} as Record<string, unknown>;

export function ExpandableTabs({
  tabs,
  activeTabId,
  onTabChange,
  className,
  tabsClassName,
  contentClassName,
}: ExpandableTabsProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isContainerHovered, setIsContainerHovered] = useState(false);

  // ResizeObserver to measure content height dynamically
  useEffect(() => {
    if (!contentRef.current) {
      setContentHeight(0);
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentHeight(entry.target.getBoundingClientRect().height);
      }
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [activeTabId]);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const showLabels = isContainerHovered || activeTabId !== null;

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
  }, [activeTabId]);

  const showOverflow = activeTabId !== null && !isAnimating;

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsContainerHovered(true)}
      onMouseLeave={() => setIsContainerHovered(false)}
      transition={TABS_TRANSITION}
      style={{ width: activeTabId === "steps" ? "100%" : "auto" }}
      className={cn(
        "relative flex flex-col rounded-[20px] border border-border bg-card/95 shadow-xl backdrop-blur-md transition-all duration-300",
        showOverflow ? "overflow-visible" : "overflow-hidden",
        className
      )}
    >
      {/* Content Area */}
      <motion.div
        animate={{
          height: activeTabId ? contentHeight : 0,
          opacity: activeTabId ? 1 : 0,
        }}
        transition={TABS_TRANSITION}
        onAnimationComplete={() => setIsAnimating(false)}
        className={cn("w-full", showOverflow ? "overflow-visible" : "overflow-hidden", contentClassName)}
      >
        <div ref={contentRef} className="p-3 w-full">
          <AnimatePresence mode="wait" initial={false}>
            {activeTabId && activeTab && (
              <motion.div
                key={activeTabId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {activeTab.content}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Separator when open */}
      <AnimatePresence>
        {activeTabId && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-[1px] w-full bg-border origin-center"
          />
        )}
      </AnimatePresence>

      {/* Tabs Row */}
      <div
        className={cn(
          "flex items-center justify-center gap-1 p-1 mx-auto",
          tabsClassName
        )}
      >
        {tabs.map((tab) => {
          const isAction = !!tab.onClick;
          const isActive = !isAction && tab.id === activeTabId;
          return (
            <React.Fragment key={tab.id}>
              {tab.separator && (
                <span className="mx-0.5 h-4 w-px bg-border shrink-0" aria-hidden />
              )}
              <motion.button
                layout="position"
                type="button"
                data-testid={tab.testId}
                data-active={isActive ? "true" : "false"}
                onMouseEnter={() => setHoveredId(tab.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  if (isAction) {
                    tab.onClick!();
                  } else {
                    onTabChange(isActive ? null : tab.id);
                  }
                }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "relative flex items-center justify-center rounded-full text-xs font-semibold transition-[color,padding] duration-200 outline-none select-none border border-transparent cursor-pointer",
                  showLabels ? "px-3.5 py-1.5" : "p-2.5",
                  isActive
                    ? "text-primary border-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active Background */}
                {isActive && (
                  <motion.span
                    layoutId="expandable-tab-active-bg"
                    className="absolute inset-0 rounded-full bg-primary/[0.08]"
                    transition={TABS_TRANSITION}
                  />
                )}

                {/* Hover Background */}
                {hoveredId === tab.id && !isActive && (
                  <motion.span
                    layoutId="expandable-tab-hover-bg"
                    className="absolute inset-0 rounded-full bg-foreground/[0.04]"
                    transition={TABS_TRANSITION}
                  />
                )}

                <span className="relative z-10 flex items-center justify-center shrink-0 w-4 h-4">
                  {tab.icon}
                </span>
                <motion.span
                  animate={{
                    width: showLabels ? "auto" : 0,
                    opacity: showLabels ? 1 : 0,
                    marginLeft: showLabels ? 6 : 0,
                  }}
                  transition={TABS_TRANSITION}
                  className="relative z-10 whitespace-nowrap overflow-hidden inline-block expandable-tab-label"
                >
                  {tab.label}
                </motion.span>
              </motion.button>
            </React.Fragment>
          );
        })}
      </div>
    </motion.div>
  );
}

