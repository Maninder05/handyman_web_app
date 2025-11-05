"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  jobAlerts: boolean;
  messageAlerts: boolean;
}

interface SettingsContextType {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'es' | 'fr' | 'de';
  timezone: string;
  notifications: NotificationSettings;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLanguage: (lang: 'en' | 'es' | 'fr' | 'de') => void;
  setTimezone: (tz: string) => void;
  updateNotifications: (notifications: NotificationSettings) => void;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'auto'>('light');
  const [language, setLanguageState] = useState<'en' | 'es' | 'fr' | 'de'>('en');
  const [timezone, setTimezoneState] = useState('UTC');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    jobAlerts: true,
    messageAlerts: true,
  });

  // Apply theme to DOM
  const applyTheme = (themeValue: 'light' | 'dark' | 'auto') => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    if (themeValue === 'dark') {
      root.classList.add('dark');
    } else if (themeValue === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto mode - detect system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (typeof window === 'undefined') return;
      
      // First load from localStorage (INSTANT - no loading screen!)
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
      const savedLanguage = localStorage.getItem('language') as 'en' | 'es' | 'fr' | 'de' | null;
      const savedTimezone = localStorage.getItem('timezone');
      
      if (savedTheme) {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      }
      if (savedLanguage) setLanguageState(savedLanguage);
      if (savedTimezone) setTimezoneState(savedTimezone);

      // Then fetch from backend to sync
      await refreshSettings();
      setIsLoading(false);
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('auto');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const refreshSettings = async () => {
    try {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('http://localhost:7000/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        
        // Sync Display Settings
        if (data.theme) {
          setThemeState(data.theme);
          localStorage.setItem('theme', data.theme);
          applyTheme(data.theme);
        }
        if (data.language) {
          setLanguageState(data.language);
          localStorage.setItem('language', data.language);
        }
        if (data.timezone) {
          setTimezoneState(data.timezone);
          localStorage.setItem('timezone', data.timezone);
        }
        
        // Sync Notification Settings
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  const setLanguage = (lang: 'en' | 'es' | 'fr' | 'de') => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const setTimezone = (tz: string) => {
    setTimezoneState(tz);
    if (typeof window !== 'undefined') {
      localStorage.setItem('timezone', tz);
    }
  };

  const updateNotifications = (newNotifications: NotificationSettings) => {
    setNotifications(newNotifications);
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        language,
        timezone,
        notifications,
        setTheme,
        setLanguage,
        setTimezone,
        updateNotifications,
        refreshSettings,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}