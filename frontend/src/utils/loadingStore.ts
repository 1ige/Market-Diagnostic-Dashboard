import { useSyncExternalStore } from "react";

type Listener = () => void;

let pendingCount = 0;
const listeners = new Set<Listener>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

export const loadingStore = {
  start() {
    pendingCount += 1;
    emit();
  },
  stop() {
    pendingCount = Math.max(0, pendingCount - 1);
    emit();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return pendingCount;
  },
};

export function useGlobalLoading() {
  const count = useSyncExternalStore(
    loadingStore.subscribe,
    loadingStore.getSnapshot,
    loadingStore.getSnapshot
  );
  return { pendingCount: count, isLoading: count > 0 };
}
