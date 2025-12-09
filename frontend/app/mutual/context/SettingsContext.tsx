"use client";

import { createContext, useContext, useState, useEffect } from "react";

// Allowed types
type Theme = "light" | "dark" | "auto";
type Language = "en" | "es" | "fr" | "de";

// Interface for notification settings
interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  jobAlerts: boolean;
  messageAlerts: boolean;
}

interface UserSettings {
  theme: Theme;
  language: Language;
  timezone: string;
  notifications: NotificationSettings;
}

interface SettingsContextType {
  settings: UserSettings | null;
  theme: Theme;
  language: Language;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateTheme: (t: Theme) => Promise<void>;
  updateLanguage: (l: Language) => Promise<void>;
  updateNotifications: (data: NotificationSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings on load
  const refreshSettings = async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      setSettings(data);
      setTheme(data.theme);
      setLanguage(data.language);
      applyTheme(data.theme);
    } catch (err) {
      console.log("Error loading settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Apply theme to DOM
  const applyTheme = (t: Theme) => {
    const html = document.documentElement;
    html.classList.remove("light", "dark");

    if (t === "light") html.classList.add("light");
    else if (t === "dark") html.classList.add("dark");
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      html.classList.add(prefersDark ? "dark" : "light");
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  // Update theme
  const updateTheme = async (t: Theme) => {
    try {
      const res = await fetch("/api/settings/display", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: t }),
      });

      if (!res.ok) return;

      setTheme(t);
      applyTheme(t);
      refreshSettings();
    } catch (err) {
      console.log("Theme update failed");
    }
  };

  // Update language
  const updateLanguage = async (l: Language) => {
    try {
      const res = await fetch("/api/settings/display", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: l }),
      });

      if (!res.ok) return;

      setLanguage(l);
      refreshSettings();
    } catch {
      console.log("Language update failed");
    }
  };

  // Update notification settings
  const updateNotifications = async (data: NotificationSettings) => {
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) return;

      refreshSettings();
    } catch {
      console.log("Notifications update failed");
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        theme,
        language,
        isLoading,
        refreshSettings,
        updateTheme,
        updateLanguage,
        updateNotifications,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
};
