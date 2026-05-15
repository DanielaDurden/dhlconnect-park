"use client";

import { useEffect } from "react";

export default function PushSubscription() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ) return;

    // Only proceed if permission hasn't been decided yet or already granted
    if (Notification.permission === "denied") return;

    navigator.serviceWorker.ready.then(async (registration) => {
      try {
        // If already subscribed, sync subscription to server silently
        let sub = await registration.pushManager.getSubscription();

        if (!sub) {
          if (Notification.permission !== "granted") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;
          }
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          });
        }

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });
      } catch {
        // Push setup failure is non-blocking
      }
    });
  }, []);

  return null;
}

