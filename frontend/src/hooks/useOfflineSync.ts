/**
 * useOfflineSync — Phase 9
 *
 * Hook that handles:
 *   - Network status detection
 *   - Flushing queued offline progress to backend when back online
 *   - Service Worker registration & messaging for course downloads
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { getPendingProgress, clearSyncedProgress, saveCourseDownload, deleteCourseDownload, type DownloadedCourse } from "../lib/indexeddb";
import { API_BASE_URL } from "../api/client";
import { supabase } from "../lib/supabase";

export type DownloadQuality = "data_saver" | "standard" | "high";

const QUALITY_SIZE_MULTIPLIER: Record<DownloadQuality, number> = {
  data_saver: 0.3,
  standard: 1.0,
  high: 2.2,
};

const BASE_COURSE_SIZE = 20 * 1024 * 1024; // 20MB base

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const syncingRef = useRef(false);

  const flushQueue = useCallback(async () => {
    if (syncingRef.current || !isOnline) return;
    syncingRef.current = true;

    try {
      const pending = await getPendingProgress();
      if (pending.length === 0) return;

      // Get auth token
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token || localStorage.getItem("sanket_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const synced: number[] = [];
      for (const record of pending) {
        try {
          const res = await fetch(`${API_BASE_URL}/learning/progress`, {
            method: "POST",
            headers,
            body: JSON.stringify(record.payload),
          });
          if (res.ok && record.id !== undefined) synced.push(record.id);
        } catch (_) {}
      }

      if (synced.length > 0) {
        await clearSyncedProgress(synced);
        console.log(`[SanketSync] Synced ${synced.length} offline progress records.`);
      }
    } finally {
      syncingRef.current = false;
    }
  }, [isOnline]);

  // Auto-flush when coming back online
  useEffect(() => {
    if (isOnline) {
      flushQueue();
    }
  }, [isOnline, flushQueue]);

  return { isOnline, flushQueue };
}

// ── SW Messaging ─────────────────────────────────────────────

export function useServiceWorker() {
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => setSwReady(true));
    }
  }, []);

  const cacheCourse = useCallback(
    async (
      courseId: string,
      title: string,
      category: string,
      difficulty: string,
      lessonCount: number,
      quality: DownloadQuality,
      assetUrls: string[]
    ): Promise<void> => {
      // Persist metadata to IndexedDB
      const course: DownloadedCourse = {
        course_id: courseId,
        title,
        category,
        difficulty,
        quality,
        size_bytes: Math.round(BASE_COURSE_SIZE * QUALITY_SIZE_MULTIPLIER[quality] * lessonCount),
        downloaded_at: new Date().toISOString(),
        lesson_count: lessonCount,
        version: 1,
      };
      await saveCourseDownload(course);

      // Tell SW to cache the asset URLs
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({ type: "CACHE_COURSE", courseId, urls: assetUrls });
    },
    []
  );

  const deleteCourse = useCallback(async (courseId: string): Promise<void> => {
    await deleteCourseDownload(courseId);
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "DELETE_COURSE", courseId });
  }, []);

  return { swReady, cacheCourse, deleteCourse };
}
