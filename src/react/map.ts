import { useState, useRef, useCallback, useEffect } from "react";
import { type StorageChangedCallback } from "../types";
import { type MapStorage } from "../map";

export type MapStorageHook<T> = readonly [
  value: Array<[string, T]>,
  storage: {
    toObject(): Record<string, T>;
    clear(): void;
    delete(key: string): boolean;
    get(key: string): T | undefined;
    has(key: string): boolean;
    set(key: string, value: T): void;
    entries(): IterableIterator<[string, T]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<T>;
  },
];

export function useMapStorage<K extends string, V>(
  instance: MapStorage<K, V>,
): MapStorageHook<V> {
  const storage = useRef(instance);
  const isMounted = useRef(false);

  const [renderValue, setRenderValue] = useState<Array<[K, V]>>(
    instance.defaultValue,
  );

  const toObject = useCallback(() => storage.current.toObject(), []);
  const clear = useCallback(() => {
    storage.current.clear();
  }, []);
  const _delete = useCallback((key: K) => storage.current.delete(key), []);
  const get = useCallback((key: K) => storage.current.get(key), []);
  const has = useCallback((key: K) => storage.current.has(key), []);
  const set = useCallback(
    (key: K, value: V) => storage.current.set(key, value),
    [],
  );
  const entries = useCallback(() => storage.current.entries(), []);
  const keys = useCallback(() => storage.current.keys(), []);
  const values = useCallback(() => storage.current.values(), []);

  useEffect(() => {
    isMounted.current = true;
    setRenderValue([...storage.current.entries()]);

    const listener: StorageChangedCallback<Array<[K, V]>> = (change) => {
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
      toObject,
      clear,
      delete: _delete,
      get,
      has,
      set,
      entries,
      keys,
      values,
    },
  ] as const;
}
