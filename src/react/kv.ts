import { useCallback, useEffect, useRef, useState } from "react";
import type { KVStorage } from "../kv";

export type KVStorageHook<T> = readonly [
	T,
	{
		set(value: T): void;
		setItem<K extends keyof T>(key: K, value: T[K]): void;
		reset(): void;
	},
];

export const useKVStorage = <T extends Record<string, unknown>>(
	instance: KVStorage<T>,
): KVStorageHook<T> => {
	const isMounted = useRef(false);

	const [renderValue, setRenderValue] = useState(instance.get());

	const set = useCallback((value: T) => instance.set(value), [instance]);
	const setItem = useCallback(
		<K extends keyof T>(key: K, value: T[K]) => instance.setItem(key, value),
		[instance],
	);
	const reset = useCallback(() => instance.reset(), [instance]);

	useEffect(() => {
		isMounted.current = true;
		setRenderValue(instance.get());

		const unwatch = instance.watch((newValue) => {
			if (isMounted.current) {
				setRenderValue(newValue);
			}
		});
		return () => {
			isMounted.current = false;
			unwatch();
		};
	}, [instance]);

	return [renderValue, { set, setItem, reset }] as const;
};

export type KVStorageItemHook<T> = readonly [T, (value: T) => void];

export const useKVStorageItem = <
	T extends Record<string, unknown>,
	K extends keyof T,
>(
	instance: KVStorage<T>,
	key: K,
) => {
	const [renderValue, setRenderValue] = useState(instance.getItem(key));

	const setItem = useCallback(
		(value: T[K]) => instance.setItem(key, value),
		[instance, key],
	);

	useEffect(() => {
		const unwatch = instance.watchItem(key, (newValue) => {
			setRenderValue(newValue);
		});
		return () => {
			unwatch();
		};
	}, [instance, key]);

	return [renderValue, setItem] as const;
};
