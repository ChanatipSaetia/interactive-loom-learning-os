import { AnimatePresence, motion } from "motion/react";
import { Palette, Moon, Sun, Cat, BookOpen, MoonStar, Droplets, Droplet, ChevronDown } from "lucide-react";
import { useTheme } from "../theme/useTheme";
import { cn } from "../utils";

const THEME_ICONS: Record<string, React.ReactNode> = {
  "": <Palette className="h-4 w-4" />,
  medicare: <Moon className="h-4 w-4" />,
  recipebook: <Sun className="h-4 w-4" />,
  pinkcatboo: <Cat className="h-4 w-4" />,
  eink: <BookOpen className="h-4 w-4" />,
  bedtime: <MoonStar className="h-4 w-4" />,
  "liquid-glass": <Droplets className="h-4 w-4" />,
  "liquid-glass-light": <Droplet className="h-4 w-4" />,
};

const THEME_LABELS: Record<string, string> = {
  "": "Catppuccin",
  medicare: "MediCare+",
  recipebook: "RecipeBook",
  pinkcatboo: "PinkCatBoo",
  eink: "E-Ink (Paper)",
  bedtime: "Bedtime",
  "liquid-glass": "Liquid Glass",
  "liquid-glass-light": "Glass Light",
};

/**
 * The theme picker: a pill showing the current theme, with a native <select> laid over it, so a
 * click opens a dropdown of every theme (the system picker on phones). Pages may hide its label.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { themeId, setTheme, themes } = useTheme();

  const icon = THEME_ICONS[themeId] ?? <Palette className="h-4 w-4" />;
  const label = THEME_LABELS[themeId] ?? "Catppuccin";

  return (
    <label
      className={cn(
        "theme-toggle relative inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
      title="Theme"
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
      <span className="theme-toggle-label truncate">{label}</span>
      <ChevronDown className="theme-toggle-chevron h-3.5 w-3.5 opacity-60" aria-hidden />
      <select
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        value={themeId}
        onChange={(e) => setTheme(e.target.value)}
        aria-label="Theme"
        data-testid="theme-select"
      >
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.icon ? `${t.icon} ${t.label}` : t.label}
          </option>
        ))}
      </select>
    </label>
  );
}
