import { SavedSession } from './types';

const STORAGE_KEY = 'forma.sessions.v1';

function readMap(): Record<string, SavedSession> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, SavedSession>) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, SavedSession>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Quota exceeded or storage unavailable — swallow. The caller treats save
    // as best-effort; the UI toast layer can surface failures if needed.
  }
}

export function saveSession(saved: SavedSession): void {
  const map = readMap();
  map[saved.id] = saved;
  writeMap(map);
}

export function loadAllSavedSessions(): SavedSession[] {
  const map = readMap();
  return Object.values(map).sort((a, b) => b.finalizedAt - a.finalizedAt);
}

export function loadSavedSession(id: string): SavedSession | null {
  const map = readMap();
  return map[id] ?? null;
}

export function deleteSavedSession(id: string): void {
  const map = readMap();
  delete map[id];
  writeMap(map);
}

export function renameSavedSession(id: string, title: string): void {
  const map = readMap();
  const existing = map[id];
  if (!existing) return;
  map[id] = { ...existing, title };
  writeMap(map);
}
