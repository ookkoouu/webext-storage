import { Storage, type StorageOptions } from "./storage";
import type {
  JSONObject,
  StorageChange,
  StorageChangedCallback,
  Watcher,
} from "./types";

function diffObject(
  newObject: Record<string, unknown>,
  oldObject: Record<string, unknown>,
) {
  return Object.fromEntries(
    Object.entries(newObject).filter(([k, v]) => v !== oldObject[k]),
  );
}

export type KVStorageOptions = Record<string, unknown> & StorageOptions;

export class KVStorage<T extends JSONObject> {
  protected storage: Storage<T>;
  readonly defaultValue: T;
  protected watchers = new Set<Watcher<T>>();

  constructor(key: string, entries: T, options?: Partial<KVStorageOptions>) {
    this.storage = new Storage(key, entries, options);
    this.defaultValue = entries;
    this.startWatch();
  }

  protected startWatch() {
    this.storage.onChanged.addListener((change: StorageChange<T>) => {
      const newValueObject = change.newValue;
      const oldValueObject = change.oldValue;
      if (newValueObject === undefined || oldValueObject === undefined) {
        return;
      }

      const diff = diffObject(newValueObject, oldValueObject);
      for (const w of this.watchers) {
        if (!Object.hasOwn(diff, w.key)) {
          continue;
        }

        w.callback({
          newValue: newValueObject[w.key],
          oldValue: oldValueObject[w.key],
        });
      }
    });
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    const map = this.getAll();
    map[key] = value;
    this.storage.set(map);
  }

  get<K extends keyof T>(key: K): T[K] {
    const map = this.getAll();
    return map[key];
  }

  getAll(): T {
    return this.storage.getSync();
  }

  reset(): void {
    this.storage.set(this.defaultValue);
  }

  watch<W extends Watcher<T>>(key: W["key"], callback: W["callback"]) {
    this.watchers.add({ key, callback });
  }

  unwatch(callback: StorageChangedCallback<T[keyof T]>) {
    for (const e of this.watchers) {
      if (e.callback === callback) {
        this.watchers.delete(e);
      }
    }
  }
}
