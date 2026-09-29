import { createContext, useContext, useEffect, useState } from 'react';

const ThemeProviderContext = createContext(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}) {
  const [theme, setThemeState] = useState(() => {
    const storedTheme = localStorage.getItem(storageKey);
    return storedTheme || defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const resolvedTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    root.classList.toggle('dark-theme', resolvedTheme === 'dark');
    root.classList.toggle('light-theme', resolvedTheme === 'light');
    root.style.colorScheme = resolvedTheme;
  }, [theme]);

  const setTheme = (nextTheme) => {
    localStorage.setItem(storageKey, nextTheme);
    setThemeState(nextTheme);
  };

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
