import { Storage, type StorageOptions } from "./storage";

export type MapStorageOptions<T> = {
  defaultValue: Record<string, T> | Array<[string, T]>;
} & StorageOptions;

export class MapStorage<T> implements Map<string, T> {
  protected storage: Storage<Array<[string, T]>>;
  protected cache: Map<string, T>;
  readonly defaultValue: Array<[string, T]>;
  get size(): number {
    return this.cache.size;
  }

  onChanged: Pick<
    chrome.events.Event<
      (change: {
        newValue?: Array<[string, T]>;
        oldValue?: Array<[string, T]>;
      }) => void
    >,
    "addListener" | "hasListener" | "removeListener"
  >;

  constructor(key: string, options?: Partial<MapStorageOptions<T>>) {
    let init = options?.defaultValue ?? [];
    init = Array.isArray(init) ? init : Object.entries(init);
    this.defaultValue = init;
    this.storage = new Storage(key, init, options);
    this.cache = new Map<string, T>();
    this.onChanged = this.storage.onChanged;
  }

  protected startSync() {
    this.storage.onChanged.addListener((change) => {
      if (change.newValue === undefined) {
        return;
      }

      this.cache = new Map(change.newValue);
    });
  }

  protected async save() {
    return this.storage.set([...this.cache]);
  }

  protected async restore() {
    const remote = await this.storage.get();
    this.cache = new Map(remote);
  }

  toObject(): Record<string, T> {
    return Object.fromEntries(this.cache);
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    const res = this.cache.delete(key);
    this.save();
    return res;
  }

  forEach(
    callbackfn: (value: T, key: string, map: Map<string, T>) => void,
    thisArg?: unknown,
  ): void {
    this.cache.forEach(callbackfn, thisArg);
  }

  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  set(key: string, value: T): this {
    this.cache.set(key, value);
    this.save();
    return this;
  }

  entries(): IterableIterator<[string, T]> {
    return this.cache.entries();
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  values(): IterableIterator<T> {
    return this.cache.values();
  }

  [Symbol.iterator](): IterableIterator<[string, T]> {
    return this.cache.entries();
  }

  [Symbol.toStringTag] = "MapStorage";
}
