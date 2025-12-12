import { create } from 'zustand'

/**
 * Minimal reel state store using sessionStorage.
 * Persists current reel index and playback times within the same session.
 */
const STORAGE_KEY = 'reelState'

const loadFromStorage = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

const saveToStorage = (state) => {
  try {
    const toSave = {
      currentReelId: state.currentReelId ?? null,
      playbackTime: state.playbackTime ?? 0,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (e) {
    // ignore storage errors
  }
}

const initial = loadFromStorage()

export const useReelStore = create((set, get) => ({
  currentReelId: initial.currentReelId ?? null,
  playbackTime: initial.playbackTime ?? 0,

  setCurrentReel: (reelId, time = 0) => {
    set({ currentReelId: reelId, playbackTime: time })
    saveToStorage(get())
  },

  clearReel: () => {
    set({ currentReelId: null, playbackTime: 0 })
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch (e) {}
  },
}))
