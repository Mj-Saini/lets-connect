import { useEffect, useState } from "react";

type ThemeVariant = "soft" | "warm" | "coral" | "berry";

export function useDynamicTheme() {
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>("soft");

  useEffect(() => {
    // Rotate theme every 30 seconds for subtle visual changes
    const interval = setInterval(() => {
      setThemeVariant((prev) => {
        const themes: ThemeVariant[] = ["soft", "warm", "coral", "berry"];
        const currentIndex = themes.indexOf(prev);
        return themes[(currentIndex + 1) % themes.length];
      });
    }, 30000); // Change every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const themeColors = {
    soft: {
      from: "from-rose-200",
      via: "via-pink-100",
      to: "to-orange-100",
      primary: "from-rose-400 to-pink-400",
      dark: "from-rose-600 to-pink-600",
      bg: "from-rose-50 via-pink-50 to-orange-50",
      topBar: "from-rose-100 to-orange-100",
      accent: "from-rose-500 to-orange-500",
    },
    warm: {
      from: "from-orange-200",
      via: "via-amber-100",
      to: "to-yellow-100",
      primary: "from-orange-400 to-amber-400",
      dark: "from-orange-600 to-amber-600",
      bg: "from-orange-50 via-amber-50 to-yellow-50",
      topBar: "from-orange-100 to-amber-100",
      accent: "from-orange-500 to-amber-500",
    },
    coral: {
      from: "from-rose-300",
      via: "via-red-100",
      to: "to-pink-100",
      primary: "from-rose-400 to-red-400",
      dark: "from-rose-600 to-red-600",
      bg: "from-rose-50 via-red-50 to-pink-50",
      topBar: "from-rose-100 to-red-100",
      accent: "from-rose-500 to-red-500",
    },
    berry: {
      from: "from-pink-300",
      via: "via-purple-100",
      to: "to-rose-100",
      primary: "from-pink-400 to-purple-400",
      dark: "from-pink-600 to-purple-600",
      bg: "from-pink-50 via-purple-50 to-rose-50",
      topBar: "from-pink-100 to-purple-100",
      accent: "from-pink-500 to-purple-500",
    },
  };

  return {
    themeVariant,
    colors: themeColors[themeVariant],
  };
}
