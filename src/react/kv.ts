import { useState, useRef, useCallback, useEffect } from "react";
import { StorageChangedCallback } from "../types";
import { type KVStorage } from "../kv";

export type KVStorageHook<T> = readonly [
  T,
  <K extends keyof T>(key: K, value: T[K]) => void,
];

export const useKVStorage = <T extends Record<string, unknown>>(
  instance: KVStorage<T>,
): KVStorageHook<T> => {
  const storage = useRef(instance);
  const isMounted = useRef(false);

  const [renderValue, setRenderValue] = useState<T>(storage.current.getAll());

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    storage.current.set(key, value);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    setRenderValue(storage.current.getAll());

    const listener: StorageChangedCallback<T> = (change) => {
      if (change.newValue !== undefined) {
        setRenderValue(change.newValue);
      }
    };
    storage.current.onChanged.addListener(listener);

    return () => {
      isMounted.current = false;
      storage.current.onChanged.removeListener(listener);
    };
  }, []);

  return [renderValue, set] as const;
};
