import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/** Light, dark, or follow the device. index.html applies it before first paint. */
export type ThemeChoice = 'system' | 'light' | 'dark';
const KEY = 'giv.theme';

const ThemeContext = createContext<{ theme: ThemeChoice; setTheme: (t: ThemeChoice) => void } | null>(null);

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(read);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && mq.matches));
    apply();
    if (theme !== 'system') return;
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  const setTheme = (t: ThemeChoice) => {
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* private mode: still applies for this visit */
    }
    setThemeState(t);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
