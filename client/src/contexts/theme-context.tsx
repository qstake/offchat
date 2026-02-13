import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeVariant = 'matrix' | 'neon' | 'cyber' | 'ocean' | 'sunset' | 'midnight';

export interface ThemeColors {
  id: ThemeVariant;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundSecondary: string;
    gradient: {
      header: string;
      input: string;
      sidebar: string;
      card: string;
      button: string;
      overlay: string;
    };
    glow: {
      primary: string;
      secondary: string;
      shadow: string;
    };
  };
}

export const themeVariants: Record<ThemeVariant, ThemeColors> = {
  matrix: {
    id: 'matrix',
    name: 'Matrix Green',
    description: 'Classic cyber-punk green theme',
    preview: 'linear-gradient(135deg, #00ff00 0%, #22c55e 100%)',
    colors: {
      primary: 'hsl(120 100% 60%)',
      primaryDark: 'hsl(120 70% 35%)',
      primaryLight: 'hsl(120 100% 80%)',
      secondary: 'hsl(120 50% 40%)',
      accent: 'hsl(120 100% 75%)',
      background: 'hsl(0 0% 0%)',
      backgroundSecondary: 'hsl(120 15% 5%)',
      gradient: {
        header: 'linear-gradient(135deg, hsl(0 0% 0%) 0%, hsl(120 15% 5%) 50%, hsl(0 0% 0%) 100%)',
        input: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(17, 24, 39, 0.9) 100%)',
        sidebar: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(17, 24, 39, 0.95) 100%)',
        card: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)',
        button: 'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(34, 197, 94, 0.15) 100%)',
        overlay: 'linear-gradient(90deg, transparent 0%, rgba(0, 255, 0, 0.6) 50%, transparent 100%)'
      },
      glow: {
        primary: 'rgba(0, 255, 0, 0.3)',
        secondary: 'rgba(34, 197, 94, 0.2)',
        shadow: '0 0 20px rgba(0, 255, 0, 0.15)'
      }
    }
  },
  neon: {
    id: 'neon',
    name: 'Neon Pink',
    description: 'Vibrant neon pink cyber theme',
    preview: 'linear-gradient(135deg, #ff0080 0%, #ff4da6 100%)',
    colors: {
      primary: 'hsl(320 100% 50%)',
      primaryDark: 'hsl(320 70% 35%)',
      primaryLight: 'hsl(320 100% 75%)',
      secondary: 'hsl(320 50% 40%)',
      accent: 'hsl(320 100% 65%)',
      background: 'hsl(0 0% 0%)',
      backgroundSecondary: 'hsl(320 15% 5%)',
      gradient: {
        header: 'linear-gradient(135deg, hsl(0 0% 0%) 0%, hsl(320 15% 5%) 50%, hsl(0 0% 0%) 100%)',
        input: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(39, 17, 39, 0.9) 100%)',
        sidebar: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(39, 17, 39, 0.95) 100%)',
        card: 'linear-gradient(135deg, rgba(42, 15, 42, 0.6) 0%, rgba(59, 30, 59, 0.4) 100%)',
        button: 'linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(255, 77, 166, 0.15) 100%)',
        overlay: 'linear-gradient(90deg, transparent 0%, rgba(255, 0, 128, 0.6) 50%, transparent 100%)'
      },
      glow: {
        primary: 'rgba(255, 0, 128, 0.3)',
        secondary: 'rgba(255, 77, 166, 0.2)',
        shadow: '0 0 20px rgba(255, 0, 128, 0.15)'
      }
    }
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Blue',
    description: 'Electric blue futuristic theme',
    preview: 'linear-gradient(135deg, #0080ff 0%, #00ccff 100%)',
    colors: {
      primary: 'hsl(200 100% 50%)',
      primaryDark: 'hsl(200 70% 35%)',
      primaryLight: 'hsl(200 100% 75%)',
      secondary: 'hsl(200 50% 40%)',
      accent: 'hsl(200 100% 65%)',
      background: 'hsl(0 0% 0%)',
      backgroundSecondary: 'hsl(200 15% 5%)',
      gradient: {
        header: 'linear-gradient(135deg, hsl(0 0% 0%) 0%, hsl(200 15% 5%) 50%, hsl(0 0% 0%) 100%)',
        input: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(17, 24, 39, 0.9) 100%)',
        sidebar: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(17, 24, 39, 0.95) 100%)',
        card: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%)',
        button: 'linear-gradient(135deg, rgba(0, 128, 255, 0.1) 0%, rgba(0, 204, 255, 0.15) 100%)',
        overlay: 'linear-gradient(90deg, transparent 0%, rgba(0, 128, 255, 0.6) 50%, transparent 100%)'
      },
      glow: {
        primary: 'rgba(0, 128, 255, 0.3)',
        secondary: 'rgba(0, 204, 255, 0.2)',
        shadow: '0 0 20px rgba(0, 128, 255, 0.15)'
      }
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Teal',
    description: 'Deep ocean teal theme',
    preview: 'linear-gradient(135deg, #008080 0%, #20b2aa 100%)',
    colors: {
      primary: 'hsl(180 100% 25%)',
      primaryDark: 'hsl(180 70% 20%)',
      primaryLight: 'hsl(180 100% 40%)',
      secondary: 'hsl(180 50% 30%)',
      accent: 'hsl(180 100% 35%)',
      background: 'hsl(0 0% 0%)',
      backgroundSecondary: 'hsl(180 15% 5%)',
      gradient: {
        header: 'linear-gradient(135deg, hsl(0 0% 0%) 0%, hsl(180 15% 5%) 50%, hsl(0 0% 0%) 100%)',
        input: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(17, 39, 39, 0.9) 100%)',
        sidebar: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(17, 39, 39, 0.95) 100%)',
        card: 'linear-gradient(135deg, rgba(15, 42, 42, 0.6) 0%, rgba(30, 59, 59, 0.4) 100%)',
        button: 'linear-gradient(135deg, rgba(0, 128, 128, 0.1) 0%, rgba(32, 178, 170, 0.15) 100%)',
        overlay: 'linear-gradient(90deg, transparent 0%, rgba(0, 128, 128, 0.6) 50%, transparent 100%)'
      },
      glow: {
        primary: 'rgba(0, 128, 128, 0.3)',
        secondary: 'rgba(32, 178, 170, 0.2)',
        shadow: '0 0 20px rgba(0, 128, 128, 0.15)'
      }
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Orange',
    description: 'Warm sunset orange theme',
    preview: 'linear-gradient(135deg, #ff8000 0%, #ffaa44 100%)',
    colors: {
      primary: 'hsl(30 100% 50%)',
      primaryDark: 'hsl(30 70% 35%)',
      primaryLight: 'hsl(30 100% 75%)',
      secondary: 'hsl(30 50% 40%)',
      accent: 'hsl(30 100% 65%)',
      background: 'hsl(0 0% 0%)',
      backgroundSecondary: 'hsl(30 15% 5%)',
      gradient: {
        header: 'linear-gradient(135deg, hsl(0 0% 0%) 0%, hsl(30 15% 5%) 50%, hsl(0 0% 0%) 100%)',
        input: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(39, 24, 17, 0.9) 100%)',
        sidebar: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(39, 24, 17, 0.95) 100%)',
        card: 'linear-gradient(135deg, rgba(42, 23, 15, 0.6) 0%, rgba(59, 41, 30, 0.4) 100%)',
        button: 'linear-gradient(135deg, rgba(255, 128, 0, 0.1) 0%, rgba(255, 170, 68, 0.15) 100%)',
        overlay: 'linear-gradient(90deg, transparent 0%, rgba(255, 128, 0, 0.6) 50%, transparent 100%)'
      },
      glow: {
        primary: 'rgba(255, 128, 0, 0.3)',
        secondary: 'rgba(255, 170, 68, 0.2)',
        shadow: '0 0 20px rgba(255, 128, 0, 0.15)'
      }
    }
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Purple',
    description: 'Deep midnight purple theme',
    preview: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
    colors: {
      primary: 'hsl(270 91% 35%)',
      primaryDark: 'hsl(270 70% 25%)',
      primaryLight: 'hsl(270 91% 55%)',
      secondary: 'hsl(270 50% 30%)',
      accent: 'hsl(270 91% 45%)',
      background: 'hsl(0 0% 0%)',
      backgroundSecondary: 'hsl(270 15% 5%)',
      gradient: {
        header: 'linear-gradient(135deg, hsl(0 0% 0%) 0%, hsl(270 15% 5%) 50%, hsl(0 0% 0%) 100%)',
        input: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(24, 17, 39, 0.9) 100%)',
        sidebar: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(24, 17, 39, 0.95) 100%)',
        card: 'linear-gradient(135deg, rgba(23, 15, 42, 0.6) 0%, rgba(41, 30, 59, 0.4) 100%)',
        button: 'linear-gradient(135deg, rgba(76, 29, 149, 0.1) 0%, rgba(124, 58, 237, 0.15) 100%)',
        overlay: 'linear-gradient(90deg, transparent 0%, rgba(76, 29, 149, 0.6) 50%, transparent 100%)'
      },
      glow: {
        primary: 'rgba(76, 29, 149, 0.3)',
        secondary: 'rgba(124, 58, 237, 0.2)',
        shadow: '0 0 20px rgba(76, 29, 149, 0.15)'
      }
    }
  }
};

