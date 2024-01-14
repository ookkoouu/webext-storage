import { useState, useRef, useCallback, useEffect } from "react";
import { type Watcher } from "../types";
import { type KVStorage } from "../kv";

export type KVStorageHook<T, K extends keyof T> = readonly [
  T[K],
  (value: T[K]) => void,
];

export const useKVStorage = <
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  instance: KVStorage<T>,
  key: K,
): KVStorageHook<T, K> => {
  const storage = useRef(instance);
  const isMounted = useRef(false);

  const [renderValue, setRenderValue] = useState<T[K]>(
    storage.current.get(key),
  );

  const set = useCallback(
    (value: T[K]) => {
      storage.current.set(key, value);
    },
    [key],
  );

  useEffect(() => {
    isMounted.current = true;
    setRenderValue(storage.current.get(key));

    const listener: Watcher<T>["callback"] = (change) => {
      const newValue = change.newValue as T[K] | undefined;
      if (newValue !== undefined) {
        setRenderValue(newValue);
      }
    };

    storage.current.watch(key, listener);

    return () => {
      isMounted.current = false;
      storage.current.unwatch(listener);
    };
  }, [key]);

  return [renderValue, set] as const;
};
