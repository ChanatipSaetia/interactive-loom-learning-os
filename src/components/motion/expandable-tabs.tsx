"use client";

import { motion, AnimatePresence, type Transition } from "motion/react";
import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

export interface ExpandableTabItem {
  id: string;
  label: React.ReactNode;
  icon: React.ReactNode;
  content: React.ReactNode;
  testId?: string;
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
} as any;

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

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsContainerHovered(true)}
      onMouseLeave={() => setIsContainerHovered(false)}
      transition={TABS_TRANSITION}
      style={{ width: activeTabId === "steps" ? "100%" : "auto" }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[20px] border border-border bg-card/95 shadow-xl backdrop-blur-md transition-all duration-300",
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
        className={cn("overflow-hidden w-full", contentClassName)}
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
          const isActive = tab.id === activeTabId;
          return (
            <motion.button
              key={tab.id}
              layout="position"
              type="button"
              data-testid={tab.testId}
              onMouseEnter={() => setHoveredId(tab.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => {
                onTabChange(isActive ? null : tab.id);
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
                className="relative z-10 whitespace-nowrap overflow-hidden inline-block"
              >
                {tab.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

