/**
 * Account: trangtttce191027
 * Author: trangtttce191027
 * Issue / UC: UC01 - Theme State Management & Persistence
 * Purpose: Quản lý chủ đề giao diện sáng/tối (Light/Dark Theme), lưu và khôi phục tùy chọn người dùng từ AsyncStorage (@app_theme).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

const THEME_KEY = '@app_theme';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState('light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadTheme() {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (isMounted && (savedTheme === 'light' || savedTheme === 'dark')) {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load the saved theme:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode((currentMode) => {
      const nextMode = currentMode === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_KEY, nextMode).catch((error) => {
        console.error('Failed to save the selected theme:', error);
      });
      return nextMode;
    });
  }, []);

  const theme = useMemo(() => {
    const navigationTheme = themeMode === 'dark' ? DarkTheme : DefaultTheme;

    return {
      ...navigationTheme,
      dark: themeMode === 'dark',
      mode: themeMode,
      colors: {
        ...navigationTheme.colors,
        primary: COLORS.primary,
        primaryLight: COLORS.primaryLight,
        ...COLORS[themeMode],
      },
    };
  }, [themeMode]);

  const contextValue = useMemo(
    () => ({ theme, themeMode, toggleTheme }),
    [theme, themeMode, toggleTheme],
  );

  if (loading) {
    return null;
  }

  return(
      <ThemeContext.Provider value={contextValue}>
        {children}
      </ThemeContext.Provider>
    )
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }
  return context;
}