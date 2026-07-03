import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { SectionProgress, ProgressStore } from './types';
import { defaultSectionProgress } from './types';
import { loadProgress, saveProgress } from './storage';

export interface ProgressContextValue {
  store: ProgressStore;
  getSectionProgress: (topicId: string, sectionId: string) => SectionProgress;
  setSectionProgress: (
    topicId: string,
    sectionId: string,
    updater: Partial<SectionProgress>,
  ) => void;
  updateSectionProgress: (
    topicId: string,
    sectionId: string,
    updater: (prev: SectionProgress) => SectionProgress,
  ) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<ProgressStore>(loadProgress);

  const setSectionProgress = useCallback(
    (topicId: string, sectionId: string, updater: Partial<SectionProgress>) => {
      setStore((prev) => {
        const topic = prev[topicId] ?? {};
        const current = topic[sectionId] ?? defaultSectionProgress();
        const next = { ...current, ...updater };

        const newStore = {
          ...prev,
          [topicId]: {
            ...topic,
            [sectionId]: next,
          },
        };
        saveProgress(newStore);
        return newStore;
      });
    },
    [],
  );

  const updateSectionProgress = useCallback(
    (topicId: string, sectionId: string, updater: (prev: SectionProgress) => SectionProgress) => {
      setStore((prev) => {
        const topic = prev[topicId] ?? {};
        const current = topic[sectionId] ?? defaultSectionProgress();
        const next = updater(current);

        const newStore = {
          ...prev,
          [topicId]: {
            ...topic,
            [sectionId]: next,
          },
        };
        saveProgress(newStore);
        return newStore;
      });
    },
    [],
  );

  const getSectionProgress = useCallback(
    (topicId: string, sectionId: string) => {
      return store[topicId]?.[sectionId] ?? defaultSectionProgress();
    },
    [store],
  );

  const value = useMemo(
    () => ({ store, getSectionProgress, setSectionProgress, updateSectionProgress }),
    [store, getSectionProgress, setSectionProgress, updateSectionProgress],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error('useProgress must be used inside <ProgressProvider>');
  }
  return ctx;
}

// --- Per-section convenience hook ---

interface UseSectionProgressReturn {
  progress: SectionProgress;
  markViewed: () => void;
  markCompleted: () => void;
  setData: (key: string, value: unknown) => void;
  getData: (key: string) => unknown;
}

export function useSectionProgress(
  topicId: string,
  sectionId: string,
): UseSectionProgressReturn {
  const { getSectionProgress, setSectionProgress, updateSectionProgress } = useProgress();
  const progress = getSectionProgress(topicId, sectionId);

  const markViewed = useCallback(() => {
    setSectionProgress(topicId, sectionId, { viewed: true });
  }, [topicId, sectionId, setSectionProgress]);

  const markCompleted = useCallback(() => {
    setSectionProgress(topicId, sectionId, { viewed: true, completed: true });
  }, [topicId, sectionId, setSectionProgress]);

  const setData = useCallback(
    (key: string, value: unknown) => {
      updateSectionProgress(topicId, sectionId, (prev) => ({
        ...prev,
        data: { ...prev.data, [key]: value },
      }));
    },
    [topicId, sectionId, updateSectionProgress],
  );

  const getData = useCallback(
    (k: string) => progress.data[k],
    [progress],
  );

  return { progress, markViewed, markCompleted, setData, getData };
}