interface ThemeContextValue {
  currentTheme: ThemeVariant;
  themes: Record<ThemeVariant, ThemeColors>;
  setTheme: (theme: ThemeVariant) => void;
  getCurrentColors: () => ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeVariant>(() => {
    // Load theme from localStorage or default to matrix
    const savedTheme = localStorage.getItem('offchat-theme') as ThemeVariant;
    return savedTheme && themeVariants[savedTheme] ? savedTheme : 'matrix';
  });

  const setTheme = (theme: ThemeVariant) => {
    setCurrentTheme(theme);
    localStorage.setItem('offchat-theme', theme);
    applyThemeVariables(themeVariants[theme]);
  };

  const getCurrentColors = () => themeVariants[currentTheme];

  // Apply theme variables to CSS custom properties
  const applyThemeVariables = (theme: ThemeColors) => {
    const root = document.documentElement;
    
    // Core theme colors
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--primary-foreground', theme.colors.background);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--secondary-foreground', theme.colors.primaryLight);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--accent-foreground', theme.colors.background);
    
    // Border and input colors based on theme
    const primaryHsl = theme.colors.primary.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
    if (primaryHsl) {
      const [, h, s, l] = primaryHsl;
      root.style.setProperty('--border', `hsl(${h} ${Math.max(20, parseInt(s) - 30)}% ${Math.max(15, parseInt(l) - 30)}%)`);
      root.style.setProperty('--input', `hsl(${h} ${Math.max(20, parseInt(s) - 30)}% ${Math.max(10, parseInt(l) - 45)}%)`);
      root.style.setProperty('--ring', `hsl(${h} ${s}% ${Math.min(85, parseInt(l) + 15)}%)`);
      root.style.setProperty('--muted', `hsl(${h} ${Math.max(15, parseInt(s) - 50)}% ${Math.max(10, parseInt(l) - 45)}%)`);
      root.style.setProperty('--muted-foreground', `hsl(${h} ${Math.max(30, parseInt(s) - 20)}% ${Math.min(85, parseInt(l) + 20)}%)`);
    }
    
