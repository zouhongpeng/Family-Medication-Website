'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AppState, Medicine, Profile } from './types';

const STORAGE_KEY = 'med-mgr:v1';
const EMPTY: AppState = { profiles: [], activeProfileId: null, medicines: [], taken: {} };

interface StoreApi {
  state: AppState;
  mounted: boolean;
  ready: boolean;
  addProfile: (name: string, avatar: string, color: string) => Profile;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  addMedicine: (med: Omit<Medicine, 'id' | 'createdAt'>) => Medicine;
  updateMedicine: (id: string, patch: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  toggleTaken: (dateStr: string, key: string) => void;
  isTaken: (dateStr: string, key: string) => boolean;
  reset: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed && Array.isArray(parsed.profiles)) {
          setState({
            profiles: parsed.profiles || [],
            activeProfileId: parsed.activeProfileId ?? null,
            medicines: parsed.medicines || [],
            taken: parsed.taken || {},
          });
        }
      }
    } catch {
      // ignore corrupted storage
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or unavailable
    }
  }, [state, mounted]);

  const setActiveProfile = useCallback((id: string) => {
    setState((s) => (s.activeProfileId === id ? s : { ...s, activeProfileId: id }));
  }, []);

  const addProfile = useCallback((name: string, avatar: string, color: string) => {
    const profile: Profile = { id: uid('p'), name, avatar, color, createdAt: Date.now() };
    setState((s) => ({
      ...s,
      profiles: [...s.profiles, profile],
      activeProfileId: s.activeProfileId ?? profile.id,
    }));
    return profile;
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setState((s) => {
      const removedMeds = s.medicines.filter((m) => m.profileId === id).map((m) => m.id);
      const removedIds = new Set(removedMeds);
      const taken: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(s.taken)) {
        taken[k] = v.filter((item) => {
          const medId = item.split('|')[0];
          return !removedIds.has(medId);
        });
      }
      return {
        ...s,
        profiles: s.profiles.filter((p) => p.id !== id),
        medicines: s.medicines.filter((m) => m.profileId !== id),
        activeProfileId: s.activeProfileId === id ? (s.profiles.filter((p) => p.id !== id)[0]?.id ?? null) : s.activeProfileId,
        taken,
      };
    });
  }, []);

  const addMedicine = useCallback((data: Omit<Medicine, 'id' | 'createdAt'>) => {
    const med: Medicine = { ...data, id: uid('m'), createdAt: Date.now() };
    setState((s) => ({ ...s, medicines: [...s.medicines, med] }));
    return med;
  }, []);

  const updateMedicine = useCallback((id: string, patch: Partial<Medicine>) => {
    setState((s) => ({
      ...s,
      medicines: s.medicines.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }, []);

  const deleteMedicine = useCallback((id: string) => {
    setState((s) => {
      const taken: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(s.taken)) {
        taken[k] = v.filter((item) => item.split('|')[0] !== id);
      }
      return { ...s, medicines: s.medicines.filter((m) => m.id !== id), taken };
    });
  }, []);

  const toggleTaken = useCallback((dateStr: string, key: string) => {
    setState((s) => {
      const list = s.taken[dateStr] || [];
      const has = list.includes(key);
      const next = has ? list.filter((x) => x !== key) : [...list, key];
      return { ...s, taken: { ...s.taken, [dateStr]: next } };
    });
  }, []);

  const isTaken = useCallback(
    (dateStr: string, key: string) => {
      return (state.taken[dateStr] || []).includes(key);
    },
    [state.taken],
  );

  const reset = useCallback(() => {
    setState(EMPTY);
  }, []);

  const api = useMemo<StoreApi>(
    () => ({
      state,
      mounted,
      ready: mounted && state.profiles.length > 0,
      addProfile,
      deleteProfile,
      setActiveProfile,
      addMedicine,
      updateMedicine,
      deleteMedicine,
      toggleTaken,
      isTaken,
      reset,
    }),
    [state, mounted, addProfile, deleteProfile, setActiveProfile, addMedicine, updateMedicine, deleteMedicine, toggleTaken, isTaken, reset],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}