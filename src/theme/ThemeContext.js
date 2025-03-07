import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { DARK_COLORS, LIGHT_COLORS } from './index';
import dayjs from 'dayjs';

// Create theme context
export const ThemeContext = createContext({
  isDarkMode: false,
  colors: LIGHT_COLORS,
  toggleTheme: () => {},
  setIsSystemTheme: () => {},
});

// Hook to use theme
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSystemTheme, setIsSystemTheme] = useState(true);
  
  // Check if it's night time (between 7 PM and 6 AM)
  const isNightTime = () => {
    const hour = dayjs().hour();
    return hour >= 19 || hour < 6;
  };
  
  // Update theme based on system or time
  useEffect(() => {
    if (isSystemTheme) {
      setIsDarkMode(colorScheme === 'dark');
    } else {
      setIsDarkMode(isNightTime());
    }
  }, [colorScheme, isSystemTheme]);
  
  // Set interval to check time every minute if not using system theme
  useEffect(() => {
    if (!isSystemTheme) {
      const intervalId = setInterval(() => {
        setIsDarkMode(isNightTime());
      }, 60000); // Check every minute
      
      return () => clearInterval(intervalId);
    }
  }, [isSystemTheme]);
  
  // Toggle theme function
  const toggleTheme = () => {
    setIsSystemTheme(false);
    setIsDarkMode(prev => !prev);
  };
  
  // Theme values
  const theme = {
    isDarkMode,
    colors: isDarkMode ? DARK_COLORS : LIGHT_COLORS,
    toggleTheme,
    setIsSystemTheme,
  };
  
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}; 