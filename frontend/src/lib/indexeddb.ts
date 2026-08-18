/**
 * Sanket Setu — IndexedDB Layer (Phase 9)
 *
 * Stores:
 *   - offline_progress: Lesson/quiz progress made offline
 *   - pending_progress: Records queued for backend sync
 *   - downloaded_courses: Metadata of downloaded courses
 */

const DB_NAME = "sanket_setu";
const DB_VERSION = 1;

export interface OfflineProgressRecord {
  id?: number;
  lesson_id: string;
  course_id: string;
  completed: boolean;
  quiz_score?: number;
  scenario_completed?: boolean;
  time_spent_seconds?: number;
  completed_at?: string;
  synced: boolean;
}

export interface PendingProgressRecord {
  id?: number;
  payload: OfflineProgressRecord;
  queued_at: string;
}

export interface DownloadedCourse {
  course_id: string;
  title: string;
  category: string;
  difficulty: string;
  quality: "data_saver" | "standard" | "high";
  size_bytes: number;
  downloaded_at: string;
  lesson_count: number;
  version: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("offline_progress")) {
        const store = db.createObjectStore("offline_progress", { keyPath: "id", autoIncrement: true });
        store.createIndex("by_lesson", "lesson_id", { unique: false });
        store.createIndex("by_course", "course_id", { unique: false });
      }

      if (!db.objectStoreNames.contains("pending_progress")) {
        db.createObjectStore("pending_progress", { keyPath: "id", autoIncrement: true });
      }

      if (!db.objectStoreNames.contains("downloaded_courses")) {
        db.createObjectStore("downloaded_courses", { keyPath: "course_id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Progress ──────────────────────────────────────────────────

export async function saveOfflineProgress(record: OfflineProgressRecord): Promise<void> {
  const db = await openDB();

  // Upsert offline_progress
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["offline_progress", "pending_progress"], "readwrite");
    tx.objectStore("offline_progress").put({ ...record, synced: false });
    // Queue for sync
    tx.objectStore("pending_progress").add({
      payload: record,
      queued_at: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  // Request background sync if available
  try {
    const reg = await navigator.serviceWorker.ready;
    if ("sync" in reg) {
      await (reg as any).sync.register("sanket-progress-sync");
    }
  } catch (_) {}
}

export async function getPendingProgress(): Promise<PendingProgressRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_progress", "readonly");
    const req = tx.objectStore("pending_progress").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function clearSyncedProgress(ids: number[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("pending_progress", "readwrite");
  const store = tx.objectStore("pending_progress");
  for (const id of ids) store.delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Downloaded Courses ────────────────────────────────────────

export async function saveCourseDownload(course: DownloadedCourse): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("downloaded_courses", "readwrite");
    tx.objectStore("downloaded_courses").put(course);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDownloadedCourses(): Promise<DownloadedCourse[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("downloaded_courses", "readonly");
    const req = tx.objectStore("downloaded_courses").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCourseDownload(courseId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("downloaded_courses", "readwrite");
    tx.objectStore("downloaded_courses").delete(courseId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getTotalStorageUsed(): Promise<number> {
  const courses = await getDownloadedCourses();
  return courses.reduce((sum, c) => sum + c.size_bytes, 0);
}
