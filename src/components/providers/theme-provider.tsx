'use client';

import { useEffect } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  buttonColor: string;
  textColor: string;
}

export function ThemeProvider({
  children,
  primaryColor,
  secondaryColor,
  accentColor,
  buttonColor,
  textColor,
}: ThemeProviderProps) {
  useEffect(() => {
    // Inject theme colors as CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--secondary', secondaryColor);
    root.style.setProperty('--accent', accentColor);
    root.style.setProperty('--button', buttonColor);
    root.style.setProperty('--text', textColor);
  }, [primaryColor, secondaryColor, accentColor, buttonColor, textColor]);

  return <>{children}</>;
}
