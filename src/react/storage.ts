import { useState, useRef, useCallback, useEffect } from "react";
import { type StorageChangedCallback } from "../types";
import { type Storage } from "../storage";

export type StorageHook<T> = readonly [
  T,
  {
    set(value: T): Promise<void>;
    setSync(value: T): void;
    get(): Promise<T>;
    getSync(): T;
    reset(): Promise<void>;
  },
];

export const useStorage = <T>(instance: Storage<T>): StorageHook<T> => {
  const storage = useRef(instance);
  const isMounted = useRef(false);
  const [renderValue, setRenderValue] = useState<T>(instance.defaultValue);

  const set = useCallback(async (value: T) => storage.current.set(value), []);
  const setSync = useCallback((value: T) => {
    storage.current.setSync(value);
  }, []);
  const get = useCallback(async () => storage.current.get(), []);
  const getSync = useCallback(() => storage.current.getSync(), []);
  const reset = useCallback(async () => storage.current.reset(), []);

  useEffect(() => {
    isMounted.current = true;
    setRenderValue(storage.current.getSync());

    const listener: StorageChangedCallback<T> = (change) => {
      if (change.newValue !== undefined && isMounted.current) {
        setRenderValue(change.newValue);
      }
    };

    storage.current.onChanged.addListener(listener);

    return () => {
      isMounted.current = false;
      storage.current.onChanged.removeListener(listener);
    };
  }, []);

  return [renderValue, { set, setSync, get, getSync, reset }] as const;
};
