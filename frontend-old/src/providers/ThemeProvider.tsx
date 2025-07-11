'use client';
import { ReactNode, useEffect, createContext, useContext, useState } from 'react';

export type ThemeType = 'default' | 'dark' | 'blue' | 'purple' | 'green';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeType;
}

export const ThemeProvider = ({ children, defaultTheme = 'default' }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<ThemeType>(() => {
    // Load theme from localStorage or use default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stem-separator-theme');
      return (saved as ThemeType) || defaultTheme;
    }
    return defaultTheme;
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('stem-separator-theme', theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 