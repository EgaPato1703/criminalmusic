// Criminal Music Theme Configuration

export const criminalTheme = {
  // Color palette
  colors: {
    // Primary colors
    black: '#000000',
    darkRed: '#8B0000',
    neonBlue: '#00FFFF',
    dirtyGray: '#2F2F2F',
    
    // Secondary colors
    bloodRed: '#DC143C',
    shadowBlue: '#191970',
    streetGray: '#696969',
    smokeWhite: '#F5F5F5',
    
    // Background variations
    primaryBg: '#000000',
    secondaryBg: '#1a0000',
    cardBg: 'rgba(0, 0, 0, 0.8)',
    glassEffect: 'rgba(0, 0, 0, 0.3)',
    
    // Text colors
    textPrimary: '#00FFFF',
    textSecondary: '#2F2F2F',
    textMuted: '#696969',
    textInverse: '#000000',
    
    // Status colors
    success: '#00FF00',
    warning: '#FFD700',
    error: '#FF0000',
    info: '#00FFFF',
    
    // Interactive colors
    hover: 'rgba(0, 255, 255, 0.1)',
    active: 'rgba(139, 0, 0, 0.2)',
    focus: '#00FFFF',
    disabled: '#696969',
    
    // Mood colors
    aggression: '#FF4500',
    melancholy: '#4682B4',
    love: '#FF69B4',
    mystery: '#9932CC',
    energy: '#32CD32'
  },
  
  // Typography
  fonts: {
    primary: "'Metal Mania', cursive",
    secondary: "'Bangers', cursive",
    accent: "'Creepster', cursive",
    graffiti: "'Nosifer', cursive",
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
  },
  
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    md: '1rem',       // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '4rem'     // 64px
  },
  
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  },
  
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75
  },
  
  // Spacing
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem'      // 128px
  },
  
  // Breakpoints
  breakpoints: {
    xs: '320px',
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1200px',
    '2xl': '1440px'
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px rgba(0, 255, 255, 0.1)',
    md: '0 4px 6px rgba(0, 255, 255, 0.1)',
    lg: '0 10px 15px rgba(0, 255, 255, 0.1)',
    xl: '0 20px 25px rgba(0, 255, 255, 0.1)',
    neon: '0 0 20px rgba(0, 255, 255, 0.5)',
    red: '0 0 20px rgba(139, 0, 0, 0.5)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
  },
  
  // Border radius
  radii: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px'
  },
  
  // Transitions
  transitions: {
    fast: '0.15s ease-out',
    normal: '0.3s ease-out',
    slow: '0.5s ease-out'
  },
  
  // Z-index
  zIndices: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  },
  
  // Component-specific styles
  components: {
    button: {
      primary: {
        bg: 'linear-gradient(45deg, #8B0000, #DC143C)',
        color: '#00FFFF',
        border: '1px solid #00FFFF',
        hover: {
          bg: 'linear-gradient(45deg, #DC143C, #8B0000)',
          shadow: '0 0 20px rgba(0, 255, 255, 0.3)'
        }
      },
      secondary: {
        bg: 'transparent',
        color: '#00FFFF',
        border: '1px solid #00FFFF',
        hover: {
          bg: 'rgba(0, 255, 255, 0.1)',
          color: '#ffffff'
        }
      },
      ghost: {
        bg: 'transparent',
        color: '#2F2F2F',
        border: 'none',
        hover: {
          color: '#00FFFF'
        }
      }
    },
    
    card: {
      bg: 'rgba(0, 0, 0, 0.8)',
      border: '1px solid rgba(0, 255, 255, 0.2)',
      borderRadius: '8px',
      backdropFilter: 'blur(10px)',
      shadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
    },
    
    input: {
      bg: 'rgba(0, 0, 0, 0.5)',
      border: '1px solid #2F2F2F',
      borderRadius: '6px',
      color: '#00FFFF',
      placeholder: '#696969',
      focus: {
        border: '1px solid #00FFFF',
        shadow: '0 0 10px rgba(0, 255, 255, 0.3)'
      }
    }
  },
  
  // Criminal theme specific
  criminal: {
    moods: {
      aggression: {
        primary: '#FF4500',
        secondary: '#FF6347',
        icon: '🔫'
      },
      melancholy: {
        primary: '#4682B4',
        secondary: '#87CEEB',
        icon: '🌧️'
      },
      love: {
        primary: '#FF69B4',
        secondary: '#FFB6C1',
        icon: '❤️‍🔥'
      },
      mystery: {
        primary: '#9932CC',
        secondary: '#BA55D3',
        icon: '🎭'
      },
      energy: {
        primary: '#32CD32',
        secondary: '#90EE90',
        icon: '🏃'
      }
    },
    
    effects: {
      glitch: 'glitch 1.5s infinite',
      neonFlicker: 'neonFlicker 2s infinite',
      pulse: 'pulse 2s infinite',
      fadeIn: 'fadeIn 0.5s ease-out',
      slideIn: 'slideIn 0.3s ease-out'
    }
  }
};

// Utility functions for theme
export const getColor = (colorPath) => {
  return colorPath.split('.').reduce((obj, key) => obj[key], criminalTheme.colors);
};

export const getFontSize = (size) => {
  return criminalTheme.fontSizes[size] || size;
};

export const getSpacing = (space) => {
  return criminalTheme.spacing[space] || space;
};

export const mediaQuery = (breakpoint) => {
  return `@media (min-width: ${criminalTheme.breakpoints[breakpoint]})`;
};

export default criminalTheme;

