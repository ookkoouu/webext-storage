import { useCallback, useEffect, useState } from "react";
import type { SetStorage } from "../set";
import type { StorageValue } from "../types";

export type SetStorageHook<T> = readonly [
	value: T[],
	set: {
		add(value: T): Promise<T[]>;
		clear(): Promise<void>;
		delete(value: T): Promise<boolean>;
		has(value: T): Promise<boolean>;
	},
];

export function useSetStorage<T extends StorageValue>(
	storage: SetStorage<T>,
): SetStorageHook<T> {
	const [renderValue, setRenderValue] = useState<T[]>([]);

	const add = useCallback((value: T) => storage.add(value), [storage]);
	const clear = useCallback(() => storage.clear(), [storage]);
	const _delete = useCallback((value: T) => storage.delete(value), [storage]);
	const has = useCallback((value: T) => storage.has(value), [storage]);

	useEffect(() => {
		(async () => {
			setRenderValue(await storage.values());
		})();

		const unwatch = storage.watch((newValue) => {
			if (newValue === undefined) return;
			setRenderValue(newValue);
		});

		return () => {
			unwatch();
		};
	}, [storage]);

	return [
		renderValue,
		{
			add,
			clear,
			delete: _delete,
			has,
		},
	] as const;
}
