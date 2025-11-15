// src/features/user/context/NotificationContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";
import ErrorAlert from "@/features/user/components/common/ErrorAlert";
import SuccessMessage from "@/features/user/components/common/SuccessMessage";

type NotificationType = "success" | "error" | null;

interface NotificationState {
  type: NotificationType;
  title?: string;
  message?: string;
  files?: File[];
}

interface NotificationContextProps {
  notifySuccess: (message: string, files?: File[], durationMs?: number) => void;
  notifyError: (title: string, message?: string, durationMs?: number) => void;
  clearNotification: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClear = (durationMs?: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    const timeout = durationMs ?? 6000;
    timeoutRef.current = setTimeout(() => setNotification(null), timeout);
  };

  const notifySuccess = (message: string, files?: File[], durationMs?: number) => {
    setNotification({ type: "success", message, files });
    scheduleClear(durationMs);
  };

  const notifyError = (title: string, message?: string, durationMs?: number) => {
    setNotification({ type: "error", title, message });
    scheduleClear(durationMs ?? 8000);
  };

  const clearNotification = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setNotification(null);
  };

  useEffect(() => () => clearNotification(), []);

  return (
    <NotificationContext.Provider value={{ notifySuccess, notifyError, clearNotification }}>
      {children}
      {/* ✅ مكان عرض الرسائل */}
      <div className="fixed bottom-4 right-4 z-50 w-96 space-y-2">
        {notification?.type === "success" && (
          <SuccessMessage files={notification.files} message={notification.message} />
        )}
        {notification?.type === "error" && (
          <ErrorAlert title={notification.title || "خطأ"} message={notification.message} />
        )}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within NotificationProvider");
  return context;
}
