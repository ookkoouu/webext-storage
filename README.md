# webext-storage

A library of Web-Extension Storage with inter context sync, collections, hooks, etc.  
Inspired by [@plasmohq/storage](https://github.com/PlasmoHQ/storage).

## Features

- Context syncing (Contents, Popup, Background)
- Collections (Map, Set)
- Key-Value
- React Hooks

## APIs

```ts
const storage = new Storage<T>(key: string, defaultValue: T, options?: StorageOptions);

const map = new MapStorage<K,V>(key: string, defaultValue: [K,V][], options?: MapStorageOptions);


type WatchCallback<T> = (newValue: T, oldValue?: T) => void;
type Watchable<T> = {
	watch: (callback: WatchCallback<T>) => Unwatcher;
	unwatch: (id?: string) => void;
};

interface Storage<T> extends Watchable<T> {
	get: () => Promise<T>;
	getSync: () => T;
	set: (value: T) => Promise<void>;
	setSync: (value: T) => void;
	reset: () => Promise<void>;
}

interface MapStorage<K, V> extends Map<K, V>, Watchable<Map<K, V>> {
	reset: () => void;
}

interface SetStorage<T> extends Set<T>, Watchable<Set<T>> {
	reset: () => void;
}

interface KVStorage<T extends Record<string, unknown>> extends Watchable<T> {
	get: () => T;
	getItem: <K extends keyof T>(key: K) => T[K];
	set: (value: T) => void;
	setItem: <K extends keyof T>(key: K, value: T[K]) => void;
	reset: () => void;
	watchItem: <K extends keyof T>(key: K, callback: WatchCallback<T[K]>) => Unwatcher;
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

const kvStorage = new KVStorage("kv", entries);

// Listen changes by key
kvStorage.watchItem("appEnable", (newValue: boolean) => {});
```

### Hooks

```jsx
const instance = new SetStorage("items", [], { deepEqual: true });

function ItemList() {
	const [items, itemSet] = useSetStorage(instance);

	const cb = (item) => {
		itemSet.delete(item);
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