    // Sidebar colors
    root.style.setProperty('--sidebar', theme.colors.backgroundSecondary);
    root.style.setProperty('--sidebar-foreground', theme.colors.primaryLight);
    root.style.setProperty('--sidebar-primary', theme.colors.primary);
    root.style.setProperty('--sidebar-primary-foreground', theme.colors.background);
    root.style.setProperty('--sidebar-accent', theme.colors.accent);
    root.style.setProperty('--sidebar-accent-foreground', theme.colors.background);
    root.style.setProperty('--sidebar-border', theme.colors.secondary);
    root.style.setProperty('--sidebar-ring', theme.colors.primary);
    
    // Apply gradients
    root.style.setProperty('--mobile-header-gradient', theme.colors.gradient.header);
    root.style.setProperty('--gradient-input', theme.colors.gradient.input);
    root.style.setProperty('--gradient-sidebar', theme.colors.gradient.sidebar);
    root.style.setProperty('--gradient-card', theme.colors.gradient.card);
    root.style.setProperty('--gradient-button', theme.colors.gradient.button);
    root.style.setProperty('--gradient-overlay', theme.colors.gradient.overlay);
    
    // Apply glow effects
    root.style.setProperty('--glow-primary', theme.colors.glow.primary);
    root.style.setProperty('--glow-secondary', theme.colors.glow.secondary);
    root.style.setProperty('--glow-shadow', theme.colors.glow.shadow);
    
    // Mobile shadows with theme colors
    root.style.setProperty('--mobile-shadow-light', `0 2px 8px ${theme.colors.glow.primary.replace('0.3', '0.08')}`);
    root.style.setProperty('--mobile-shadow-medium', `0 4px 16px ${theme.colors.glow.primary.replace('0.3', '0.12')}, 0 2px 8px hsl(0 0% 0% / 0.3)`);
    root.style.setProperty('--mobile-shadow-heavy', `0 8px 32px ${theme.colors.glow.primary.replace('0.3', '0.15')}, 0 4px 16px hsl(0 0% 0% / 0.4)`);
    
    // Mobile header border gradient
    root.style.setProperty('--mobile-header-border-gradient', 
      `linear-gradient(90deg, transparent 0%, ${theme.colors.glow.primary.replace('0.3', '0.3')} 20%, ${theme.colors.glow.primary.replace('0.3', '0.5')} 50%, ${theme.colors.glow.primary.replace('0.3', '0.3')} 80%, transparent 100%)`
    );
    
    // Matrix-specific variables for compatibility
    root.style.setProperty('--matrix-green', theme.colors.primary);
    root.style.setProperty('--matrix-green-dark', theme.colors.primaryDark);
    root.style.setProperty('--matrix-green-light', theme.colors.primaryLight);
  };

  // Initialize theme on mount
  useEffect(() => {
    applyThemeVariables(themeVariants[currentTheme]);
  }, [currentTheme]);

  const value: ThemeContextValue = {
    currentTheme,
    themes: themeVariants,
    setTheme,
    getCurrentColors
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}