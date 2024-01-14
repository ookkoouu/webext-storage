export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONValue[];
export type JSONObject = { [key: string]: JSONValue };

export type JsonTransformer = {
  replacer: (key: string, value: unknown) => unknown;
  reviver: (key: string, value: unknown) => unknown;
};

export type StorageArea = chrome.storage.StorageArea;
export type StorageAreaName = keyof Pick<
  typeof chrome.storage,
  "local" | "sync" | "session"
>;
type StorageAreaChangedCallback = Parameters<
  typeof chrome.storage.local.onChanged.addListener
>[0];
export type StorageChanges = Parameters<StorageAreaChangedCallback>[0];
export type StorageChange<T = unknown> = { newValue?: T; oldValue?: T };
export type StorageChangedCallback<T> = (change: StorageChange<T>) => void;
export type ExtensionStorage = typeof chrome.storage;

export type Watcher<T extends Record<string, unknown>> = {
  [K in keyof T]: {
    key: K;
    callback: StorageChangedCallback<T[K]>;
  };
}[keyof T];
