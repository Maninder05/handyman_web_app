"use client";

import { useState, useCallback } from "react";
import { ToastType } from "../components/Toast";

interface UseToastReturn {
  showToast: (message: string, type?: ToastType) => void;
  toastState: {
    message: string;
    type: ToastType;
    isVisible: boolean;
  };
  hideToast: () => void;
}

export function useToast(): UseToastReturn {
  const [toastState, setToastState] = useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToastState({
      message,
      type,
      isVisible: true,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastState((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  return {
    showToast,
    toastState,
    hideToast,
  };
}

