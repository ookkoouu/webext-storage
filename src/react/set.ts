import { useCallback, useEffect, useRef, useState } from "react";
import type { SetStorage } from "../set";

export type SetStorageHook<T> = readonly [
	value: T[],
	storage: {
		add(value: T): void;
		clear(): void;
		delete(value: T): boolean;
		has(value: T): boolean;
		entries(): IterableIterator<[T, T]>;
		values(): IterableIterator<T>;
		reset(): void;
	},
];

export function useSetStorage<T>(instance: SetStorage<T>): SetStorageHook<T> {
	const isMounted = useRef(false);

	const [renderValue, setRenderValue] = useState<T[]>(instance.defaultValue);

	const add = useCallback((value: T) => instance.add(value), [instance]);
	const clear = useCallback(() => instance.clear(), [instance]);
	const _delete = useCallback((value: T) => instance.delete(value), [instance]);
	const has = useCallback((value: T) => instance.has(value), [instance]);
	const entries = useCallback(() => instance.entries(), [instance]);
	const values = useCallback(() => instance.values(), [instance]);
	const reset = useCallback(() => instance.reset(), [instance]);

	useEffect(() => {
		isMounted.current = true;
		setRenderValue([...instance.values()]);

		const unwatch = instance.watch((newValue) => {
			if (isMounted.current) {
				setRenderValue([...newValue]);
			}
		});

		return () => {
			isMounted.current = false;
			unwatch();
		};
	}, [instance]);

	return [
		renderValue,
		{
			add,
			clear,
			delete: _delete,
			has,
			entries,
			values,
			reset,
		},
	] as const;
}
