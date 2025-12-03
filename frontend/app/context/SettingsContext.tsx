"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  jobAlerts: boolean;
  messageAlerts: boolean;
}

interface SettingsContextType {
  theme: "light" | "dark" | "auto";
  language: "en" | "es" | "fr" | "de";
  timezone: string;
  notifications: NotificationSettings;
  setTheme: (theme: "light" | "dark" | "auto") => void;
  setLanguage: (lang: "en" | "es" | "fr" | "de") => void;
  setTimezone: (tz: string) => void;
  updateNotifications: (n: NotificationSettings) => void;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<"light" | "dark" | "auto">("light");
  const [language, setLanguageState] = useState<"en" | "es" | "fr" | "de">("en");
  const [timezone, setTimezoneState] = useState("UTC");
  const [isLoading, setIsLoading] = useState(true);

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    jobAlerts: true,
    messageAlerts: true,
  });

  //----------------------------------------
  // 🔥 Apply theme to <html>
  //----------------------------------------
  const applyTheme = (selectedTheme: "light" | "dark" | "auto") => {
    if (typeof window === "undefined") return;

    const html = document.documentElement;

    html.classList.remove("light", "dark");

    if (selectedTheme === "light") {
      html.classList.add("light");
    } else if (selectedTheme === "dark") {
      html.classList.add("dark");
    } else if (selectedTheme === "auto") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      html.classList.add(prefersDark ? "dark" : "light");
    }
  };

  //----------------------------------------
  // 🔥 Load settings on mount
  //----------------------------------------
  useEffect(() => {
    const load = async () => {
      const localTheme = localStorage.getItem("theme") as
        | "light"
        | "dark"
        | "auto"
        | null;

      const localLanguage = localStorage.getItem("language") as
        | "en"
        | "es"
        | "fr"
        | "de"
        | null;

      const localTimezone = localStorage.getItem("timezone");

      if (localTheme) setThemeState(localTheme);
      if (localLanguage) setLanguageState(localLanguage);
      if (localTimezone) setTimezoneState(localTimezone);

      applyTheme(localTheme ?? "light");

      await refreshSettings();

      setIsLoading(false);
    };

    load();
  }, []);

  //----------------------------------------
  // 🔥 Re-apply theme if changed
  //----------------------------------------
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  //----------------------------------------
  // 🌀 AUTO MODE → Listen for OS dark mode
  //----------------------------------------
  useEffect(() => {
    if (theme !== "auto") return;

    const listener = () => applyTheme("auto");

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [theme]);

  //----------------------------------------
  // 🔥 Fetch from backend
  //----------------------------------------
  const refreshSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:7000/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();

      if (data.theme) {
        setThemeState(data.theme);
        localStorage.setItem("theme", data.theme);
        applyTheme(data.theme);
      }

      if (data.language) {
        setLanguageState(data.language);
        localStorage.setItem("language", data.language);
      }

      if (data.timezone) {
        setTimezoneState(data.timezone);
        localStorage.setItem("timezone", data.timezone);
      }

      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed loading settings:", err);
    }
  };

  //----------------------------------------
  // 🔥 Update state + persist
  //----------------------------------------
  const setTheme = (t: "light" | "dark" | "auto") => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  };

  const setLanguage = (lang: "en" | "es" | "fr" | "de") => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const setTimezone = (tz: string) => {
    setTimezoneState(tz);
    localStorage.setItem("timezone", tz);
  };

  const updateNotifications = (n: NotificationSettings) => {
    setNotifications(n);
  };

  //----------------------------------------
  // RETURN PROVIDER
  //----------------------------------------
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
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within <SettingsProvider>");
  }
  return ctx;
}
