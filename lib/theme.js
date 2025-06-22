import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, Appearance } from 'react-native';

const ThemeContext = createContext();

// Color palette based on the web version with glassy effects
const colors = {
  light: {
    // Primary colors
    primary: '#3B82F6',      // Blue-500
    primaryHover: '#2563EB', // Blue-600
    secondary: '#9333EA',    // Purple-600
    secondaryHover: '#7C3AED', // Purple-700
    
    // Background colors - Enhanced light glass morphism
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
    backgroundSecondary: 'rgba(248, 250, 252, 0.9)', 
    backgroundTertiary: 'rgba(241, 245, 249, 0.8)',
    
    // Surface colors - Better light glass morphism
    surface: 'rgba(255, 255, 255, 0.7)',  // More opaque for better visibility
    surfaceSecondary: 'rgba(248, 250, 252, 0.5)',
    surfaceHover: 'rgba(241, 245, 249, 0.8)',
    
    // Glass effect properties - Enhanced for light mode
    glass: {
      background: 'rgba(255, 255, 255, 0.7)',  // More visible
      backdrop: 'blur(20px)',
      border: 'rgba(226, 232, 240, 0.5)',  // Subtle border
    },
    
    // Text colors
    text: '#111827',         // Gray-900
    textSecondary: '#6B7280', // Gray-500
    textTertiary: '#9CA3AF',  // Gray-400
    textInverted: '#FFFFFF',
    
    // Border colors
    border: '#E5E7EB',       // Gray-200
    borderHover: '#D1D5DB',  // Gray-300
    
    // Status colors
    success: '#10B981',      // Green-500
    successBackground: '#D1FAE5', // Green-100
    warning: '#F59E0B',      // Yellow-500
    warningBackground: '#FEF3C7', // Yellow-100
    error: '#EF4444',        // Red-500
    errorBackground: '#FEE2E2', // Red-100
    info: '#3B82F6',         // Blue-500
    infoBackground: '#DBEAFE', // Blue-100
    
    // Priority colors
    priorityHigh: '#EF4444',     // Red-500
    priorityMedium: '#F59E0B',   // Yellow-500
    priorityLow: '#22C55E',      // Green-500
    
    // Category colors
    categoryStudy: '#3B82F6',    // Blue-500
    categoryWork: '#9333EA',     // Purple-600
    categoryPersonal: '#22C55E', // Green-500
    categoryHealth: '#EC4899',   // Pink-500
    categoryGeneral: '#6B7280',  // Gray-500
    
    // Shadow colors - Enhanced for glass effect
    shadow: 'rgba(0, 0, 0, 0.25)',
    shadowLight: 'rgba(0, 0, 0, 0.1)',
    shadowMedium: 'rgba(0, 0, 0, 0.3)',
    shadowGlass: 'rgba(31, 38, 135, 0.37)',
  },
  dark: {
    // Primary colors
    primary: '#60A5FA',      // Blue-400
    primaryHover: '#3B82F6', // Blue-500
    secondary: '#A855F7',    // Purple-500
    secondaryHover: '#9333EA', // Purple-600
    
    // Background colors - Better dark glass morphism
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    backgroundSecondary: 'rgba(15, 23, 42, 0.9)', // Darker, more opaque
    backgroundTertiary: 'rgba(30, 41, 59, 0.8)',  // Better contrast
    
    // Surface colors - Enhanced dark glass morphism
    surface: 'rgba(30, 41, 59, 0.6)',  // More opaque for better visibility
    surfaceSecondary: 'rgba(51, 65, 85, 0.4)',
    surfaceHover: 'rgba(71, 85, 105, 0.5)',
    
    // Glass effect properties - Better for dark mode
    glass: {
      background: 'rgba(30, 41, 59, 0.6)',  // More visible in dark
      backdrop: 'blur(20px)',
      border: 'rgba(148, 163, 184, 0.2)',  // Lighter border for visibility
    },
    
    // Text colors
    text: '#F9FAFB',         // Gray-50
    textSecondary: '#D1D5DB', // Gray-300
    textTertiary: '#9CA3AF',  // Gray-400
    textInverted: '#111827',  // Gray-900
    
    // Border colors
    border: '#374151',       // Gray-700
    borderHover: '#4B5563',  // Gray-600
    
    // Status colors
    success: '#34D399',      // Green-400
    successBackground: '#064E3B', // Green-900
    warning: '#FBBF24',      // Yellow-400
    warningBackground: '#78350F', // Yellow-900
    error: '#F87171',        // Red-400
    errorBackground: '#7F1D1D', // Red-900
    info: '#60A5FA',         // Blue-400
    infoBackground: '#1E3A8A', // Blue-900
    
    // Priority colors
    priorityHigh: '#F87171',     // Red-400
    priorityMedium: '#FBBF24',   // Yellow-400
    priorityLow: '#34D399',      // Green-400
    
    // Category colors
    categoryStudy: '#60A5FA',    // Blue-400
    categoryWork: '#A855F7',     // Purple-500
    categoryPersonal: '#34D399', // Green-400
    categoryHealth: '#F472B6',   // Pink-400
    categoryGeneral: '#9CA3AF',  // Gray-400
    
    // Shadow colors - Enhanced for dark glass effect
    shadow: 'rgba(0, 0, 0, 0.8)',               // Stronger shadow for better contrast
    shadowLight: 'rgba(0, 0, 0, 0.5)',          // More visible light shadow
    shadowMedium: 'rgba(0, 0, 0, 0.9)',         // Very strong medium shadow
    shadowGlass: 'rgba(96, 165, 250, 0.3)',     // Blue glow for glass elements
  }
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [isSystemTheme, setIsSystemTheme] = useState(true);

  // Load theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen to system theme changes when using system theme
  useEffect(() => {
    if (isSystemTheme) {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setIsDark(colorScheme === 'dark');
      });
      return () => subscription?.remove();
    }
  }, [isSystemTheme]);

  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setIsSystemTheme(false);
        setIsDark(storedTheme === 'dark');
      } else {
        // Use system theme
        setIsSystemTheme(true);
        setIsDark(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    setIsSystemTheme(false);
    
    try {
      await AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setSystemTheme = async () => {
    setIsSystemTheme(true);
    setIsDark(systemColorScheme === 'dark');
    
    try {
      await AsyncStorage.removeItem('theme');
    } catch (error) {
      console.error('Error removing theme preference:', error);
    }
  };

  const theme = {
    isDark,
    isSystemTheme,
    colors: isDark ? colors.dark : colors.light,
    toggleTheme,
    setSystemTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility functions for theme-aware styles
export const getThemeColors = (isDark) => isDark ? colors.dark : colors.light;

export const createThemedStyles = (styleFunction) => {
  return (theme) => styleFunction(theme.colors, theme.isDark);
};

// Priority color utilities
export const getPriorityColor = (priority, theme) => {
  switch (priority) {
    case 'high': return theme.colors.priorityHigh;
    case 'medium': return theme.colors.priorityMedium;
    case 'low': return theme.colors.priorityLow;
    default: return theme.colors.textSecondary;
  }
};

// Category color utilities
export const getCategoryColor = (category, theme) => {
  switch (category) {
    case 'study': return theme.colors.categoryStudy;
    case 'work': return theme.colors.categoryWork;
    case 'personal': return theme.colors.categoryPersonal;
    case 'health': return theme.colors.categoryHealth;
    default: return theme.colors.categoryGeneral;
  }
};

export default colors; 