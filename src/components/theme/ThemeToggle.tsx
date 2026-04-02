"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "icon" | "full";
  className?: string;
}

export function ThemeToggle({
  variant = "icon",
  className,
}: ThemeToggleProps) {
  const { theme, ready, toggleTheme } = useTheme();

  const isLight = theme === "light";
  const label = isLight ? "Светлая тема" : "Тёмная тема";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        disabled={!ready}
        className={cn(
          "card p-4 w-full flex items-center justify-between gap-4 text-left hover:bg-bg-hover disabled:opacity-70",
          className
        )}
      >
        <div>
          <p className="font-semibold">Тема оформления</p>
          <p className="text-sm text-text-secondary mt-1">
            {label}. Нажмите, чтобы переключить.
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-bg-tertiary text-accent flex items-center justify-center flex-shrink-0">
          {isLight ? <Sun size={18} /> : <Moon size={18} />}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!ready}
      title={label}
      aria-label={label}
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
        "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-70",
        className
      )}
    >
      {ready ? (isLight ? <Sun size={20} /> : <Moon size={20} />) : <div className="w-5 h-5 rounded-full bg-bg-tertiary" />}
    </button>
  );
}
