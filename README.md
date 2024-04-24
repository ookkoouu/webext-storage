# webext-storage

A library of Web-Extension Storage with inter context sync, collections, hooks, etc.

## APIs

```ts
function createStorage<T>(key: string, opts?: CreateStorageOptions): Storage<T>;

interface Storage<T extends StorageValue> {
	get: () => Promise<T | undefined>;
	set: (value: T) => Promise<void>;
	watch: (callback: WatchCallback<T>) => Unwatch;
}

interface MapStorage<K extends StorageValue, V extends StorageValue> {
	clear: () => Promise<void>;
	delete: (key: K) => Promise<boolean>;
	entries: () => Promise<[K, V][]>;
	forEach: (callback: (value: V, key: K, map: [K, V][]) => unknown) => void;
	get: (key: K) => Promise<V | undefined>;
	has: (key: K) => Promise<boolean>;
	keys: () => Promise<K[]>;
	set: (key: K, value: V) => Promise<void>;
	values: () => Promise<V[]>;
	watch: (callback: WatchCallback<[K, V][]>) => Unwatch;
}

interface KVStorage<T extends KVEntries> {
	readonly init: T;
	get: () => Promise<T>;
	getItem: <K extends keyof T>(key: K) => Promise<T[K]>;
	reset: () => Promise<void>;
	set: (value: T) => Promise<void>;
	setItem: <K extends keyof T>(key: K, value: T[K]) => Promise<void>;
	watch: (callback: WatchCallback<T>) => Unwatch;
	watchItem: <K extends keyof T>(
		key: K,
		callback: WatchCallback<T[K]>,
	) => Unwatch;
}
```

## Example

### KV

```ts
const entries = {
	useFor: "config",
	appEnable: true,
	days: 100,
};

const kv = createKVStorage("kv", { area: "sync", init: entries });

// Listen changes by key
kv.watchItem("appEnable", (newValue: boolean) => {});
```

### Hooks

```jsx
const instance = createStorage("items");

function ItemList() {
	const [items, set] = useSetStorage(instance);

	const cb = async (item) => {
		await set.delete(item);
	};

	return (
		<li>
			{items.map((item) => (
				<ul onClick={cb}>{item}</ul>
			))}
		</li>
	);
}
```
