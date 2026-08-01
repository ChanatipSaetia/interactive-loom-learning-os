import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Palette, Moon, Sun, Cat, BookOpen } from "lucide-react";
import { useTheme } from "../theme/useTheme";
import { cn } from "../utils";
import { SPRING_PRESS } from "./ease";

const THEME_ICONS: Record<string, React.ReactNode> = {
  "": <Palette className="h-4 w-4" />,
  medicare: <Moon className="h-4 w-4" />,
  recipebook: <Sun className="h-4 w-4" />,
  pinkcatboo: <Cat className="h-4 w-4" />,
  eink: <BookOpen className="h-4 w-4" />,
};

const THEME_LABELS: Record<string, string> = {
  "": "Catppuccin",
  medicare: "MediCare+",
  recipebook: "RecipeBook",
  pinkcatboo: "PinkCatBoo",
  eink: "E-Ink (Paper)",
};

export function ThemeToggle({ className }: { className?: string }) {
  const { themeId, setTheme, themes } = useTheme();
  const reduce = useReducedMotion();

  const nextTheme = () => {
    const idx = themes.findIndex((t: { id: string }) => t.id === themeId);
    const next = themes[(idx + 1) % themes.length];
    setTheme(next.id);
  };

  const icon = THEME_ICONS[themeId] ?? <Palette className="h-4 w-4" />;
  const label = THEME_LABELS[themeId] ?? "Catppuccin";

  return (
    <motion.button
      type="button"
      onClick={nextTheme}
      whileTap={reduce ? undefined : { scale: 0.95 }}
      transition={SPRING_PRESS}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent",
        className,
      )}
      aria-label={`Current theme: ${label}. Click to cycle.`}
    >
      <div className="relative h-4 w-4 overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={themeId}
            initial={{ opacity: 0, scale: 0.25, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.25, filter: "blur(8px)" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {icon}
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="truncate">{label}</span>
    </motion.button>
  );
}
