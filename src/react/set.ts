import { useState, useRef, useCallback, useEffect } from "react";
import { type StorageChangedCallback } from "../types";
import { type SetStorage } from "../set";

export type SetStorageHook<T> = readonly [
  value: T[],
  storage: {
    add(value: T): void;
    clear(): void;
    delete(value: T): boolean;
    has(value: T): boolean;
    entries(): IterableIterator<[T, T]>;
    values(): IterableIterator<T>;
  },
];

export function useSetStorage<T>(instance: SetStorage<T>): SetStorageHook<T> {
  const storage = useRef(instance);
  const isMounted = useRef(false);

  const [renderValue, setRenderValue] = useState<T[]>(instance.defaultValue);

  const add = useCallback((value: T) => storage.current.add(value), []);
  const clear = useCallback(() => {
    storage.current.clear();
  }, []);
  const _delete = useCallback((value: T) => storage.current.delete(value), []);
  const has = useCallback((value: T) => storage.current.has(value), []);
  const entries = useCallback(() => storage.current.entries(), []);
  const values = useCallback(() => storage.current.values(), []);

  useEffect(() => {
    isMounted.current = true;
    setRenderValue([...storage.current.values()]);

    const listener: StorageChangedCallback<T[]> = (change) => {
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

  return [
    renderValue,
    {
      add,
      clear,
      delete: _delete,
      has,
      entries,
      values,
    },
  ] as const;
}
