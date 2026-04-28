"use client";
import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.hostname === "localhost") return; // skip in dev to avoid stale shells
    const tid = setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, 1500);
    return () => clearTimeout(tid);
  }, []);
  return null;
}
