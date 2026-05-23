"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const subscribe = () => () => {};

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const currentTheme = mounted
    ? theme === "system"
      ? (resolvedTheme ?? "light")
      : (theme ?? "light")
    : "light";
  const isDark = currentTheme === "dark";

  return (
    <button
      suppressHydrationWarning
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
