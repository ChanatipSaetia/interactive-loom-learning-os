"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { SPRING_PANEL } from "../../lib/ease";

export interface DropdownOption {
  value: string;
  label: string;
  [key: string]: any;
}

export interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  className?: string;
  triggerClassName?: string;
  optionsClassName?: string;
  optionClassName?: string;
  optionActiveClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  "data-testid"?: string;
  triggerTestId?: string;
  optionsTestId?: string;
  renderOption?: (option: DropdownOption) => React.ReactNode;
  native?: boolean;
  showChevron?: boolean;
}

export function Dropdown({
  value,
  onChange,
  options,
  className,
  triggerClassName,
  optionsClassName,
  optionClassName,
  optionActiveClassName,
  disabled = false,
  placeholder = "Select option",
  "data-testid": testId,
  triggerTestId,
  optionsTestId,
  renderOption,
  native = false,
  showChevron = true,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Escape" || e.key === "Tab") {
      setIsOpen(false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === "ArrowDown" && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const reduce = useReducedMotion();
  const isTest = typeof (globalThis as any).process !== "undefined" && (globalThis as any).process.env?.NODE_ENV === "test";
  const animateExit = !reduce && !isTest;

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block min-w-[200px]", className)}
      data-testid={native ? undefined : testId}
    >
      {/* Visually hidden native select for testing and accessibility compatibility */}
      {native && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          data-testid={testId}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0,
            pointerEvents: "none",
            left: 0,
            top: 0,
            zIndex: -1,
          }}
          tabIndex={-1}
          aria-hidden="true"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:border-accent disabled:pointer-events-none disabled:opacity-50 outline-none focus:border-accent",
          triggerClassName
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        data-testid={triggerTestId}
      >
        <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        {showChevron && (
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            role="listbox"
            aria-label="Options"
            data-testid={optionsTestId}
            className={cn(
              "absolute top-full left-0 z-50 mt-1 max-h-[240px] w-full overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg outline-none",
              optionsClassName
            )}
            initial={animateExit ? { opacity: 0, scale: 0.95, y: -4 } : undefined}
            animate={animateExit ? { opacity: 1, scale: 1, y: 0 } : undefined}
            exit={animateExit ? { opacity: 0, scale: 0.95, y: -4 } : undefined}
            transition={SPRING_PANEL}
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role={native ? undefined : "option"}
                  aria-selected={native ? undefined : active}
                  tabIndex={disabled ? undefined : 0}
                  data-testid={opt["data-testid"] || opt.testId}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onChange(opt.value);
                      setIsOpen(false);
                    }
                  }}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-primary/5 hover:text-foreground",
                    active ? (optionActiveClassName || "bg-primary/10 text-primary font-medium") : "",
                    optionClassName
                  )}
                >
                  {renderOption ? renderOption(opt) : <span className="truncate">{opt.label}</span>}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
